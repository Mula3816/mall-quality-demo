import os
from datetime import datetime
from typing import Annotated

from fastapi import Depends, FastAPI, Header, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text, func

from sqlalchemy.orm import Session, relationship

from app.database import Base, engine, get_db
from app.security import create_access_token, hash_password, parse_access_token, verify_password

app = FastAPI(title="Mall Quality Demo API", version="0.1.0")

# 默认允许本地三个前端的开发端口；如需自定义，设置环境变量 MALL_CORS_ORIGINS（逗号分隔）。
DEFAULT_CORS_ORIGINS = (
    "http://localhost:5173,http://127.0.0.1:5173,"
    "http://localhost:5174,http://127.0.0.1:5174,"
    "http://localhost:5175,http://127.0.0.1:5175"
)
CORS_ORIGINS = [
    origin.strip()
    for origin in os.environ.get("MALL_CORS_ORIGINS", DEFAULT_CORS_ORIGINS).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False, index=True)
    password_hash = Column(String(128), nullable=False)
    nickname = Column(String(50), nullable=False)
    role = Column(String(30), nullable=False, default="customer")
    created_at = Column(DateTime, default=datetime.utcnow)


class Address(Base):
    __tablename__ = "addresses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_name = Column(String(50), nullable=False)
    phone = Column(String(30), nullable=False)
    province = Column(String(50), nullable=False)
    city = Column(String(50), nullable=False)
    district = Column(String(50), nullable=False)
    detail = Column(String(200), nullable=False)
    is_default = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Product(Base):
    __tablename__ = "products"


    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    description = Column(Text, nullable=False)
    price = Column(Float, nullable=False)
    stock = Column(Integer, nullable=False)
    category = Column(String(50), nullable=False)
    image_url = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class CartItem(Base):
    __tablename__ = "cart_items"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    product = relationship("Product")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    total_amount = Column(Float, nullable=False)
    status = Column(String(20), nullable=False, default="created")
    paid_at = Column(DateTime, nullable=True)
    shipped_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    canceled_at = Column(DateTime, nullable=True)
    logistics_company = Column(String(80), nullable=True)
    tracking_number = Column(String(80), nullable=True)
    logistics_note = Column(String(200), nullable=True)
    address_id = Column(Integer, nullable=True)
    address_snapshot = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)



    items = relationship("OrderItem", cascade="all, delete-orphan")
    after_sale = relationship("AfterSale", uselist=False, cascade="all, delete-orphan")
    reviews = relationship("Review", cascade="all, delete-orphan")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, nullable=False)
    product_name = Column(String(120), nullable=False)
    product_price = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False)
    subtotal = Column(Float, nullable=False)


