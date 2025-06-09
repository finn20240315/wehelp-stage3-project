# 使用官方 Python 基底映像
FROM python:3.10-slim

# 設定工作目錄
WORKDIR /app

# 複製所有專案檔案進去容器
COPY . .

# 安裝依賴套件
RUN pip install --upgrade pip \
  && pip install -r requirements.txt

# 開放 8000 port（FastAPI）
EXPOSE 8000

# 一次性執行 init_db.py，然後啟動 uvicorn
# 如果 init_db 出錯，也不阻塞主程式 (|| true)
ENTRYPOINT ["sh", "-c", "python3 backend/init_db.py || true && exec uvicorn backend.main:app --host 0.0.0.0 --port 8000"]
