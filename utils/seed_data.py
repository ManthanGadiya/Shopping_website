from database import Base, SessionLocal, engine
import crud
import models
import schemas


def seed_admins(db):
    admin_inputs = [
        ("admin1", "admin1@petshop.com", "admin1234"),
        ("admin2", "admin2@petshop.com", "admin5678"),
    ]
    admins = []
    for user_name, email, password in admin_inputs:
        existing = crud.get_admin_by_username(db, user_name) or crud.get_admin_by_email(db, email)
        if existing:
            if existing.email != email:
                existing.email = email
                db.commit()
            admins.append(existing)
            continue
        created = crud.create_admin(
            db,
            schemas.AdminCreate(user_name=user_name, email=email, password=password),
        )
        admins.append(created)
    return admins


def seed_customers(db):
    customers = []
    for idx in range(1, 16):
        payload = schemas.CustomerCreate(
            name=f"User {idx}",
            contact_no=f"90000000{idx:02d}",
            email=f"user{idx}@example.com",
            pet_type=["Dog", "Cat", "Bird", "Fish", "Rabbit"][idx % 5],
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
        ("Pet Vitamin Syrup", "Medicine", 420, 26),
        ("Tick & Flea Spray", "Medicine", 360, 24),
        ("Orthopedic Dog Bed", "Beds", 1890, 12),
        ("Cat Cozy Bed", "Beds", 1450, 14),
        ("Training Clicker", "Training", 175, 40),
        ("Puppy Training Pads", "Training", 520, 33),
        ("Ear Cleaning Wipes", "Hygiene", 210, 38),
        ("Pet Dental Chews", "Healthcare", 460, 29),
        ("Pet Carrier Medium", "Travel", 1750, 10),
        ("Pet Harness Reflective", "Accessories", 490, 31),
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


def seed_services(db):
    services = [
        ("Pet Grooming", "Full coat grooming with hygiene care", 799),
        ("Vet Consultation", "General health check-up and guidance", 599),
        ("Pet Training Session", "Basic obedience and behavior training", 999),
        ("Pet Boarding", "Safe boarding service per day", 1200),
        ("Vaccination Camp", "Scheduled vaccination support", 499),
    ]
    created = 0
    for name, description, price in services:
        existing = db.query(models.Service).filter(models.Service.name == name).first()
        if existing:
            continue
        db.add(models.Service(name=name, description=description, price=price, is_active=1))
        created += 1
    db.commit()
    return created


def seed_articles(db):
    articles = [
        ("How to Choose the Right Dog Food", "Pick food by age, breed, activity level, and vet guidance."),
        ("Cat Grooming Basics", "Regular brushing and nail trims help prevent common issues."),
        ("Pet Vaccination Schedule", "Maintain a vaccination calendar for timely boosters and safety."),
    ]
    created = 0
    for title, content in articles:
        existing = db.query(models.Article).filter(models.Article.title == title).first()
        if existing:
            continue
        db.add(models.Article(title=title, content=content, is_published=1))
        created += 1
    db.commit()
    return created


def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        admins = seed_admins(db)
        customers = seed_customers(db)
        products = seed_products(db)
        reviews_created = seed_reviews(db, customers, products)
        orders_created = seed_orders(db, customers, products)
        services_created = seed_services(db)
        articles_created = seed_articles(db)
        print(f"admins_seeded={len(admins)}")
        print(f"customers_seeded={len(customers)}")
        print(f"products_seeded={len(products)}")
        print(f"reviews_created={reviews_created}")
        print(f"orders_created={orders_created}")
        print(f"services_created={services_created}")
        print(f"articles_created={articles_created}")
        print("admin_username=admin1")
        print("admin_email=admin1@petshop.com")
        print("admin_password=admin1234")
        print("admin2_username=admin2")
        print("admin2_email=admin2@petshop.com")
        print("admin2_password=admin5678")
        print("user_password=user1234")
    finally:
        db.close()


if __name__ == "__main__":
    main()
