from db_connector import mysql_pool

def test_connection():
    try:
        conn = mysql_pool.get_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT NOW();")
        result = cursor.fetchone()
        print("✅ 測試查詢成功，現在時間：", result["NOW()"])
        cursor.close()
        conn.close()
    except Error as e:
        print("❌ 資料庫操作錯誤", e)


if __name__ == "__main__":
    test_connection()