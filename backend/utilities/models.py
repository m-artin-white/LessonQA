from pydantic import BaseModel, EmailStr

# Pydantic models, used for verification of User schema on login or register

class UserModel(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLoginModel(BaseModel):
    email: EmailStr
    password: str


