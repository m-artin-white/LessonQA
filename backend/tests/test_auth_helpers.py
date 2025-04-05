import pytest
import jwt
from datetime import datetime, timezone

from utilities.auth_helpers import AuthHelpers

@pytest.fixture
def auth_helpers(monkeypatch):
    monkeypatch.setenv("SECRET_AUTH_KEY", "testsecret")
    return AuthHelpers()

def test_hash_password_returns_hash(auth_helpers):
    password = "mysecretpassword"
    hashed = auth_helpers.hash_password(password)
    
    # Ensure the result is a string and is different from the original password.
    assert isinstance(hashed, str)
    assert hashed != password
    assert hashed.startswith("$2b$") or hashed.startswith("$2a$")

def test_verify_password_correct(auth_helpers):
    password = "anothersecret"
    hashed = auth_helpers.hash_password(password)
    
    # The correct password should verify against the hash.
    assert auth_helpers.verify_password(password, hashed) is True

def test_verify_password_incorrect(auth_helpers):
    correct_password = "correctpassword"
    wrong_password = "wrongpassword"
    hashed = auth_helpers.hash_password(correct_password)
    
    # The wrong password should not verify.
    assert auth_helpers.verify_password(wrong_password, hashed) is False

def test_create_access_token(auth_helpers):
    data = {"user_id": 123}
    token = auth_helpers.create_access_token(data)
    
    # Decode the token using the same secret key and algorithm.
    payload = jwt.decode(token, auth_helpers.SECRET_KEY, algorithms=["HS256"])
    
    # Check that the payload contains the original data.
    assert payload.get("user_id") == 123
    
    # Verify that an expiration ("exp") key exists and is set approximately 1 hour in the future.
    assert "exp" in payload
    exp_timestamp = payload["exp"]
    now_timestamp = datetime.now(timezone.utc).timestamp()
    
    # Allowing some drift in time (e.g., 60 seconds)
    time_diff = exp_timestamp - now_timestamp
    assert 3500 <= time_diff <= 3600
