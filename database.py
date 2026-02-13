from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base, sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./petshop.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def ensure_runtime_schema():
    # Lightweight runtime migration: add admins.email if missing.
    with engine.begin() as conn:
        cols = conn.execute(text("PRAGMA table_info(admins)")).fetchall()
        col_names = {c[1] for c in cols}
        if "email" not in col_names:
            conn.execute(text("ALTER TABLE admins ADD COLUMN email VARCHAR(100)"))
            # Backfill deterministic placeholder emails for existing admins.
            conn.execute(
                text(
                    "UPDATE admins SET email = lower(user_name) || '@petshop.com' "
                    "WHERE email IS NULL OR email = ''"
                )
            )


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
