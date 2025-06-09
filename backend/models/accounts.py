# backend/models/accounts.py

from pydantic import BaseModel, EmailStr
from typing import Literal,Pattern

class LoginRequest(BaseModel):
    account: str
    password: str
    # 定義 LoginRequest 資料模型，
    # 包含三個必要欄位：account（使用者帳號）、password（密碼）、captcha（驗證碼）。

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    # 定義 TokenResponse 資料模型，表示回傳給前端的資料：access_token 和 token_type

class TokenPayload(BaseModel):
    sub: str 
    # 使用者帳號或唯一識別 ID（JWT 中常見的 subject）
    uid: int
    # 使用者在資料庫中的 ID
    role: Literal["main", "sub"]
    # 使用者角色，main 為主帳號，sub 為子帳號
    exp: int
    # token 的過期時間（timestamp 格式）

class RegisterMainRequest(BaseModel):
    email: EmailStr
    password: str
    type: Literal["company", "vendor"]
    # 註冊主帳號時需要傳入的欄位：
    #   - email：合法 Email 格式
    #   - type：只能是 "company" 或 "vendor"

class RegisterSubRequest(BaseModel):
    main_code: str        # 主帳完整代碼，例如 "c1001"
    email: EmailStr       # 子帳的電子信箱
    password: str
    department_id: int    # 必須對應到 departments 表裡存在的 id
    # 註冊子帳號時需要傳入的欄位：
    #   - main_code：要把子帳掛在哪個主帳（例如 "c1001"）
    #   - email：合法 Email 格式
    #   - department_id：對應 departments 表內的某一筆 (e.g. 7 = 物流部)



class RegisterMainResponse(BaseModel):
    account: str
    email: EmailStr
