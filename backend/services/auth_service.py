import datetime,os,jwt
from passlib.context import CryptContext
from backend.db_connector import get_connection
from fastapi import HTTPException, status

pwd_context=CryptContext(schemes=["bcrypt"],deprecated="auto")
# 建立一個 CryptContext 實例，指定雜湊演算法為 bcrypt，

hashed = pwd_context.hash("456")
# 把明文 "123" 轉成雜湊字串（含 salt），並存到 hashed
print("✅ 雜湊過後的密碼 456：",hashed)
# 建立一個 CryptContext 實例，指定雜湊演算法為 bcrypt，並讓過時演算法自動兼容

SECRET_KEY=os.getenv("JWT_SECRET_KEY")
# 從環境變數中讀取 JWT_SECRET_KEY，作為簽發／驗證 JWT 的私鑰，並指定給變數 SECRET_KEY（用於 JWT 的簽名金鑰）
ALGORITHM="HS256"
# 定義 JWT 簽名時要使用的演算法，此處為 HMAC-SHA256
ACCESS_TOKEN_EXPIRE_MINUTES=60
# 設定存取權杖的過期時間（分鐘），此處為 60 分鐘
print("✅ JWT_SECRET_KEY =", os.getenv("JWT_SECRET_KEY"))


# 註冊帳號邏輯
def get_next_main_code(cursor):
    """
    改用目前最大 main_code 推算下一個帳號
    """

    # 先查出目前最大 main_code
    cursor.execute("""
        SELECT MAX(main_code) AS max_code
        FROM main_accounts
        WHERE main_code REGEXP '^c[0-9]+$'
    """)
    row = cursor.fetchone()
    print("✅ row", row)

    if row["max_code"]:
        max_num = int(row["max_code"][1:])  # "c1010" → 1010
        next_num = max_num + 1
    else:
        next_num = 1000

    main_code = f"c{next_num}"

    # 再查一次是否真的重複（保險機制）
    cursor.execute("SELECT 1 FROM main_accounts WHERE main_code = %s", (main_code,))
    if cursor.fetchone():
        raise HTTPException(status_code=400, detail="帳號已存在，請重新整理頁面後再試")

    return main_code

def get_next_sub_code(cursor,main_id,main_code):
    """
    取得某主帳號底下下一筆子帳號 code，
    例如主 code c1036，已有 0 筆 → c103601；已有 1 筆 → c103602；…；10 筆 → c103610
    """
    # 1) 數出該主帳號已有幾筆子帳號
    cursor.execute("""
    SELECT COUNT(*) AS cnt
    FROM sub_accounts
    WHERE main_account_id =%s
    """,(main_id,))
    cnt=cursor.fetchone()["cnt"]
    # 計算已存在子帳號數量 COUNT(*) 回傳該主帳號底下子帳號的筆數

    # 2) 序號 = cnt + 1，並以兩位數顯示：1→"01", 9→"09", 10→"10"
    seq=cnt+1
    seq_str=str(seq).zfill(2) # '01','02',…,'10','11',…,'100'
    # 產生兩位數序號
    # seq = cnt + 1，再用 str(...).zfill(2) 補成 "01", "02", …
    
    # 3) 組合成 code，例如 "c1036" + "01" = "c103601"
    return f"{main_code}{seq_str}"

def register_main(req):
    # req：Pydantic 模型，含 email、password、type 等欄位
    """
    註冊主帳號並自動編號
    """
    conn = get_connection()
    cur  = conn.cursor(dictionary=True)

    try:
        # 檢查 email 或 code 重複
        cur.execute("SELECT 1 FROM account_registry WHERE email=%s",
                    (req.email, ))
        # 重複檢查：確保 account_registry 中沒有人用同樣的 email 或 code

        if cur.fetchone():
            raise HTTPException(status_code=400, detail="此信箱已註冊")

        # 1. 決定下一個 code
        main_code = get_next_main_code(cur)

        # 2. 雜湊密碼
        hashed = pwd_context.hash(req.password)

        # 3. 插入 main_accounts
        cur.execute("""
        INSERT INTO main_accounts(main_code, type, email, password)
        VALUES (%s, %s, %s, %s)
        """, (main_code, req.type, req.email, hashed))
        main_id = cur.lastrowid
        # cursor.lastrowid：拿到剛剛 INSERT 進 main_accounts 的自增主鍵值   
        
        # 4. 同步寫入 account_registry
        cur.execute("""
        INSERT INTO account_registry(code, email, type, ref_id)
        VALUES (%s, %s, 'main', %s)
        """, (main_code, req.email, main_id))

        conn.commit()
        return {"code": main_code, "email": req.email}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"註冊失敗：{str(e)}")
    finally:
        cur.close()
        conn.close()

