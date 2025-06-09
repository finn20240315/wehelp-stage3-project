from dotenv import load_dotenv
# 從第三方套件 python-dotenv 中引入 load_dotenv 函式，
# 用於將 .env 檔案中的環境變數載入到程式運行環境中

load_dotenv()
# 讀取專案根目錄下的 .env，讓 os.getenv() 能拿到值
from fastapi import FastAPI,Request
from fastapi.middleware.cors import CORSMiddleware
# 引入處理跨來源請求（CORS） 的中介程式類別
from fastapi.staticfiles import StaticFiles
# 引入用以提供靜態檔案（CSS、JS、HTML 等）的類別
from backend.routers import auth, products, stock,home 
from backend.db_connector import init_mysql_pool,get_connection
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List
from backend.routers import stock  # ← 加這行
import uvicorn

# 呼叫 load_dotenv()：將專案根目錄下的 .env 檔案內容讀入為環境變數
class Category(BaseModel):
    code: str
    name: str

app = FastAPI()
# 建立一個 FastAPI 應用實例，之後所有路由與設定都掛載到這個 app 上


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
# 使用 add_middleware 為應用加入 CORS 中介程式，允許所有來源（*）、所有 HTTP 方法與所有標頭

init_mysql_pool()  # ← 加這行 ✅


# 註冊所有 router
app.include_router(auth.router)
app.include_router(products.router)
app.include_router(stock.router) 
app.include_router(home.router)

# app.include_router(reports.router)
# app.include_router(suppliers.router)

if __name__ == "__main__":
    print(" ✅所有已註冊路由：")
    for route in app.router.routes:
        print(route.path, route.methods)
    uvicorn.run(app, host="0.0.0.0", port=8000)

@app.get("/home")
async def home(request: Request):
    # 1. 從資料庫撈出 announcements
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT `read` AS is_read, source, doc_no, title, start_date, end_date FROM announcements;")
    announcements = cursor.fetchall()

    # 2. 回傳 JSON 結果
    return JSONResponse(content={
        "success": True,
        "data": announcements
    })

@app.get("/api/categories", response_model=List[Category])
async def get_categories():
    """
    暫時回傳靜態的「大類碼」清單，
    之後可以改成從資料庫抓 categories table。
    """
    return [
        {"code": "37", "name": "酥脆點心"},
        {"code": "42", "name": "飲品"},
        {"code": "51", "name": "冷藏乳製品"},
        # …再補上其他 code／name…
    ]


# 對應 /css → frontend/css
app.mount("/css", StaticFiles(directory="frontend/css"), name="css")
# 對應 /js → frontend/js
app.mount("/js", StaticFiles(directory="frontend/js"), name="js")
# 對應 / → frontend/html/index.html 作為首頁（非必要，但你已經有了）
app.mount("/", StaticFiles(directory="frontend/html", html=True), name="static")
