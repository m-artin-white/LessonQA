import bcrypt
import jwt
import os
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv

class AuthHelpers():
    def __init__(self):
        load_dotenv()
        self.SECRET_KEY = os.getenv("SECRET_AUTH_KEY") 
    
    # Hashes passwords for storage in user_credentials collection in MongoDB
    def hash_password(self, password: str) -> str:
        return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    # Verifies string password against it's hash for verification
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))

    # Creates an access token for authorisation features in the frontend
    def create_access_token(self, data: dict) -> str:
        to_encode = data.copy()
        
        # Tokens expire after 1 hour, prompting re-login
        expire = datetime.now(timezone.utc) + timedelta(hours=1)
        to_encode.update({"exp": expire})
        
        token = jwt.encode(to_encode, self.SECRET_KEY, algorithm="HS256")
        return token
    

