from pydantic import BaseModel, Field
from typing import Optional, Literal,List
from datetime import date,datetime

class ProductCreate(BaseModel):
    name: str
    spec: Optional[str]
    length: float
    width: float
    height: float
    barcode: str

    origin_country: str
    
    shelf_life_value: Optional[int] = None
    shelf_life_unit: Literal["日","月", "年"]
    
    pack_qty: int
    unit: str
    launch_date: Optional[date]

    purchase_price: float
    selling_price: Optional[float] = 0
    
    promo_purchase_price: float
    promo_selling_price: Optional[float] = 0

class ProductResponse(BaseModel):
    id: int # 商品 ID
    name: str # 商品名稱
    spec: Optional[str] # 規格
    length: Optional[float] # 長(cm)
    width: Optional[float] # 寬(cm)
    height: Optional[float] # 高(cm)
    barcode: Optional[str] # 條碼
   
    origin_country: Optional[str] # 產地
    shelf_life_value: Optional[int] = None
    shelf_life_unit: Literal["日","月", "年"]

    pack_qty: Optional[int] # 箱入數
    unit: Optional[str] # 單位
    launch_date: Optional[date] # 上架日期

    
    purchase_price: float
    selling_price: Optional[float] = 0
    gross_margin: Optional[float]      # 促銷毛利率(%)

    promo_purchase_price: float
    promo_selling_price: Optional[float] = 0
    promo_gross_margin: Optional[float]      # 促銷毛利率(%)

    created_at: datetime # 建立時間
    updated_at: datetime # 更新時間

    class Config:
        orm_mode = True