class AfterSale(Base):
    __tablename__ = "after_sales"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False, unique=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    reason = Column(String(120), nullable=False)
    description = Column(Text, nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    reply = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    product_name = Column(String(120), nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


class LoginRequest(BaseModel):
    username: str
    password: str


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    password: str = Field(min_length=6, max_length=50)
    nickname: str = Field(min_length=1, max_length=50)


class AddressCreate(BaseModel):
    receiver_name: str = Field(min_length=1, max_length=50)
    phone: str = Field(min_length=6, max_length=30)
    province: str = Field(min_length=1, max_length=50)
    city: str = Field(min_length=1, max_length=50)
    district: str = Field(min_length=1, max_length=50)
    detail: str = Field(min_length=1, max_length=200)
    is_default: bool = False


class AddressUpdate(AddressCreate):
    pass


class CartItemCreate(BaseModel):

    product_id: int
    quantity: int = Field(default=1, ge=1)


class CartItemUpdate(BaseModel):
    quantity: int = Field(ge=1)


class ProductCreate(BaseModel):
    name: str
    description: str
    price: float = Field(ge=0)
    stock: int = Field(ge=0)
    category: str
    image_url: str


class ProductUpdate(BaseModel):
    name: str
    description: str
    price: float = Field(ge=0)
    stock: int = Field(ge=0)
    category: str
    image_url: str


class OrderCreate(BaseModel):
    address_id: int



class OrderStatusUpdate(BaseModel):
    status: str


class ShipmentUpdate(BaseModel):
    logistics_company: str = Field(min_length=1, max_length=80)
    tracking_number: str = Field(min_length=1, max_length=80)
    logistics_note: str = Field(default="商家已发货，包裹正在等待揽收", max_length=200)


class AfterSaleCreate(BaseModel):
    reason: str = Field(min_length=1, max_length=120)
    description: str = Field(min_length=1, max_length=500)


class AfterSaleStatusUpdate(BaseModel):
    status: str
    reply: str = Field(default="", max_length=500)


class ReviewCreate(BaseModel):
    product_id: int
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=1, max_length=500)



def address_to_dict(address: Address) -> dict:
    return {
        "id": address.id,
        "receiver_name": address.receiver_name,
        "phone": address.phone,
        "province": address.province,
        "city": address.city,
        "district": address.district,
        "detail": address.detail,
        "is_default": bool(address.is_default),
        "created_at": address.created_at.isoformat(),
    }



def product_to_dict(product: Product) -> dict:

    return {
        "id": product.id,
        "name": product.name,
        "description": product.description,
        "price": product.price,
        "stock": product.stock,
        "category": product.category,
        "image_url": product.image_url,
        "created_at": product.created_at.isoformat(),
    }



def cart_item_to_dict(item: CartItem) -> dict:
    return {
        "id": item.id,
        "product_id": item.product_id,
        "quantity": item.quantity,
        "product": product_to_dict(item.product),
        "subtotal": round(item.product.price * item.quantity, 2),
    }


def after_sale_to_dict(after_sale: AfterSale) -> dict:
    return {
        "id": after_sale.id,
        "order_id": after_sale.order_id,
        "reason": after_sale.reason,
        "description": after_sale.description,
        "status": after_sale.status,
        "reply": after_sale.reply,
        "created_at": after_sale.created_at.isoformat(),
        "updated_at": after_sale.updated_at.isoformat(),
    }


def review_to_dict(review: Review) -> dict:
    return {
        "id": review.id,
        "order_id": review.order_id,
        "product_id": review.product_id,
        "product_name": review.product_name,
        "rating": review.rating,
        "comment": review.comment,
        "created_at": review.created_at.isoformat(),
    }


def order_to_dict(order: Order) -> dict:
    return {
        "id": order.id,
        "total_amount": order.total_amount,
        "status": order.status,
        "paid_at": order.paid_at.isoformat() if order.paid_at else None,
        "shipped_at": order.shipped_at.isoformat() if order.shipped_at else None,
        "completed_at": order.completed_at.isoformat() if order.completed_at else None,
        "canceled_at": order.canceled_at.isoformat() if order.canceled_at else None,
        "logistics": {
            "company": order.logistics_company,
            "tracking_number": order.tracking_number,
            "note": order.logistics_note,
            "shipped_at": order.shipped_at.isoformat() if order.shipped_at else None,
        } if order.logistics_company and order.tracking_number else None,
        "after_sale": after_sale_to_dict(order.after_sale) if order.after_sale else None,
        "reviews": [review_to_dict(review) for review in order.reviews],
        "address_id": order.address_id,
        "address_snapshot": order.address_snapshot,
        "created_at": order.created_at.isoformat(),
        "items": [
            {
                "id": item.id,
                "product_id": item.product_id,
                "product_name": item.product_name,
                "product_price": item.product_price,
                "quantity": item.quantity,
                "subtotal": item.subtotal,
            }
            for item in order.items
        ],
    }



def user_to_dict(user: User) -> dict:
    return {
        "id": user.id,
        "username": user.username,
        "nickname": user.nickname,
        "role": user.role,
        "created_at": user.created_at.isoformat(),
    }



def admin_order_to_dict(order: Order, user: User) -> dict:
    payload = order_to_dict(order)
    payload["user"] = user_to_dict(user)
    return payload


CUSTOMER_ROLE = "customer"
MERCHANT_ROLE = "merchant"
COMPANY_ADMIN_ROLE = "company_admin"
BACKOFFICE_ROLES = {MERCHANT_ROLE, COMPANY_ADMIN_ROLE}
ADMIN_ORDER_STATUSES = {"created", "paid", "shipped", "completed", "canceled"}
AFTER_SALE_STATUSES = {"pending", "approved", "rejected", "done"}
ORDER_STATUS_TRANSITIONS = {
    "created": {"paid", "canceled"},
    "paid": {"shipped", "canceled"},
    "shipped": {"completed"},
    "completed": set(),
    "canceled": set(),
}


def can_transition_order_status(current_status: str, next_status: str) -> bool:
    if current_status == next_status:
        return True
    return next_status in ORDER_STATUS_TRANSITIONS.get(current_status, set())


def apply_order_status(order: Order, next_status: str) -> None:
    if order.status == next_status:
        return
    now = datetime.utcnow()
    if next_status == "paid" and order.paid_at is None:
        order.paid_at = now
    elif next_status == "shipped" and order.shipped_at is None:
        order.shipped_at = now
    elif next_status == "completed" and order.completed_at is None:
        order.completed_at = now
    elif next_status == "canceled" and order.canceled_at is None:
        order.canceled_at = now
    order.status = next_status



def ensure_schema() -> None:

    with engine.begin() as connection:
        user_columns = {row[1] for row in connection.exec_driver_sql("PRAGMA table_info(users)").fetchall()}
        if "role" not in user_columns:
            connection.exec_driver_sql("ALTER TABLE users ADD COLUMN role VARCHAR(30) NOT NULL DEFAULT 'customer'")
        connection.exec_driver_sql("UPDATE users SET role = 'company_admin' WHERE username = 'admin'")

        order_columns = {row[1] for row in connection.exec_driver_sql("PRAGMA table_info(orders)").fetchall()}
        if "paid_at" not in order_columns:
            connection.exec_driver_sql("ALTER TABLE orders ADD COLUMN paid_at DATETIME")
        if "shipped_at" not in order_columns:
            connection.exec_driver_sql("ALTER TABLE orders ADD COLUMN shipped_at DATETIME")
        if "completed_at" not in order_columns:
            connection.exec_driver_sql("ALTER TABLE orders ADD COLUMN completed_at DATETIME")
        if "canceled_at" not in order_columns:
            connection.exec_driver_sql("ALTER TABLE orders ADD COLUMN canceled_at DATETIME")
        if "logistics_company" not in order_columns:
            connection.exec_driver_sql("ALTER TABLE orders ADD COLUMN logistics_company VARCHAR(80)")
        if "tracking_number" not in order_columns:
            connection.exec_driver_sql("ALTER TABLE orders ADD COLUMN tracking_number VARCHAR(80)")
        if "logistics_note" not in order_columns:
            connection.exec_driver_sql("ALTER TABLE orders ADD COLUMN logistics_note VARCHAR(200)")
        if "address_id" not in order_columns:
            connection.exec_driver_sql("ALTER TABLE orders ADD COLUMN address_id INTEGER")
        if "address_snapshot" not in order_columns:
            connection.exec_driver_sql("ALTER TABLE orders ADD COLUMN address_snapshot TEXT")




def seed_data(db: Session) -> None:

    default_users = [
        {"username": "admin", "nickname": "公司管理人员", "role": COMPANY_ADMIN_ROLE},
        {"username": "merchant", "nickname": "测试商家", "role": MERCHANT_ROLE},
        {"username": "buyer", "nickname": "测试买家", "role": CUSTOMER_ROLE},
    ]
    for user_payload in default_users:
        user = db.query(User).filter(User.username == user_payload["username"]).first()
        if user:
            user.nickname = user_payload["nickname"]
            user.role = user_payload["role"]
        else:
            db.add(
                User(
                    username=user_payload["username"],
                    password_hash=hash_password("123456"),
                    nickname=user_payload["nickname"],
                    role=user_payload["role"],
                )
            )

    if db.query(Product).count() == 0:
        db.add_all(
            [
                Product(
                    name="轻量机械键盘",
                    description="适合办公和编码的 84 键机械键盘，支持热插拔和白色背光。",
                    price=299.0,
                    stock=25,
                    category="数码配件",
                    image_url="https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=900&q=80",
                ),
                Product(
                    name="无线降噪耳机",
                    description="支持主动降噪和低延迟模式，适合通勤、学习和在线会议。",
                    price=499.0,
                    stock=18,
                    category="数码音频",
                    image_url="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=900&q=80",
                ),
                Product(
                    name="人体工学办公椅",
                    description="可调节腰托和扶手，适合长时间学习和办公使用。",
                    price=899.0,
                    stock=10,
                    category="办公家具",
                    image_url="https://images.unsplash.com/photo-1580480055273-228ff5388ef8?auto=format&fit=crop&w=900&q=80",
                ),
                Product(
                    name="便携显示器",
                    description="15.6 英寸全高清便携屏，Type-C 一线连接，适合扩展工作区。",
                    price=799.0,
                    stock=12,
                    category="电脑外设",
                    image_url="https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=900&q=80",
                ),
            ]
        )
    db.commit()


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    ensure_schema()
    db = next(get_db())

    try:
        seed_data(db)
    finally:
        db.close()


def get_current_user(
    db: Annotated[Session, Depends(get_db)],
    authorization: Annotated[str | None, Header()] = None,
) -> User:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="未登录")
    token = authorization.replace("Bearer ", "", 1)
    user_id = parse_access_token(token)
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="登录信息无效")
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户不存在")
    return user


