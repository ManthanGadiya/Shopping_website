from database import SessionLocal
import crud
import models
import schemas


def seed_admin(db):
    admin_payload = schemas.AdminCreate(
        user_name="admin1",
        password="admin1234",
    )
    admin = crud.get_admin_by_username(db, admin_payload.user_name)
    if not admin:
        admin = crud.create_admin(db, admin_payload)
    return admin


def seed_customers(db):
    customers = []
    for idx in range(1, 11):
        payload = schemas.CustomerCreate(
            name=f"User {idx}",
            contact_no=f"90000000{idx:02d}",
            email=f"user{idx}@example.com",
            pet_type=["Dog", "Cat", "Bird", "Fish"][idx % 4],
            password="user1234",
        )
        existing = crud.get_customer_by_email(db, payload.email)
        if existing:
            customers.append(existing)
            continue
        created = crud.create_customer(db, payload)
        customers.append(created)
    return customers


def seed_products(db):
    product_inputs = [
        ("Pedigree Adult Dog Food 3kg", "Food", 980, 40),
        ("Whiskas Cat Food 1.2kg", "Food", 520, 35),
        ("Bird Seed Mix 1kg", "Food", 250, 25),
        ("Fish Flakes 200g", "Food", 180, 30),
        ("Dog Chew Toy Bone", "Toys", 220, 50),
        ("Cat Laser Toy", "Toys", 300, 28),
        ("Pet Shampoo 500ml", "Grooming", 340, 20),
        ("Pet Nail Clipper", "Grooming", 199, 22),
        ("Adjustable Pet Collar", "Accessories", 260, 45),
        ("Travel Pet Water Bottle", "Accessories", 310, 18),
    ]
    products = []
    for name, p_type, price, stock in product_inputs:
        existing = crud.get_product_by_name(db, name)
        if existing:
            products.append(existing)
            continue
        created = crud.create_product(
            db,
            schemas.ProductCreate(
                product_name=name,
                product_type=p_type,
                price=price,
                stock_quantity=stock,
            ),
        )
        products.append(created)
    return products


def seed_reviews(db, customers, products):
    created_count = 0
    for idx in range(min(5, len(customers), len(products))):
        customer = customers[idx]
        product = products[idx]
        existing = (
            db.query(models.Review)
            .filter(
                models.Review.customer_id == customer.customer_id,
                models.Review.product_id == product.product_id,
            )
            .first()
        )
        if existing:
            continue
        rating = 4.0 + (idx % 2) * 0.5
        review = crud.create_review(
            db,
            schemas.ReviewCreate(
                customer_id=customer.customer_id,
                product_id=product.product_id,
                rating=rating,
                comment=f"Sample review {idx + 1}",
            ),
        )
        if review:
            created_count += 1
    return created_count


def seed_orders(db, customers, products):
    created_count = 0
    for idx in range(min(3, len(customers))):
        customer = customers[idx]
        existing_order = (
            db.query(models.Order)
            .filter(models.Order.customer_id == customer.customer_id)
            .first()
        )
        if existing_order:
            continue

        product = products[idx % len(products)]
        crud.add_to_cart(
            db,
            schemas.CartAdd(
                customer_id=customer.customer_id,
                product_id=product.product_id,
                quantity=1 + idx,
            ),
        )
        order = crud.create_order_from_cart(db, customer.customer_id, "UPI")
        if order:
            created_count += 1
    return created_count


def main():
    db = SessionLocal()
    try:
        admin = seed_admin(db)
        customers = seed_customers(db)
        products = seed_products(db)
        reviews_created = seed_reviews(db, customers, products)
        orders_created = seed_orders(db, customers, products)
        print(f"admin_seeded={1 if admin else 0}")
        print(f"customers_seeded={len(customers)}")
        print(f"products_seeded={len(products)}")
        print(f"reviews_created={reviews_created}")
        print(f"orders_created={orders_created}")
        print("admin_username=admin1")
        print("admin_password=admin1234")
        print("user_password=user1234")
    finally:
        db.close()


if __name__ == "__main__":
    main()
