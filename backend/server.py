from fastapi import FastAPI, File, UploadFile, Form, HTTPException, status, Depends
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId
from datetime import datetime, timezone
from utilities.models import *
from utilities.llm import LLM
from utilities.mongodb_helper import MongoDBHelper
from utilities.auth_helpers import AuthHelpers
from utilities.extraction_tool import ExtractionTool
from utilities.ollama_llm import OllamaLLM
from typing import List
import json
import random
from typing import Optional

# Setting up my classes...
app = FastAPI()

## LLM() = LLM class that uses GGUF model with llama-cpp-python. ***ONLY UNCOMMENT AND USE IF YOUR HARDWARE CAN SUPPORT THIS***
#llm = LLM()

## OllamaLLM() = LLM class that uses Ollama with llama3.2. ***USE ON LESS POWERFUL SYSTEMS***
llm = OllamaLLM()

mdb = MongoDBHelper()
auth_helpers = AuthHelpers()
extraction_tool = ExtractionTool()

# Added middleware to server to avoid CORS issues. 
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],                      
    allow_headers=["*"],                   
)

# Route for summarizing content from uploaded files or provided lecture summaries
@app.post("/summarise")
async def summarise_content(
    lecture_summary: Optional[str] = Form(None),  # Optional string for a manual lecture summary
    file: Optional[UploadFile] = None  # Optional file upload
):
    extracted_text = ""
    extracted_split_text_list = []
    lecture_summary_chunked_list = []

    # Check if a file has been provided
    if file:
        file_content = await file.read()  # Read the file content as bytes
        if file.content_type == "application/pdf":  # Check if the file type is a PDF
            extracted_text = extraction_tool.extract_text_from_pdf(file_content)
            extracted_split_text_list = llm.split_text(extracted_text)
        elif file.content_type in ["application/vnd.openxmlformats-officedocument.presentationml.presentation", "application/vnd.ms-powerpoint"]:  # Check if the file is a PowerPoint
            extracted_text = extraction_tool.extract_text_from_pptx(file_content)
            extracted_split_text_list = llm.split_text(extracted_text)
        else:
            # Raise an error if the file type is unsupported
            raise HTTPException(
                status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
                detail="Unsupported file type. Please upload a PDF or PowerPoint file."
            )

    # Check if a lecture summary has been provided and process it
    if lecture_summary:
        lecture_summary_chunked_list = llm.split_text(lecture_summary)

    # Combine extracted and manual text chunks for summarization
    final_chunks = lecture_summary_chunked_list + extracted_split_text_list

    # Create summaries for each text chunk
    sentence_summaries = []
    for chunk in final_chunks:
        summary = llm.summarise(chunk)
        sentence_summaries.append(summary)
    
    # Return the list of generated summaries as a JSON response
    return JSONResponse(content={"summaries": sentence_summaries})

# Route for uploading and processing summaries
@app.post("/upload")
async def upload_content(
    summaries: List[str] = Form([])  # Accepts a list of strings containing summaries
):
    # Validate if the summaries list contains a single JSON string that needs parsing
    if len(summaries) == 1 and isinstance(summaries[0], str):
        try:
            summaries_parsed = json.loads(summaries[0])  # Parse JSON string into a Python list
            if isinstance(summaries_parsed, list):
                summaries = summaries_parsed  # Replace summaries with parsed list if valid
        except json.JSONDecodeError:
            # Raise an error if JSON decoding fails
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid format for summaries. Ensure it is a valid JSON string."
            )

    # Raise an error if the summaries list is empty
    if not summaries:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The summaries list is empty. Please provide valid summaries."
        )

    # Select a random summary from the list for further processing
    random_index = random.randint(0, len(summaries) - 1)
    random_summary = summaries[random_index]

    # Ensure the selected summary is a string for further processing
    if not isinstance(random_summary, str):
        random_summary = str(random_summary)

    # Combine the selected summary with additional text for querying the LLM
    text_and_file = f"Lecture Content: {random_summary}"
    response = llm.query(query=text_and_file)

    # Handle cases where the LLM does not return a response
    if not response:
        response = "No response from LLM"

    # Return the LLM's response as a JSON response
    return JSONResponse(content={"message": response})

# The evaluate route takes in a question from the LLM on the lecture material, the response to the question by the
# lecturer, and evalutes the response based on the question, providing feedback and recommendations.
@app.post("/evaluate")
async def evaluate_answer(
    question: str = Form(...), 
    answer: str = Form(...), 
    current_user: dict = Depends(mdb.get_current_user)
):
    evaluation_result = llm.evaluate(question, answer)
    return {"evaluation": evaluation_result}

