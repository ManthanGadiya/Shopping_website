from database import SessionLocal
import crud
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


def main():
    db = SessionLocal()
    try:
        admin = seed_admin(db)
        customers = seed_customers(db)
        print(f"admin_seeded={1 if admin else 0}")
        print(f"customers_seeded={len(customers)}")
        print("admin_username=admin1")
        print("admin_password=admin1234")
        print("user_password=user1234")
    finally:
        db.close()


if __name__ == "__main__":
    main()