def get_current_customer(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    if current_user.role != CUSTOMER_ROLE:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="请使用买家账号访问商城前台")
    return current_user


def get_current_admin(current_user: Annotated[User, Depends(get_current_user)]) -> User:
    if current_user.role not in BACKOFFICE_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="无后台访问权限")
    return current_user



def get_current_company_admin(current_admin: Annotated[User, Depends(get_current_admin)]) -> User:
    if current_admin.role != COMPANY_ADMIN_ROLE:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="仅公司管理人员可操作")
    return current_admin



@app.get("/api/health")

def health_check() -> dict:
    return {"status": "ok", "service": "mall-backend"}


@app.post("/api/auth/login")
def login(payload: LoginRequest, db: Annotated[Session, Depends(get_db)]) -> dict:
    user = db.query(User).filter(User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="用户名或密码错误")
    return {
        "access_token": create_access_token(user.id),
        "token_type": "bearer",
        "user": {"id": user.id, "username": user.username, "nickname": user.nickname, "role": user.role},
    }


@app.post("/api/auth/register")
def register(payload: RegisterRequest, db: Annotated[Session, Depends(get_db)]) -> dict:
    existing_user = db.query(User).filter(User.username == payload.username).first()
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="用户名已存在")
    user = User(
        username=payload.username,
        password_hash=hash_password(payload.password),
        nickname=payload.nickname,
        role=CUSTOMER_ROLE,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return {
        "access_token": create_access_token(user.id),
        "token_type": "bearer",
        "user": {"id": user.id, "username": user.username, "nickname": user.nickname, "role": user.role},
    }


@app.get("/api/users/me")

def get_me(current_user: Annotated[User, Depends(get_current_customer)]) -> dict:
    return user_to_dict(current_user)



@app.get("/api/addresses")
def list_addresses(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_customer)],
) -> list[dict]:
    addresses = db.query(Address).filter(Address.user_id == current_user.id).order_by(Address.is_default.desc(), Address.id.desc()).all()
    return [address_to_dict(address) for address in addresses]