# The store-lecture route is responsible for storing the history of the interactions the user has with the LLM
# in the application. It stores their uploaded lecture summary and lecture file name in the "user_message_history"
# collection. Each user has one entry in this collection, however this entry is broken down further and each new interaction
# is appended to the entry in the form of a list.
@app.post("/store-lecture")
async def store_lecture(
    lecture_summary: str = Form(...),          
    lecture_file_name: str = Form(...),        
    current_user: dict = Depends(mdb.get_current_user)
):
    # Generating an unique entry for each lecture for the user...
    lecture_entry = {
        "_id": ObjectId(),  
        "lecture_summary": lecture_summary,
        "lecture_file_name": lecture_file_name,  
        "created_at": datetime.now(timezone.utc),
        "students": []  # Students list holds the questions, answers and evaluations for each lecture/interaction.
    }
    
    user_history = await mdb.get_user_message_history_collection().find_one({"user_id": current_user["_id"]})
    
    # If entry already, append the new interaction to the lectures list...
    if user_history:
        await mdb.get_user_message_history_collection().update_one(
            {"user_id": current_user["_id"]},
            {"$push": {"lectures": lecture_entry}}
        )
    # If no entry for a user yet, create one...
    else:
        new_user_history = {
            "user_id": current_user["_id"],
            "username": current_user["username"],
            "email": current_user["email"],
            "lectures": [lecture_entry]
        }
        await mdb.get_user_message_history_collection().insert_one(new_user_history)

    return {"message": "Lecture stored successfully", "lecture_id": str(lecture_entry["_id"])}

# This route is responsible for storing the questions from the LLM, the response from the user and the evaluation from
# the LLM for each interaction in the "students" list, and each "lecture" will have an associated "students" array...
@app.post("/store-student-response")
async def store_student_response(
    lecture_id: str = Form(...),
    question: str = Form(...),
    response: str = Form(...),
    evaluation: str = Form(...),
    current_user: dict = Depends(mdb.get_current_user)
):
    
    # Check to ensure all entities are present before storing...
    if not all([lecture_id, question, response, evaluation]):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="All fields are required")
    
    student_entry = {
        "question": question,
        "response": response,
        "evaluation": evaluation
    }

    # Uses user_id and lecture_id in collection to insert each new evaluation record...
    result = await mdb.get_user_message_history_collection().update_one(
        {
            "user_id": current_user["_id"],
            "lectures._id": ObjectId(lecture_id)
        },
        {
            "$push": {"lectures.$.students": student_entry}
        }
    )
    # If no records found for a particular update call, raise an error...
    if result.matched_count == 0:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lecture not found")
    
    return {"message": "Student response stored successfully"}

# This route serves the "History" page in the frontend. It pulls data from the user_message_history collection
# and displays it accordingly for each user on the page.
@app.get("/upload-history")
async def get_upload_history(current_user: dict = Depends(mdb.get_current_user)):
    user_history = await mdb.get_user_message_history_collection().find_one({"user_id": current_user["_id"]})
    
    if not user_history:
        raise HTTPException(status_code=404, detail="No upload history found for this user")
    
    # Converting ObjectIds in MongoDB in lectures to strings. Error thrown otherwise...
    user_history["lectures"] = mdb.convert_object_ids(user_history["lectures"])
    
    return {"lectures": user_history["lectures"]}

# Register route. Checks if user exists already in user_credentials collection in MongoDB. If not creates a
# new user, hashes their password and stores it in the collection. For schema verification, I used Pydantic 
# to ensure the schema is abided by for each new user.
@app.post("/register", status_code=status.HTTP_201_CREATED)
async def register_user(user: UserModel):
    existing_user = await mdb.get_user_collection().find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email is already registered")

    user_data = user.dict()
    user_data["password"] = auth_helpers.hash_password(user_data["password"])
    result = await mdb.get_user_collection().insert_one(user_data)
    
    return {"message": "User registered successfully", "user_id": str(result.inserted_id)}

# Login route. Checks using email to see if user exists and then verifies the password. Creates a token
# which is used in the frontend (stored in local storage) to allow access to particular pages and control access.
@app.post("/login")
async def login_user(user: UserLoginModel):
    user_record = await mdb.get_user_collection().find_one({"email": user.email})
    if not user_record or not auth_helpers.verify_password(user.password, user_record["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")

    token_data = {"user_id": str(user_record["_id"])}
    token = auth_helpers.create_access_token(data=token_data)
    
    return {"access_token": token, "token_type": "bearer"}


