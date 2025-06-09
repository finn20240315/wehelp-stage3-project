from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
hashed = pwd_context.hash("123")  # 你可以改成想設定的新密碼
print("✅ 雜湊後密碼：", hashed)
