from dotenv import load_dotenv

load_dotenv()
import os
print("✅ DB_HOST =", os.getenv("MYSQL_HOST"))

from mysql.connector import pooling,Error

# 初始化為 None
mysql_pool = None

def init_mysql_pool():
    global mysql_pool
    try:
        mysql_pool=pooling.MySQLConnectionPool(
            pool_name="mypool",
            pool_size=32,
            pool_reset_session=True, # 每次從連線池中取出連線時會自動重設資料庫狀態，為需要需要這個
            host=os.getenv("MYSQL_HOST"),
            user=os.getenv("MYSQL_USER"),
            password=os.getenv("MYSQL_PASSWORD"),
            database=os.getenv("MYSQL_DATABASE"),
            charset="utf8mb4"
        )
        print("✅ 正在連線到資料庫主機：",os.getenv("MYSQL_HOST"))
        print("✅ 資料庫連線池初始化完成")

    except Error as e:
        print("✅ 連線池建立失敗",e)
        mysql_pool=None


# ✅ 加入這段：提供其他模組使用的函式
def get_connection():
    if not mysql_pool:
        raise RuntimeError("MySQL 連線池尚未初始化")

    try:
        conn = mysql_pool.get_connection()
        print("🟡 目前 pool 使用狀況：", mysql_pool._cnx_queue.qsize())
        return conn
    except Error as e:
        print("❌ 無法從連線池取得連線：", e)
        return None

init_mysql_pool()
