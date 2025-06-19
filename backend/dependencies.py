# backend/dependencies.py
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from fastapi import Depends
from typing import Generator

# 這裡改成你的 DB URL
DATABASE_URL = os.getenv("DATABASE_URL", "mysql+pymysql://user:pass@127.0.0.1/dbname")

# 建立 engine
engine = create_engine(DATABASE_URL, pool_pre_ping=True, future=True)

# 建一個 session factory
SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    class_=Session,
)

def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency，用來取得 SQLAlchemy Session，
    在路由裡寫 `db: Session = Depends(get_db)` 就能拿到 session。
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
