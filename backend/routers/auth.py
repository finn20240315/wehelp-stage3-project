from fastapi import APIRouter,HTTPException
# 把 RegisterSubRequest 一併 import 進來
from backend.models.accounts import (
    LoginRequest,
    TokenResponse,
    RegisterMainRequest,
    RegisterSubRequest
)
# 同時把 register_sub 也 import 進來
from backend.services.auth_service import (
    authenticate,
    create_access_token,
    register_main,
    register_sub
)

router=APIRouter(prefix="/api")

@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest):
# 使用裝飾器 @app.post 定義一個 POST 路由 /api/login，並指定回傳資料模型為 TokenResponse。
# 路由函式 login 為非同步函式，接收經過驗證的 LoginRequest 物件
    print("✅ 收到請求 req：", req)

    # authenticate 已經會拋出 404 / 401 的錯誤
    user = authenticate(req.account, req.password)
    
    token = create_access_token({
        "sub": user["account"], 
        "uid": user["id"], 
        "role": user["role"],
        "department": user["department"]  # ✅ 加這行
    })
    # 使用 PyJWT 將 payload 依指定金鑰與演算法編碼成 JWT 

    return {"access_token": token, "token_type": "bearer"}
    # 回傳字典，FastAPI 會自動依 response_model=TokenResponse 轉換為 JSON


@router.post("/register_main")
def register_main_router(req:RegisterMainRequest):
    try:
        result=register_main(req)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400,detail=str(e))

# ——— 新增：/api/register_sub ———
@router.post("/register_sub")
def register_sub_router(req: RegisterSubRequest):
    """
    req 內需包含：main_code, email, password, department_id
    """
    try:
        result = register_sub(req)
        return result
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))