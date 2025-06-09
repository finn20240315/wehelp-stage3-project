import sys, os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

from backend.db_connector import mysql_pool

# 從 backend/db_connector.py檔案中匯入建立好的mysql連線池物件mysql_pool
def init_db():
# 定義一個名為 init_db()的函式，可重複呼叫整段流程
    conn = None
    cursor = None

    try:
    # 接下來的程式如果拋出例外，就會跳到 except 處理
        conn=mysql_pool.get_connection()
        # 從 mysql_pool 取出可用的連線物件並賦予給變數conn，結束後要放回連線池
        cursor=conn.cursor()
        # 在連線池物件conn建立一個游標cursor，並賦予給變數cursor，用來執行命令並取得結果
        with open("backend/schema.sql","r",encoding="utf-8") as f:
        # open(...)用讀取模式，("r")開啟位於backend/schema.sql的檔案
        # encoding="utf-8"確保中文註解可以正確讀取
            sql=f.read()
            # f.read()一次讀入整個檔案內容，並存到變數sql
            print("✅ 成功取得連線池")
        for stmt in sql.split(";"):
        # 把字串sql用;切割
            if stmt.strip():
            # 把 stmt 用 strip()去掉空白、換行
                cursor.execute(stmt)
                # 用游標 cursor 執行 execute sql語法 stmt
        conn.commit()        
        # 透過連線物件conn提交(commit)所有變更
        print("✅ 資料庫結構已初始化")
        # 在標準輸出顯示成功訊息
    except Exception as e:
    # 如果 try 裡的任何一步拋出例外，都會跳到這裡，並把例外物件指派給 e
        print("❌ 錯誤：", e)
    finally:
    # 無論有沒有發生例外，都一定會執行 finally 區塊的程式
        if cursor:
            cursor.close()        
            # 關閉游標
        if conn:
            conn.close()        
            # 關閉(歸還)連線，確保資源正確釋放，避免連線池耗盡或記憶體洩漏

if __name__=="__main__":
# 只有當你以腳本方式執行 python init_db.py 或 python -m backend.init_db，這裡才會成立。
    init_db()
    # 呼叫前面定義的函式，執行整個初始化流程。
    # 意義：讓這支檔案既可以被當做模組匯入，也可以獨立執行。


# 步驟流程
# 1. 載入連線池 → 
# 2. 取連線／游標 → 
# 3. 讀 SQL 檔
# 4. 切割語句 → 
# 5. 逐一執行 → 
# 6. 提交 → 
# 7. 釋放資源 → 
# 8. 印出結果或錯誤

# -- mysql_pool 連線池物件
#  |-- get_connection 方法
#  |   從池子裡拿出一條可用的資料庫連線」，返回一個 conn 連線物件
#  |-- conn 連線物件
#  |   conn.cursor() 為什麼不是在連線物件 conn 上建立一個 cursor 方法?
#  | |-- cursor() 方法
#  | |-- commit() 方法
#  |-- cursor 游標物件