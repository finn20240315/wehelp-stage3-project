# backend/routers/home.py

from fastapi import APIRouter, HTTPException
from typing import List
from pydantic import BaseModel
from backend.db_connector import get_connection

router = APIRouter()

# Pydantic 定義：回傳給前端的 JSON 欄位要跟 home.js 裡用到的 key 一致
class Announcement(BaseModel):
    read_status: bool    # 是否已讀
    source: str          # 訊息來源
    doc_no: str          # 公告文號
    title: str           # 標題
    start_date: str      # 公告日期 (YYYY-MM-DD)
    end_date: str        # 截止日期 (YYYY-MM-DD)

@router.get("/home", response_model=List[Announcement])
def get_home_announcements():
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("""
            SELECT
                read_status,
                source,
                doc_no,
                title,
                DATE_FORMAT(start_date, '%Y-%m-%d') AS start_date,
                DATE_FORMAT(end_date, '%Y-%m-%d') AS end_date
            FROM announcements
            ORDER BY start_date DESC;
        """)
        rows = cursor.fetchall()
        return rows
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"查詢錯誤：{e}")
    finally:
        cursor.close()
        conn.close()
