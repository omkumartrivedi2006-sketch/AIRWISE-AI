"""
AIRWISE AI — Security & Cryptography Unit Tests
Verifies Argon2id password hashing, policy validation, token hashing, and JWT life-cycle.
"""

from datetime import timedelta
from app.core.security import (
    create_access_token,
    decode_access_token,
    generate_secure_random_token,
    hash_password,
    hash_token,
    validate_password_strength,
    verify_password,
)


def test_argon2_hashing_and_verification():
    raw_pw = "SecurePassphrase!2026"
    pw_hash = hash_password(raw_pw)

    assert pw_hash.startswith("$argon2id$")
    assert verify_password(raw_pw, pw_hash) is True
    assert verify_password("WrongPassword123!", pw_hash) is False
    assert verify_password("", pw_hash) is False
    assert verify_password(raw_pw, "") is False


def test_password_strength_policy():
    # 1. Less than 12 chars
    valid, err = validate_password_strength("Short1!a")
    assert valid is False
    assert "at least 12 characters" in (err or "")

    # 2. Missing uppercase
    valid, err = validate_password_strength("lowercaseonly1234!")
    assert valid is False
    assert "uppercase" in (err or "")

    # 3. Missing lowercase
    valid, err = validate_password_strength("UPPERCASEONLY1234!")
    assert valid is False
    assert "lowercase" in (err or "")

    # 4. Missing digit
    valid, err = validate_password_strength("NoDigitsHereAtAll!")
    assert valid is False
    assert "digit" in (err or "")

    # 5. Missing special character
    valid, err = validate_password_strength("NoSpecialChars123")
    assert valid is False
    assert "special character" in (err or "")

    # 6. Common weak password
    valid, err = validate_password_strength("password12345")
    assert valid is False
    assert "too common" in (err or "")

    # 7. Valid strong passphrase
    valid, err = validate_password_strength("ValidP@ssw0rd2026!")
    assert valid is True
    assert err is None


def test_secure_tokens_and_hashing():
    raw_token = generate_secure_random_token(32)
    assert len(raw_token) >= 32
    token_hash = hash_token(raw_token)
    assert len(token_hash) == 64  # SHA-256 hex digest
    assert hash_token(raw_token) == token_hash


def test_jwt_access_token_creation_and_decoding():
    token = create_access_token(user_id=42, role="USER", email="user@airwise.ai")
    payload = decode_access_token(token)

    assert payload is not None
    assert payload["sub"] == "42"
    assert payload["role"] == "USER"
    assert payload["email"] == "user@airwise.ai"
    assert payload["type"] == "access"


def test_jwt_expired_token_rejection():
    # Create token expired in the past
    token = create_access_token(
        user_id=1,
        role="USER",
        email="user@airwise.ai",
        expires_delta=timedelta(seconds=-10),
    )
    payload = decode_access_token(token)
    assert payload is None