@app.post("/api/addresses")
def create_address(
    payload: AddressCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_customer)],
) -> dict:
    if payload.is_default:
        db.query(Address).filter(Address.user_id == current_user.id).update({"is_default": 0})
    has_address = db.query(Address).filter(Address.user_id == current_user.id).first() is not None
    address = Address(user_id=current_user.id, **payload.model_dump(exclude={"is_default"}), is_default=1 if payload.is_default or not has_address else 0)
    db.add(address)
    db.commit()
    db.refresh(address)
    return address_to_dict(address)


@app.put("/api/addresses/{address_id}")
def update_address(
    address_id: int,
    payload: AddressUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_customer)],
) -> dict:
    address = db.get(Address, address_id)
    if not address or address.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="收货地址不存在")
    if payload.is_default:
        db.query(Address).filter(Address.user_id == current_user.id).update({"is_default": 0})
    for field, value in payload.model_dump(exclude={"is_default"}).items():
        setattr(address, field, value)
    address.is_default = 1 if payload.is_default else 0
    db.commit()
    db.refresh(address)
    return address_to_dict(address)


@app.delete("/api/addresses/{address_id}")
def delete_address(
    address_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_customer)],
) -> dict:
    address = db.get(Address, address_id)
    if not address or address.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="收货地址不存在")
    was_default = bool(address.is_default)
    db.delete(address)
    db.commit()
    if was_default:
        next_address = db.query(Address).filter(Address.user_id == current_user.id).order_by(Address.id.desc()).first()
        if next_address:
            next_address.is_default = 1
            db.commit()
    return {"message": "deleted"}


