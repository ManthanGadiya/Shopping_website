from datetime import datetime
from typing import Optional

from sqlalchemy.orm import Session

import models
import schemas
from utils.auth import hash_password, verify_password


def get_customer(db: Session, customer_id: int) -> Optional[models.Customer]:
    return db.query(models.Customer).filter(models.Customer.customer_id == customer_id).first()


def get_customer_by_email(db: Session, email: str) -> Optional[models.Customer]:
    return db.query(models.Customer).filter(models.Customer.email == email).first()


def list_customers(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Customer).offset(skip).limit(limit).all()


def create_customer(db: Session, payload: schemas.CustomerCreate) -> Optional[models.Customer]:
    if get_customer_by_email(db, payload.email):
        return None

    data = payload.model_dump()
    data["password"] = hash_password(payload.password)
    db_customer = models.Customer(**data)
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


def authenticate_customer(db: Session, email: str, password: str) -> Optional[models.Customer]:
    customer = get_customer_by_email(db, email)
    if not customer:
        return None
    if not verify_password(password, customer.password):
        return None
    return customer


def update_customer(db: Session, customer_id: int, payload: schemas.CustomerUpdate) -> Optional[models.Customer]:
    customer = get_customer(db, customer_id)
    if not customer:
        return None

    updates = payload.model_dump(exclude_unset=True)
    if "password" in updates and updates["password"]:
        updates["password"] = hash_password(updates["password"])

    for field, value in updates.items():
        setattr(customer, field, value)

    db.commit()
    db.refresh(customer)
    return customer


def delete_customer(db: Session, customer_id: int) -> bool:
    customer = get_customer(db, customer_id)
    if not customer:
        return False
    db.delete(customer)
    db.commit()
    return True


def get_product(db: Session, product_id: int) -> Optional[models.Product]:
    return db.query(models.Product).filter(models.Product.product_id == product_id).first()


def list_products(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Product).offset(skip).limit(limit).all()


def create_product(db: Session, product: schemas.ProductCreate) -> models.Product:
    db_product = models.Product(**product.model_dump())
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product


def update_product(db: Session, product_id: int, payload: schemas.ProductUpdate) -> Optional[models.Product]:
    db_product = get_product(db, product_id)
    if not db_product:
        return None

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(db_product, field, value)

    db.commit()
    db.refresh(db_product)
    return db_product


def delete_product(db: Session, product_id: int) -> bool:
    db_product = get_product(db, product_id)
    if not db_product:
        return False
    db.delete(db_product)
    db.commit()
    return True


def add_to_cart(db: Session, payload: schemas.CartAdd) -> Optional[models.CartItem]:
    customer = get_customer(db, payload.customer_id)
    product = get_product(db, payload.product_id)
    if not customer or not product:
        return None

    db_item = (
        db.query(models.CartItem)
        .filter(
            models.CartItem.customer_id == payload.customer_id,
            models.CartItem.product_id == payload.product_id,
        )
        .first()
    )
    if db_item:
        db_item.quantity += payload.quantity
    else:
        db_item = models.CartItem(**payload.model_dump())
        db.add(db_item)

    db.commit()
    db.refresh(db_item)
    return db_item


def get_cart_items(db: Session, customer_id: int):
    return db.query(models.CartItem).filter(models.CartItem.customer_id == customer_id).all()


def update_cart_item(db: Session, cart_item_id: int, quantity: int) -> Optional[models.CartItem]:
    db_item = db.query(models.CartItem).filter(models.CartItem.cart_item_id == cart_item_id).first()
    if not db_item:
        return None
    db_item.quantity = quantity
    db.commit()
    db.refresh(db_item)
    return db_item


def remove_cart_item(db: Session, cart_item_id: int) -> bool:
    db_item = db.query(models.CartItem).filter(models.CartItem.cart_item_id == cart_item_id).first()
    if not db_item:
        return False
    db.delete(db_item)
    db.commit()
    return True


def clear_cart(db: Session, customer_id: int) -> int:
    deleted = db.query(models.CartItem).filter(models.CartItem.customer_id == customer_id).delete()
    db.commit()
    return deleted


def create_order_from_cart(db: Session, customer_id: int, payment_method: str) -> Optional[models.Order]:
    customer = get_customer(db, customer_id)
    if not customer:
        return None

    cart_items = (
        db.query(models.CartItem)
        .filter(models.CartItem.customer_id == customer_id)
        .all()
    )
    if not cart_items:
        return None

    # Validate stock before creating the order.
    for item in cart_items:
        if item.product.stock_quantity < item.quantity:
            return None

    total_amount = sum(item.product.price * item.quantity for item in cart_items)
    order = models.Order(
        customer_id=customer_id,
        order_date=datetime.utcnow(),
        total_amount=total_amount,
        payment_status="PENDING",
        delivery_status="PLACED",
    )
    db.add(order)
    db.flush()

    for item in cart_items:
        sub_total = item.product.price * item.quantity
        db_item = models.OrderItem(
            order_id=order.order_id,
            product_id=item.product_id,
            price=item.product.price,
            quantity=item.quantity,
            sub_total=sub_total,
        )
        item.product.stock_quantity -= item.quantity
        db.add(db_item)

    payment = models.Payment(
        order_id=order.order_id,
        payment_method=payment_method,
        status="SUCCESS",
        paid_at=datetime.utcnow(),
    )
    db.add(payment)
    order.payment_status = "PAID"

    db.query(models.CartItem).filter(models.CartItem.customer_id == customer_id).delete()
    db.commit()
    db.refresh(order)
    return order


def get_order(db: Session, order_id: int) -> Optional[models.Order]:
    return db.query(models.Order).filter(models.Order.order_id == order_id).first()


def list_orders_for_customer(db: Session, customer_id: int):
    return db.query(models.Order).filter(models.Order.customer_id == customer_id).all()


def update_order_status(
    db: Session,
    order_id: int,
    payment_status: Optional[str] = None,
    delivery_status: Optional[str] = None,
) -> Optional[models.Order]:
    order = get_order(db, order_id)
    if not order:
        return None
    if payment_status is not None:
        order.payment_status = payment_status
    if delivery_status is not None:
        order.delivery_status = delivery_status
    db.commit()
    db.refresh(order)
    return order


def create_review(db: Session, payload: schemas.ReviewCreate) -> Optional[models.Review]:
    customer = get_customer(db, payload.customer_id)
    product = get_product(db, payload.product_id)
    if not customer or not product:
        return None

    db_review = models.Review(**payload.model_dump())
    db.add(db_review)
    db.flush()

    reviews = db.query(models.Review).filter(models.Review.product_id == payload.product_id).all()
    if reviews:
        product.rating = sum(r.rating for r in reviews) / len(reviews)

    db.commit()
    db.refresh(db_review)
    return db_review


def list_reviews_by_product(db: Session, product_id: int):
    return db.query(models.Review).filter(models.Review.product_id == product_id).all()
