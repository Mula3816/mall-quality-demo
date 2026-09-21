import hashlib
from typing import Optional

TOKEN_PREFIX = "demo-token-"


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_password(password: str, password_hash: str) -> bool:
    return hash_password(password) == password_hash


def create_access_token(user_id: int) -> str:
    return f"{TOKEN_PREFIX}{user_id}"


def parse_access_token(token: str) -> Optional[int]:
    if not token.startswith(TOKEN_PREFIX):
        return None
    raw_user_id = token.replace(TOKEN_PREFIX, "", 1)
    if not raw_user_id.isdigit():
        return None
    return int(raw_user_id)