#  5. 註冊子帳號流程
def register_sub(req):
    """
    註冊子帳號並自動編號
    """
    conn = get_connection()
    cur  = conn.cursor(dictionary=True)

    # 檢查所屬主帳號是否存在
    cur.execute("SELECT id, main_code FROM main_accounts WHERE main_code=%s",
                (req.main_code,))
    main_row = cur.fetchone()
    if not main_row:
        raise ValueError("對應主帳號不存在")

    # 檢查 email 或 code 重複
    cur.execute("SELECT 1 FROM account_registry WHERE email=%s",
                (req.email, ))
    if cur.fetchone():
        raise ValueError("帳號或 email 已存在")

    # 1. 決定下一個子 code
    sub_code = get_next_sub_code(cur, main_row["id"], main_row["main_code"])

    # 2. 雜湊密碼
    hashed = pwd_context.hash(req.password)

    # 3. 插入 sub_accounts
    cur.execute("""
      INSERT INTO sub_accounts(main_account_id, sub_code, email, password, department_id)
      VALUES (%s, %s, %s, %s, %s)
    """, (main_row["id"], sub_code, req.email, hashed, req.department_id))
    sub_id = cur.lastrowid

    # 4. 同步寫入 account_registry
    cur.execute("""
      INSERT INTO account_registry(code, email, type, ref_id)
      VALUES (%s, %s, 'sub', %s)
    """, (sub_code, req.email, sub_id))

    conn.commit()
    cur.close()
    conn.close()
    return {"code": sub_code, "email": req.email, "department_id": req.department_id}

# 登入帳號邏輯
def authenticate(account: str, password: str):
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # 1. 先從 account_registry 找 type + ref_id
    cursor.execute(
        "SELECT type, ref_id FROM account_registry WHERE code = %s",
        (account,),
    )
    reg = cursor.fetchone()
    cursor.close()
    conn.close()

    if not reg:
        # 帳號不存在
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,
                            detail="此帳號未被註冊")

    # 決定要查哪張表：main_accounts 或 sub_accounts
    table = "main_accounts" if reg["type"] == "main" else "sub_accounts"

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    if reg["type"] == "sub":
        # 子帳號：把 sub_accounts 的 department_id JOIN 到 departments.name
        cursor.execute("""
            SELECT sa.id,
                   sa.password AS hashed_password,
                   d.name AS department
            FROM sub_accounts sa
            LEFT JOIN departments d
              ON sa.department_id = d.id
            WHERE sa.id = %s
        """, (reg["ref_id"],))
    else:
        # 主帳號：直接把 departments.id = 1 (全部部門) 的 name 拿來當 department
        cursor.execute("""
            SELECT ma.id,
                   ma.password AS hashed_password,
                   d.name AS department
            FROM main_accounts ma
            LEFT JOIN departments d
              ON d.id = 1
            WHERE ma.id = %s
        """, (reg["ref_id"],))

    user = cursor.fetchone()
    cursor.close()
    conn.close()

    # 2. 驗證密碼
    if not user or not pwd_context.verify(password, user["hashed_password"]):
        # 密碼驗證失敗
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="帳號或密碼錯誤")
    # 3. 回傳給上層 (auth.py)：「id、account、role、department」
    return {
        "id": user["id"],
        "account": account,
        "role": reg["type"],      # "main" 或 "sub"
        "department": user.get("department")  # 對 main 來說，這裡就是 "全部部門"
    }

def create_access_token(data: dict):
    expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode = data.copy()
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
