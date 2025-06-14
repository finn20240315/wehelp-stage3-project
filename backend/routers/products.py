from fastapi import APIRouter, HTTPException
# from 是匯入語法，用來引入外部模組的功能。
# fastapi 是我們使用的 Web 框架。
# APIRouter 是 FastAPI 提供的類別，用來建立「路由模組」，把 API 分組管理。
# HTTPException 是 FastAPI 提供的例外處理工具，可以主動丟出錯誤訊息給前端。
from backend.db_connector import get_connection
from backend.models.products import ProductCreate,ProductResponse
import mysql.connector
from typing import Any,Optional,List

router = APIRouter(prefix="/api/products", tags=["products"])
# 建立一個子路由模組 router：
# 所有路徑都會以 /api/products 開頭
# Swagger 文件會將這組 API 分類為 "products"
# 建立一個叫 router 的路由群組。
# prefix="/api/products" 表示這群 API 都會以 /api/products 開頭。
# tags=["products"] 是用來在 Swagger 文件中分類的標籤。
# 以後這支 API 是 POST 到 /api/products。

@router.post(
    "",
    response_model=ProductResponse,
    summary="新增商品"
)
def create_product(product: ProductCreate):
    """
    1️⃣ 計算毛利率 (selling_price, purchase_price)
    2️⃣ 計算促銷毛利率 (promo_selling_price, promo_purchase_price)
    3️⃣ INSERT INTO products
    4️⃣ 取得 lastrowid
    5️⃣ 再 SELECT id, name, gross_margin, launch_date, updated_at 回傳
   """

    # 計算毛利率
    if product.selling_price == 0:
        gross_margin=0.0
    else:
        gross_margin = round(
            (product.selling_price - product.purchase_price)
            / product.selling_price * 100, 2
        )
    if not product.promo_selling_price or product.promo_selling_price == 0:
        promo_gross_margin = 0.0
    else:
        promo_gross_margin = round(
            (product.promo_selling_price - product.promo_purchase_price)
            / product.promo_selling_price * 100, 2
        )
    
    conn = get_connection()
    cursor = conn.cursor()
    dict_cur = None           # ← 先宣告

    try:
        # 1️⃣ INSERT
        cursor.execute(
            """
            INSERT INTO products (
            name, spec, length, width, height, barcode, 
            origin_country, shelf_life_value, shelf_life_unit
            , pack_qty, unit, launch_date,
            purchase_price, selling_price, gross_margin, 
            promo_purchase_price, promo_selling_price, promo_gross_margin
            ) VALUES (
            %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s
            )
            """,
            (
                product.name, product.spec, product.length, product.width, product.height,
                product.barcode, product.origin_country,
                product.shelf_life_value,product.shelf_life_unit,
                product.pack_qty,product.unit, product.launch_date,
                product.purchase_price, product.selling_price, gross_margin,
                product.promo_purchase_price,product.promo_selling_price,promo_gross_margin
            )
        )
        conn.commit()

        # 2️⃣ 取得新插入的主鍵 ID
        new_id = cursor.lastrowid

        # 3️⃣ 再 SELECT 出前端要的欄位
        dict_cur = conn.cursor(dictionary=True)
        dict_cur.execute(
            """
            SELECT id,name,spec,length,width, height,
            barcode, origin_country,
                shelf_life_value,shelf_life_unit,
                pack_qty,unit,launch_date,
                purchase_price, selling_price, gross_margin,
                promo_purchase_price,promo_selling_price,promo_gross_margin,  created_at,
  updated_at
            FROM products
            WHERE id = %s
            """,
            (new_id,)
        ) # 執行 SELECT，查詢剛剛插入且主鍵為 new_id 的那筆資料
        row = dict_cur.fetchone()
        # fetchone() 把查詢結果取回一筆。
        # 如果該 id 存在，就回傳一個 dict；如果沒有找到，則回傳 None
        
        if not row:
            raise HTTPException(status_code=500, detail="建立後讀取商品失敗")

        # 4️⃣ 回傳這個 dict，FastAPI 會自動轉成 ProductResponse
        return row
    except Exception:
        conn.rollback()
        raise
    finally:
        # 🚨 一定要 close()，不留 sleep 連線
        try: cursor.close()
        except: pass
        if dict_cur:
            try: dict_cur.close()
            except: pass
        conn.close()

@router.get("", response_model=list[ProductResponse], summary="取得商品列表")
def list_products(name: Optional[str] = None,barcode: Optional[str] = None
):
    """
    回傳 products 表中所有商品的基本資訊。
    """
    try:
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        sql = """
        SELECT
            id,
            name,
            spec,
            length,
            width,
            height,
            barcode,
            origin_country,
            
            shelf_life_value,
            shelf_life_unit,
            pack_qty,
            unit,
            launch_date,
                       
            purchase_price,
            selling_price,
            gross_margin,
                                  
            promo_purchase_price,
            promo_selling_price,
            promo_gross_margin,
            
            created_at,
            updated_at
        FROM products
        """
        conditions: list[str] = []
        params:     list     = []
        if name:
            conditions.append("name LIKE %s")
            params.append(f"%{name}%")
        if barcode:
            conditions.append("barcode LIKE %s")
            params.append(f"%{barcode}%")
        if conditions:
            sql += " WHERE " + " AND ".join(conditions)

        cursor.execute(sql, params)
        return cursor.fetchall()
    except mysql.connector.Error as e:
        print("❌ DB錯誤:", e)
        raise HTTPException(status_code=500, detail="資料庫錯誤")
    finally:
            if cursor:
                try:
                    cursor.close()
                except Exception as e:
                    print("❌ cursor.close() 失敗：", e)

            if conn and getattr(conn, "_cnx", None):  # ✅ 重點在這一行
                try:
                    conn.close()
                except Exception as e:
                    print("❌ conn.close() 失敗：", e)  # 避免 close None

