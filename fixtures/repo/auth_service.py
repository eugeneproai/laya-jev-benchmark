# auth_service.py
import hmac
import hashlib
import time

def verify_session_token(token: str, secret: str) -> bool:
    try:
        parts = token.split(".")
        if len(parts) != 2:
            return False
        payload, sig = parts
        expected = hmac.new(secret.encode(), payload.encode(), hashlib.sha256).hexdigest()
        return hmac.compare_digest(sig, expected)
    except Exception:
        return False