@app.get("/api/products")
def list_products(db: Annotated[Session, Depends(get_db)]) -> list[dict]:

    products = db.query(Product).order_by(Product.id.asc()).all()
    return [product_to_dict(product) for product in products]


@app.get("/api/products/{product_id}")
def get_product(product_id: int, db: Annotated[Session, Depends(get_db)]) -> dict:
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="商品不存在")
    return product_to_dict(product)


@app.get("/api/products/{product_id}/reviews")
def list_product_reviews(product_id: int, db: Annotated[Session, Depends(get_db)]) -> list[dict]:
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="商品不存在")
    reviews = db.query(Review).filter(Review.product_id == product_id).order_by(Review.id.desc()).all()
    return [review_to_dict(review) for review in reviews]


@app.get("/api/cart")
def get_cart(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_customer)],
) -> dict:
    items = db.query(CartItem).filter(CartItem.user_id == current_user.id).all()
    item_dicts = [cart_item_to_dict(item) for item in items]
    return {"items": item_dicts, "total_amount": round(sum(item["subtotal"] for item in item_dicts), 2)}


@app.post("/api/cart/items")
def add_cart_item(
    payload: CartItemCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_customer)],
) -> dict:
    product = db.get(Product, payload.product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="商品不存在")
    if payload.quantity > product.stock:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="商品库存不足")

    item = (
        db.query(CartItem)
        .filter(CartItem.user_id == current_user.id, CartItem.product_id == payload.product_id)
        .first()
    )
    if item:
        next_quantity = item.quantity + payload.quantity
        if next_quantity > product.stock:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="商品库存不足")
        item.quantity = next_quantity
    else:
        item = CartItem(user_id=current_user.id, product_id=payload.product_id, quantity=payload.quantity)
        db.add(item)
    db.commit()
    db.refresh(item)
    return cart_item_to_dict(item)


@app.put("/api/cart/items/{item_id}")
def update_cart_item(
    item_id: int,
    payload: CartItemUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_customer)],
) -> dict:
    item = db.get(CartItem, item_id)
    if not item or item.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="购物车商品不存在")
    if payload.quantity > item.product.stock:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="商品库存不足")
    item.quantity = payload.quantity
    db.commit()
    db.refresh(item)
    return cart_item_to_dict(item)


@app.delete("/api/cart/items/{item_id}")
def delete_cart_item(
    item_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_customer)],
) -> dict:
    item = db.get(CartItem, item_id)
    if not item or item.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="购物车商品不存在")
    db.delete(item)
    db.commit()
    return {"message": "deleted"}


