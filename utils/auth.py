import hashlib
import hmac
import os
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import jwt

SECRET_KEY = os.getenv(
    "PETSHOP_SECRET_KEY",
    "change-this-in-production-please-use-a-strong-secret-key",
)
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24


def hash_password(password: str) -> str:
    salt = os.urandom(16)
    pwd_hash = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120000)
    return f"{salt.hex()}${pwd_hash.hex()}"


def verify_password(plain_password: str, stored_password: str) -> bool:
    try:
        salt_hex, hash_hex = stored_password.split("$", 1)
    except ValueError:
        return False

    salt = bytes.fromhex(salt_hex)
    expected_hash = bytes.fromhex(hash_hex)
    check_hash = hashlib.pbkdf2_hmac("sha256", plain_password.encode("utf-8"), salt, 120000)
    return hmac.compare_digest(check_hash, expected_hash)


def create_access_token(data: dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_access_token(token: str) -> Optional[dict[str, Any]]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except jwt.PyJWTError:
        return None
    return payload
