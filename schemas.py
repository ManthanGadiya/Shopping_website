from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field


class CustomerBase(BaseModel):
    name: str
    contact_no: Optional[str] = None
    email: EmailStr
    pet_type: Optional[str] = None


class CustomerCreate(CustomerBase):
    password: str = Field(min_length=4)


class CustomerLogin(BaseModel):
    email: EmailStr
    password: str


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    contact_no: Optional[str] = None
    pet_type: Optional[str] = None
    password: Optional[str] = Field(default=None, min_length=4)


class CustomerOut(CustomerBase):
    customer_id: int

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str
    customer: CustomerOut


class ProductBase(BaseModel):
    product_name: str
    product_type: str
    price: float = Field(gt=0)
    stock_quantity: int = Field(ge=0)


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    product_name: Optional[str] = None
    product_type: Optional[str] = None
    price: Optional[float] = Field(default=None, gt=0)
    stock_quantity: Optional[int] = Field(default=None, ge=0)


class ProductOut(ProductBase):
    product_id: int
    rating: float

    class Config:
        from_attributes = True


class CartAdd(BaseModel):
    customer_id: int
    product_id: int
    quantity: int = Field(default=1, ge=1)


class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=1)


class CartItemOut(BaseModel):
    cart_item_id: int
    customer_id: int
    product_id: int
    quantity: int

    class Config:
        from_attributes = True


class PaymentCreate(BaseModel):
    payment_method: str = Field(min_length=2, max_length=50)


class OrderItemOut(BaseModel):
    order_item_id: int
    product_id: int
    price: float
    quantity: int
    sub_total: float

    class Config:
        from_attributes = True


class PaymentOut(BaseModel):
    payment_id: int
    order_id: int
    payment_method: str
    status: str
    paid_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class OrderOut(BaseModel):
    order_id: int
    customer_id: int
    order_date: datetime
    total_amount: float
    payment_status: str
    delivery_status: str
    items: List[OrderItemOut] = []
    payment: Optional[PaymentOut] = None

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    payment_status: Optional[str] = None
    delivery_status: Optional[str] = None


class CheckoutRequest(BaseModel):
    customer_id: int
    payment_method: str = Field(min_length=2, max_length=50)


class ReviewCreate(BaseModel):
    customer_id: int
    product_id: int
    rating: float = Field(ge=1, le=5)
    comment: Optional[str] = None


class ReviewOut(BaseModel):
    review_id: int
    customer_id: int
    product_id: int
    rating: float
    comment: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True
