from fastapi import APIRouter,HTTPException,BackgroundTasks,Depends
from sqlalchemy.orm import Session
from backend.models.accounts import (
    LoginRequest,
    TokenResponse,
    RegisterMainRequest,
    RegisterSubRequest,
    RegisterMainResponse,
    SendCodeIn
)
from backend.services.auth_service import (
    authenticate,
    create_access_token,
    register_main,
    register_sub
)
from ..dependencies import get_db
from ..email_smtp import send_email
from sqlalchemy import text
import random, string, datetime

router = APIRouter(prefix="/api")

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest):
    """
    處理登入請求，驗證帳密，回傳 JWT
    """
    print("✅ 收到請求 req：", req)

    # 1. 確保三個欄位都有
    if not req.email or not req.account or not req.password:
        raise HTTPException(400, "請輸入帳號、信箱與密碼")

    # authenticate 已經會拋出 404 / 401 的錯誤
    user = authenticate(req.account, req.password, req.email)

    # 3. 驗證信箱和帳號是否配對
    if req.email != user["email"]:
        raise HTTPException(401, "信箱與帳號不符")

    token = create_access_token({
        "sub": user["account"], 
        "uid": user["id"], 
        "role": user["role"],
        "department": user["department"]  # ✅ 加這行
    })
    # 使用 PyJWT 將 payload 依指定金鑰與演算法編碼成 JWT 

    return {"access_token": token, "token_type": "bearer"}
    # 回傳字典，FastAPI 會自動依 response_model=TokenResponse 轉換為 JSON

@router.post("/register_main", response_model=RegisterMainResponse)
def register_main_router(
    req: RegisterMainRequest,
    # req: 前端送來的 JSON 會被自動轉成 RegisterMainRequest 型別（
    # 包含 email、password、type、verification_code）
    bg_tasks: BackgroundTasks,
    # bg_tasks: FastAPI 內建的背景任務工具，讓你可以「先回應 API，再背景發送 email」
    db: Session = Depends(get_db), 
    # db: 這一行 Session = Depends(get_db)，
    # 會自動幫你取得一個 SQLAlchemy 的資料庫 Session 物件
    # 這裡為什麼需要 session 物件
):  
    print("🟢 [register_main] 收到請求，內容：", req.dict())

    """
    同步路由：處理 POST /api/register_main
    - 先驗證 6 位數驗證碼
    - 刪除該筆驗證碼
    - 呼叫 register_main 建主帳號
    - 背景寄發註冊成功通知信
    - 回傳主帳號資訊
    """
    try:
        # 0. 檢查 email 是否已註冊過
        exists = db.execute(
        text("SELECT 1 FROM account_registry WHERE email=:email"),
        {"email": req.email}
        ).first()
        
        if exists:
            print("🔴 [register_main] 信箱已被註冊：", req.email)
            raise HTTPException(400, "此信箱已註冊，請直接登入或找回密碼")

        print("🟢 [register_main] 開始查詢驗證碼")

        # 1. 檢查驗證碼
        row = db.execute(
            text("SELECT code, expires_at FROM email_verifications WHERE email=:email"),
            {"email": req.email},
        ).first()
        print("🟢 [register_main] 查到 row：", row)

        # 從 email_verifications 資料表找出這個 email 最新的一組驗證碼跟過期時間

        if not row:
            print("🔴 [register_main] 查無驗證碼，email：", req.email)
            raise HTTPException(400, "驗證碼不存在，請先取得驗證碼")
        code, expires_at = row
        print(f"🟢 [register_main] 取得 code: {code}, expires_at: {expires_at}, 現在時間: {datetime.datetime.utcnow()}")

        if datetime.datetime.utcnow() > expires_at:
            print("🔴 [register_main] 驗證碼過期")
            raise HTTPException(400, "驗證碼已過期，請重新發送")
        
        if req.verification_code != code:
            print("🔴 [register_main] 驗證碼不符，前端傳入：", req.verification_code)
            raise HTTPException(400, "驗證碼錯誤")

        # 2. 刪除驗證碼記錄
        print("🟢 [register_main] 驗證通過，刪除驗證碼紀錄")
   
        db.execute(
            text("DELETE FROM email_verifications WHERE email=:email"),
            {"email": req.email}
        )        
        db.commit()

        # 3. 建立主帳號
        result = register_main(req)   # 這裡呼叫你原本的 service
        print("🟢 result:", result, type(result))
        # 呼叫你自己寫的 service function register_main(req)
        # （通常在 auth_service.py），負責真的把帳號寫進資料庫
        # 預期回傳 {"code": main_code, "email": req.email}
        # 4. 寄註冊成功通知（寄帳號、密碼到信箱）
        subject = "【A 公司系統】主帳號註冊成功通知"
        body_text = (
            f"您好，\n\n"
            f"您的帳號：{result['code']}\n"
            f"您已完成註冊，請使用方才設定的密碼登入系統。\n"
            f"請妥善保管帳號、密碼，謝謝！"
        )
        bg_tasks.add_task(send_email, req.email, subject, body_text)

        return result
    
    except ValueError as e:
        raise HTTPException(status_code=400,detail=str(e))

@router.post("/send_verification_code")
def send_verification_code(
    data: SendCodeIn,
    bg_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    - 產生 6 位數字驗證碼
    - 存入或更新到 email_verifications 表
    - 背景非同步寄送驗證碼信
    - 回傳 {message: "..."}
    """
    # 0. 檢查信箱是否已註冊
    exists = db.execute(
        text("SELECT 1 FROM account_registry WHERE email=:email"),
        {"email": data.email}
    ).first()
    if exists:
        raise HTTPException(
            status_code=400,
            detail="此信箱已註冊，請直接登入，謝謝！"
        )

    code = "".join(random.choices(string.digits, k=6))
    # 隨機產生 6 位數字組成的驗證碼
    expires = datetime.datetime.utcnow() + datetime.timedelta(minutes=5)
    # 設定過期時間是 5 分鐘後

    # 2. upsert 到 email_verifications
    db.execute(
        text("""
        INSERT INTO email_verifications (email, code, expires_at)
        VALUES (:email, :code, :expires)
        ON DUPLICATE KEY UPDATE code=:code, expires_at=:expires
        """),
        {"email": data.email, "code": code, "expires": expires},
    )
    db.commit()

    # 3. 非同步寄信
    subject = "【A 公司系統】您的註冊驗證碼（5 分鐘內有效）"
    body_text = f"您正在註冊 A 公司供應商管理系統，您的驗證碼為：{code}"
    bg_tasks.add_task(send_email, data.email, subject, body_text)

    return {"message": "驗證碼已寄出，請至信箱查看"}

# 總結流程圖
# 前端：使用者輸入 email → 點「寄驗證碼」 → /send_verification_code
# API：產生驗證碼，寄到 email，資料庫存一筆最新驗證碼
# 前端：收信填入驗證碼＋email＋密碼 → 點「註冊」 → /register_main
# API：驗證碼通過才寫入資料庫、發信
# API：註冊成功資料回傳，前端顯示註冊成功！

@router.post("/register_sub")
def register_sub_router(req: RegisterSubRequest):
    """
    處理 POST /api/register_sub
    子帳號註冊：課程要求需傳入 main_code, email, password, department_id
    """
    try:
        result = register_sub(req)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

