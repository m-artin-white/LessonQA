import os
import jwt
from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer

class MongoDBHelper():

    oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

    def __init__(self):
        load_dotenv()
        self.SECRET_KEY = os.getenv("SECRET_AUTH_KEY")
        self.MONGO_DB_CONNECTION_STRING = os.getenv("MONGO_DB_CONNECTION_STRING")
        self.client = AsyncIOMotorClient(self.MONGO_DB_CONNECTION_STRING)
        self.database = self.client.user_db 
        self.user_collection = self.database.get_collection("user_credentials")
        self.user_message_history_collection = self.database.get_collection("user_message_history")

    # Gets MongoDB database
    def get_database(self):
        return self.database
    
    # Gets MongoDB user_credentials collection, contains login/register information
    def get_user_collection(self):
        return self.user_collection
    
    # Gets MongoDB user_message_history collection, contains interaction history for each user
    def get_user_message_history_collection(self):
        return self.user_message_history_collection
    
    # Helper function to turn MongoDB ObjectIDs into strings
    def convert_object_ids(self, data):
        if isinstance(data, list):
            return [self.convert_object_ids(item) for item in data]
        elif isinstance(data, dict):
            return {k: (str(v) if isinstance(v, ObjectId) else v) for k, v in data.items()}
        return data
    
    # Helper authorization function
    # Decodes and verifies the JWT token to authenticate the current user.
    # Extracts the user ID from the token payload and retrieves the user from the database.
    # If the user ID is missing, the user is not found, the token is expired, or invalid, it raises a 401 Unauthorized error.
    # Returns the user data if authentication is successful.
    async def get_current_user(self, token: str = Depends(oauth2_scheme)):
        try:
            payload = jwt.decode(token, self.SECRET_KEY, algorithms=["HS256"])
            user_id: str = payload.get("user_id")
            if user_id is None:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid authentication credentials")
            
            user = await self.get_user_collection().find_one({"_id": ObjectId(user_id)})
            if user is None:
                raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
            return user
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
        except jwt.PyJWTError:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