@router.get("/{product_id}", response_model=ProductResponse)
def get_product(product_id: int) -> Any:
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        sql="""
            SELECT
                id,
                name,
                spec,
                length,
                width,
                height,
                barcode,
                origin_country,
                shelf_life_unit,
                shelf_life_value,
                pack_qty,
                unit,
                launch_date,
                purchase_price,
                selling_price,
                gross_margin,
                promo_purchase_price,
                promo_selling_price,
                promo_gross_margin,                       
                created_at,
                updated_at
            FROM products
            WHERE id = %s
        """
        cursor.execute(sql, (product_id,))
        print("✅ get_product 執行 SQL：", sql % (product_id,))  # 印出替換後的字串

        row = cursor.fetchone()
        print("✅ get_product 拿到 row：", row)    # 印出實際拿到的 dict

        if not row:
            raise HTTPException(status_code=404, detail="Product not found")
        return row
    except Exception as e:
        print("❌ get_product 例外：", e)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
            if cursor:
                try:
                    cursor.close()
                except Exception as e:
                    print("❌ cursor.close() 失敗：", e)

            if conn and getattr(conn, "_cnx", None):  # ✅ 重點在這一行
                try:
                    conn.close()
                except Exception as e:
                    print("❌ conn.close() 失敗：", e)  # 避免 close None


@router.put("/{product_id}", response_model=ProductResponse, summary="更新商品")
def update_product(product_id: int, product: ProductCreate):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # 1️⃣ 確認存在
        cursor.execute("SELECT 1 FROM products WHERE id = %s", (product_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Product not found")

        # 2️⃣ 計算毛利
        gross_margin = (
            0.0 if product.selling_price == 0 else
            round((product.selling_price - product.purchase_price) / product.selling_price * 100, 2)
        )
        promo_gross_margin = (
            0.0 if not product.promo_selling_price else
            round((product.promo_selling_price - product.promo_purchase_price) / product.promo_selling_price * 100, 2)
        )

        # 3️⃣ 執行 UPDATE
        cursor.execute("""
            UPDATE products SET
              name=%s, spec=%s, length=%s, width=%s, height=%s, barcode=%s,
              origin_country=%s, shelf_life_value=%s, shelf_life_unit=%s,
              pack_qty=%s, unit=%s, launch_date=%s,
              purchase_price=%s, selling_price=%s, gross_margin=%s,
              promo_purchase_price=%s, promo_selling_price=%s, promo_gross_margin=%s
            WHERE id=%s
        """, (
            product.name, product.spec, product.length, product.width, product.height,
            product.barcode, product.origin_country, product.shelf_life_value,
            product.shelf_life_unit, product.pack_qty, product.unit,
            product.launch_date, product.purchase_price, product.selling_price,
            gross_margin, product.promo_purchase_price, product.promo_selling_price,
            promo_gross_margin, product_id
        ))
        conn.commit()

        # 4️⃣ 回傳更新後的資料
        cursor_dict = conn.cursor(dictionary=True)
        cursor_dict.execute("SELECT * FROM products WHERE id = %s", (product_id,))
        updated = cursor_dict.fetchone()
        cursor_dict.close()
        return updated

    except mysql.connector.Error as e:
        conn.rollback()
        print("❌ update_product DB 錯誤:", e)
        raise HTTPException(status_code=500, detail="資料庫錯誤")
    finally:
            if cursor:
                try:
                    cursor.close()
                except Exception as e:
                    print("❌ cursor.close() 失敗：", e)

            if conn and getattr(conn, "_cnx", None):  # ✅ 重點在這一行
                try:
                    conn.close()
                except Exception as e:
                    print("❌ conn.close() 失敗：", e)  # 避免 close None


@router.delete("/{product_id}", summary="刪除商品")
def delete_product(product_id: int):
    conn = get_connection()
    cursor = conn.cursor()
    try:
        # 確認存在
        cursor.execute("SELECT 1 FROM products WHERE id = %s", (product_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Product not found")

        # 執行刪除
        cursor.execute("DELETE FROM products WHERE id = %s", (product_id,))
        conn.commit()
        return {"ok": True, "message": f"商品 id={product_id} 已刪除"}
    except mysql.connector.Error as e:
        conn.rollback()
        print("❌ delete_product DB 錯誤:", e)
        raise HTTPException(status_code=500, detail="資料庫錯誤")
    finally:
            if cursor:
                try:
                    cursor.close()
                except Exception as e:
                    print("❌ cursor.close() 失敗：", e)

            if conn and getattr(conn, "_cnx", None):  # ✅ 重點在這一行
                try:
                    conn.close()
                except Exception as e:
                    print("❌ conn.close() 失敗：", e)  # 避免 close None