@app.post("/api/orders")
def create_order(
    payload: OrderCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_customer)],
) -> dict:

    cart_items = db.query(CartItem).filter(CartItem.user_id == current_user.id).all()

    if not cart_items:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="购物车为空")

    for item in cart_items:
        if item.quantity > item.product.stock:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"{item.product.name} 库存不足")

    selected_address = db.get(Address, payload.address_id)
    if not selected_address or selected_address.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="收货地址不存在")


    total_amount = round(sum(item.product.price * item.quantity for item in cart_items), 2)
    order = Order(
        user_id=current_user.id,
        total_amount=total_amount,
        status="created",
        address_id=selected_address.id,
        address_snapshot=str(address_to_dict(selected_address)),

    )

    db.add(order)
    db.flush()

    for item in cart_items:
        product = item.product
        product.stock -= item.quantity
        db.add(
            OrderItem(
                order_id=order.id,
                product_id=product.id,
                product_name=product.name,
                product_price=product.price,
                quantity=item.quantity,
                subtotal=round(product.price * item.quantity, 2),
            )
        )
        db.delete(item)

    db.commit()
    db.refresh(order)
    return order_to_dict(order)


@app.get("/api/orders")
def list_orders(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_customer)],
) -> list[dict]:
    orders = db.query(Order).filter(Order.user_id == current_user.id).order_by(Order.id.desc()).all()
    return [order_to_dict(order) for order in orders]


@app.get("/api/orders/{order_id}")
def get_order(
    order_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_customer)],
) -> dict:
    order = db.get(Order, order_id)
    if not order or order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")
    return order_to_dict(order)


@app.post("/api/orders/{order_id}/pay")
def pay_order(
    order_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_customer)],
) -> dict:
    order = db.get(Order, order_id)
    if not order or order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")
    if order.status != "created":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="当前订单不能支付")
    apply_order_status(order, "paid")
    db.commit()
    db.refresh(order)
    return order_to_dict(order)


@app.post("/api/orders/{order_id}/cancel")
def cancel_order(
    order_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_customer)],
) -> dict:
    order = db.get(Order, order_id)
    if not order or order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")
    if order.status not in {"created", "paid"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="当前订单不能取消")
    apply_order_status(order, "canceled")
    db.commit()
    db.refresh(order)
    return order_to_dict(order)


@app.post("/api/orders/{order_id}/after-sale")
def create_after_sale(
    order_id: int,
    payload: AfterSaleCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_customer)],
) -> dict:
    order = db.get(Order, order_id)
    if not order or order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")
    if order.status not in {"paid", "shipped", "completed"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="当前订单不能申请售后")
    existing = db.query(AfterSale).filter(AfterSale.order_id == order.id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="该订单已提交售后申请")
    after_sale = AfterSale(
        order_id=order.id,
        user_id=current_user.id,
        reason=payload.reason,
        description=payload.description,
        status="pending",
    )
    db.add(after_sale)
    db.commit()
    db.refresh(after_sale)
    return after_sale_to_dict(after_sale)


@app.post("/api/orders/{order_id}/reviews")
def create_review(
    order_id: int,
    payload: ReviewCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[User, Depends(get_current_customer)],
) -> dict:
    order = db.get(Order, order_id)
    if not order or order.user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")
    if order.status != "completed":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="订单完成后才能评价")
    order_item = next((item for item in order.items if item.product_id == payload.product_id), None)
    if not order_item:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="评价商品不属于该订单")
    existing = db.query(Review).filter(Review.order_id == order.id, Review.product_id == payload.product_id).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="该商品已评价")
    review = Review(
        order_id=order.id,
        product_id=payload.product_id,
        user_id=current_user.id,
        product_name=order_item.product_name,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review_to_dict(review)



@app.get("/api/admin/summary")
def admin_summary(
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[User, Depends(get_current_admin)],
) -> dict:
    total_products = db.query(Product).count()
    total_users = db.query(User).count()
    total_orders = db.query(Order).count()
    revenue = float(db.query(func.coalesce(func.sum(Order.total_amount), 0.0)).scalar() or 0.0)
    pending_orders = db.query(Order).filter(Order.status == "created").count()
    low_stock_products = db.query(Product).filter(Product.stock <= 5).count()
    return {
        "total_products": total_products,
        "total_users": total_users,
        "total_orders": total_orders,
        "revenue": round(revenue, 2),
        "pending_orders": pending_orders,
        "low_stock_products": low_stock_products,
    }


@app.get("/api/admin/products")
def admin_list_products(
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[User, Depends(get_current_admin)],
) -> list[dict]:
    products = db.query(Product).order_by(Product.id.asc()).all()
    return [product_to_dict(product) for product in products]


@app.post("/api/admin/products")
def admin_create_product(
    payload: ProductCreate,
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[User, Depends(get_current_admin)],
) -> dict:
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return product_to_dict(product)


@app.put("/api/admin/products/{product_id}")
def admin_update_product(
    product_id: int,
    payload: ProductUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[User, Depends(get_current_admin)],
) -> dict:
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="商品不存在")
    for field, value in payload.model_dump().items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product_to_dict(product)


