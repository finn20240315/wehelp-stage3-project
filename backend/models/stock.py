# backend/models/stock.py

from pydantic import BaseModel
from typing import Literal,Optional

class StockInCreate(BaseModel):
    product_id: int
    quantity: int
    warehouse: str = "主倉"
    status: Literal["已入庫", "退貨"] = "已入庫"

class StockOutCreate(BaseModel):
    product_id: int
    quantity: int
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
    last_updated:  Optional[str]
