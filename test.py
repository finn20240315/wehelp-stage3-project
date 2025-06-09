from passlib.context import CryptContext

pwd = CryptContext(schemes=["bcrypt"], deprecated="auto")

# 從資料庫中複製那一長串 hashed 字串
db_hash = "$2b$12$KU00JFweRyF6TY7vqzTYLODxSTGhWV4JWciOiSrFIxm3qEuaFwMjC"  

# 假設你想用 '123' 當密碼，就執行：
print(pwd.verify("123", db_hash))   # True/False