@app.delete("/api/admin/products/{product_id}")
def admin_delete_product(
    product_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[User, Depends(get_current_admin)],
) -> dict:
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="商品不存在")
    db.query(CartItem).filter(CartItem.product_id == product.id).delete(synchronize_session=False)
    db.delete(product)
    db.commit()
    return {"message": "deleted"}


@app.get("/api/admin/orders")
def admin_list_orders(
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[User, Depends(get_current_admin)],
) -> list[dict]:
    orders = db.query(Order).order_by(Order.id.desc()).all()
    result: list[dict] = []
    for order in orders:
        user = db.get(User, order.user_id)
        if user:
            result.append(admin_order_to_dict(order, user))
    return result


@app.patch("/api/admin/orders/{order_id}/status")
def admin_update_order_status(
    order_id: int,
    payload: OrderStatusUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[User, Depends(get_current_admin)],
) -> dict:
    if payload.status not in ADMIN_ORDER_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="订单状态不合法")
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")
    if not can_transition_order_status(order.status, payload.status):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="订单状态流转不合法")
    apply_order_status(order, payload.status)
    db.commit()
    db.refresh(order)

    user = db.get(User, order.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")
    return admin_order_to_dict(order, user)


@app.post("/api/admin/orders/{order_id}/shipment")
def admin_update_order_shipment(
    order_id: int,
    payload: ShipmentUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[User, Depends(get_current_admin)],
) -> dict:
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="订单不存在")
    if order.status not in {"paid", "shipped"}:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="当前订单不能发货")
    order.logistics_company = payload.logistics_company
    order.tracking_number = payload.tracking_number
    order.logistics_note = payload.logistics_note
    if order.status == "paid":
        apply_order_status(order, "shipped")
    db.commit()
    db.refresh(order)

    user = db.get(User, order.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="用户不存在")
    return admin_order_to_dict(order, user)


@app.patch("/api/admin/after-sales/{after_sale_id}/status")
def admin_update_after_sale_status(
    after_sale_id: int,
    payload: AfterSaleStatusUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[User, Depends(get_current_admin)],
) -> dict:
    if payload.status not in AFTER_SALE_STATUSES:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="售后状态不合法")
    after_sale = db.get(AfterSale, after_sale_id)
    if not after_sale:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="售后申请不存在")
    after_sale.status = payload.status
    after_sale.reply = payload.reply or after_sale.reply
    db.commit()
    db.refresh(after_sale)
    return after_sale_to_dict(after_sale)


@app.get("/api/admin/users")
def admin_list_users(
    db: Annotated[Session, Depends(get_db)],
    current_admin: Annotated[User, Depends(get_current_company_admin)],
) -> list[dict]:
    users = db.query(User).order_by(User.id.asc()).all()
    result: list[dict] = []
    for user in users:
        order_count = db.query(Order).filter(Order.user_id == user.id).count()
        cart_item_count = db.query(CartItem).filter(CartItem.user_id == user.id).count()
        address_count = db.query(Address).filter(Address.user_id == user.id).count()
        payload = user_to_dict(user)
        payload["order_count"] = order_count
        payload["cart_item_count"] = cart_item_count
        payload["address_count"] = address_count

        result.append(payload)
    return result

