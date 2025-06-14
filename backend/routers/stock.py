# backend/routers/stock.py

from fastapi import APIRouter, HTTPException
from backend.models.stock import StockInCreate,StockOutCreate,StockSummary
from backend.db_connector import get_connection
from typing import Optional,List
from backend.models.stock import StockHistoryRecord  # ← 加這行

router = APIRouter(prefix="/api/stock", tags=["stock"])

@router.post("/in", summary="建立入庫單")
def create_stock_in(data: StockInCreate):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO stock_in_orders (product_id, quantity,  status)
            VALUES (%s, %s, %s)
        """, (data.product_id, data.quantity,  data.status))
        
        cursor.execute("SELECT purchase_price FROM products WHERE id=%s", (data.product_id,))
        purchase_price = cursor.fetchone()[0]
        
        # 2. 先抓目前庫存(舊庫存 = stock_flows 所有 change_qty 的 SUM)
        
        cursor.execute("""
            SELECT IFNULL(SUM(change_qty), 0)
            FROM stock_flows
            WHERE product_id = %s
        """, (data.product_id,))
        old_stock = cursor.fetchone()[0]
        
        # 3. 計算新庫存
        new_stock = old_stock + data.quantity

        # 4. 把這筆流向與新庫存一起寫進 stock_flows
        cursor.execute("""
            INSERT INTO stock_flows 
              (product_id, change_type, change_qty, stock_after, in_price)
            VALUES (%s, '入庫', %s, %s, %s)
        """, (data.product_id, data.quantity, new_stock, purchase_price))

        conn.commit()
        return {"ok": True, "message": "入庫單建立成功"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"資料庫錯誤：{str(e)}")
    finally:
        cursor.close()
        conn.close()

@router.post("/out", summary="建立出庫單")
def create_stock_out(data: StockOutCreate):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute("""
            INSERT INTO stock_out_orders (product_id, quantity, status)
            VALUES (%s, %s, %s)
        """, (data.product_id, data.quantity, data.status))

         # 2. 從 products 拿「售價」
        cursor.execute(
            "SELECT selling_price FROM products WHERE id = %s",
            (data.product_id,),
        )
        selling_price = cursor.fetchone()[0]

        # 查目前庫存
        cursor.execute("""
            SELECT IFNULL(SUM(change_qty), 0)
            FROM stock_flows
            WHERE product_id = %s
        """, (data.product_id,))
        old_stock = cursor.fetchone()[0]

        # 扣除新庫存
        new_stock = old_stock - data.quantity

        cursor.execute("""
            INSERT INTO stock_flows (product_id, change_type, change_qty, stock_after, out_price)
            VALUES (%s, '出庫', %s,%s, %s)
        """, (data.product_id, data.quantity, new_stock, selling_price),)  # ← 數量寫成負的

        conn.commit()
        return {"ok": True, "message": "出庫單建立成功"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"資料庫錯誤：{str(e)}")
    finally:
        cursor.close()
        conn.close()

@router.get("/summary",
    response_model=List[StockSummary], summary="商品進銷存報表")
def get_stock_summary(name: Optional[str]    = None,
    barcode: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        sql="""
    SELECT 
        p.id               AS product_id,
        p.name             AS product_name,
        p.spec             AS product_spec,
        p.barcode,
        p.pack_qty,
        p.unit,
        IFNULL(SUM(CASE WHEN f.change_type = '入庫' THEN f.change_qty ELSE 0 END), 0) AS total_in,
                IFNULL(SUM(CASE WHEN f.change_type = '出庫' THEN -f.change_qty ELSE 0 END), 0) AS total_out,
                IFNULL(SUM(
                    CASE
                      WHEN f.change_type='入庫' THEN f.change_qty
                      WHEN f.change_type='出庫' THEN -f.change_qty
                      ELSE 0
                    END
                ), 0) AS current_stock,
                -- 直接回傳原生 DATETIME
                MAX(f.created_at) AS last_updated
            FROM products p
            LEFT JOIN stock_flows f ON p.id = f.product_id
"""
        conditions, params = [], []
        if name:
            conditions.append("p.name LIKE %s")
            params.append(f"%{name}%")
        if barcode:
            conditions.append("p.barcode LIKE %s")
            params.append(f"%{barcode}%")
        if conditions:
            sql += " WHERE " + " AND ".join(conditions)

        sql += " GROUP BY p.id ORDER BY p.id"
        print("🟢 FINAL SQL:", sql)
        print("🟢 PARAMS:", params)
        cursor.execute(sql, params)
        return cursor.fetchall()
    except Exception as e:
        print("🔥 cursor.execute 發生錯誤：", e)
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"查詢錯誤：{str(e)}")
    finally:
        cursor.close()
        conn.close()


@router.get("/history", response_model=List[StockHistoryRecord], summary="查詢入出庫歷史紀錄")
def get_stock_history(product_name: Optional[str] = None,    barcode: Optional[str] = None):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        sql = """
            SELECT
                f.id,
                f.product_id,
                p.name AS product_name,
                p.barcode,
                p.spec,
                p.pack_qty,
                p.unit,
                f.change_type,
                f.change_qty,
                f.stock_after,
                f.in_price, 
                f.out_price, 
                DATE_FORMAT(f.created_at, '%%Y-%%m-%%d %%H:%%i:%%s') AS created_at
            FROM stock_flows f
            JOIN products p ON f.product_id = p.id
        """
        conditions = []
        params = []
        if product_name:
            conditions.append("p.name LIKE %s")
            params.append(f"%{product_name}%")
        if barcode:
            conditions.append("p.barcode LIKE %s")
            params.append(f"%{barcode}%")
        if conditions:
            sql += " WHERE " + " AND ".join(conditions)

        sql += " ORDER BY f.created_at DESC"
        print("✅ SQL:", sql)
        print("✅ PARAMS:", params)

        try:
            cursor.execute(sql, params)
        except Exception as e:
            print("🔥 cursor.execute 發生錯誤：", e)
            raise        
        try:
            result = cursor.fetchall()
            print("🟢 SQL 查詢結果：", result)
        except Exception as e:
            print("🔥 cursor.fetchall 發生錯誤：", e)
            raise

        return result

    except Exception as e:
        print("🔥 查詢整體異常：", e)
        raise HTTPException(status_code=500, detail=f"查詢錯誤：{str(e)}")
    finally:
        cursor.close()
        conn.close()
