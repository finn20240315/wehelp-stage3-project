# backend/models/stock.py

from pydantic import BaseModel
from typing import Literal,Optional
from datetime import datetime

class StockInCreate(BaseModel):
    product_id: int
    quantity: int
    status: Literal["已入庫", "退貨"] = "已入庫"
    unit_price: float          # ← 必須有

class StockOutCreate(BaseModel):
    product_id: int
    quantity: int
    unit_price: float          # ← 必須有
    status: Literal["已出庫", "缺貨"] = "已出庫"

class StockSummary(BaseModel):
    product_id:    int
    product_name:  str
    product_spec:  Optional[str]
    barcode: Optional[str]       # 新增
    pack_qty: Optional[int]      # 新增
    unit: Optional[str]          # 新增
    total_in:      int
    total_out:     int
    current_stock: int
    last_updated:  Optional[datetime]

# 加在原本 StockSummary 下方
class StockHistoryRecord(BaseModel):
    id: int
    product_id: int
    product_name: str
    spec: Optional[str]        # ← 新增
    barcode: Optional[str] = None  # ← 一定要補這行！
    pack_qty: Optional[int]    # ← 新增
    unit: Optional[str]        # ← 新增
    change_type: str      # 入庫 or 出庫
    change_qty: int
    in_price: Optional[float] = None               
    out_price: Optional[float] = None               
    stock_after: Optional[int]
    created_at: str       # 格式化時間字串
