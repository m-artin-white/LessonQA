# LessonQA (Originally called 'CLUSTER')

## Description

This project aims to provide trainee teachers with a simulated classroom environment where AI-powered students can engage with lectures, ask questions, and provide feedback. By leveraging Large Language Models (LLMs), the system enables educators to experiment with different teaching styles and refine their pedagogical approaches.

The system consists of:

- A Python/FastAPI backend to manage AI student interactions using LLMs.
- A MongoDB, React+Vite, and NodeJS web application for teachers to provide lectures and lecture summaries and receive AI-generated student questions.

This tool helps bridge the gap in hands-on teaching experience by offering an accessible and interactive way to practice and improve educational techniques. 

## Features

The application consists of various pages and features:

| Feature  | Description |
| ------------- |:-------------:|
| Home Page      | Landing page. Provides information on the goal of the project.|
| Upload Page      | Page that allows upload of lecture summaries/PDFs/Powerpoints and have AI students generate questions on the content.      |
| History Page      | Stores the users past interactions with the LLM such as uploaded material, questions generated, answers provided and evaluations returned.    |
| About Page     | Provides information on the creator of the application.     |
| Sign In Page     | Allows user to log in and access other features of the application.     |
| Sign Up Page      | Allows users to create an account with the application.     |


## Installation

The project is structured into two main folders: frontend and backend. Each requires specific configuration and installation steps, which must be followed separately.

For setting up the backend, there are two different configuration approaches depending on your hardware capabilities. You need to follow at least one of these methods, but if your hardware allows, you can configure both to experiment with different LLMs.

Some setup instructions may overlap between the two approaches, so be sure to follow the relevant steps carefully.

You will be required to install external libaries in Python for this application, thus I would recommend using a virtual environment to prevent any library conflicts in your global environment. Use `python -m venv .venv` to create your virtual environment and use `.venv/scripts/activate` to activate your virtual environment before installing any libaries i.e `pip install ...`.

At the end of this section I also provide information on how to run the application using Docker on the final year lab computers (PCs with Nvidia RTX 4090 GPUs).

To begin __pull the repository to your local system__

#### Backend Setup (Ollama Configuration):
1. Ensure you have Python 3.11.6 or greater installed on your system.
2. Download the Ollama libary [here](https://github.com/ollama/ollama).
3. Run the following command in a terminal to download the llama3.2 LLM:  ```ollama pull llama3.2:3b```.
4. Open the CLUSTER folder. Change directory into the ```backend``` folder using the terminal using the command ```cd backend```.
5. Download the required libaries using the following command in terminal: ```pip install -r requirements.txt```.


#### Backend Setup (llama-cpp-python Configuration):
__llama-cpp-python__ uses your PC's hardware to run a quantised version of popular LLMs.

1. Ensure you have Python 3.11.6 or greater installed on your system.
2. Click [here](https://pypi.org/project/llama-cpp-python/) to get started with llama-cpp-python. 
3. Download the GGUF model of the Mistral 7B Instruct model [here](https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/blob/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf). After downloading, create a new folder under the ```backend``` folder and place the GGUF file within it. __For example__: ```/CLUSTER/backend/gguf/your_gguf_file.gguf```.
4. Change directory into the ```backend``` folder using the terminal using the command ```cd backend```.
6. Download the required libaries using the following command in terminal: ```pip install -r requirements.txt```.


#### Frontend Setup

1. Ensure you have Node.js >= 20.16.0 installed.
2. Change directory into the ```frontend``` folder using ```cd frontend```.
3. Run commmand: ```npm install``` in terminal.
4. Within the ```frontend``` folder you will find a ```requirements.txt``` file. For each library listed within this file, run ```npm install {libary_name}``` in order to install each one.


#### Docker Commands:

Below I describe how to build a Docker Image for both the __backend__ and __frontend__ folders' dependencies on the final year lab computers at NUIM (computers running the Nivida RTX 4090 GPUs). At the root level of the repository you will find two Dockerfiles each named `.backend` or `.frontend` respectively. You can use both of these to create two seperate Docker Images.
________________________________________________________________________________

1. __Dockerfile.backend:__

__To build image from file:__ 

`docker build --no-cache -t cluster-backend-image -f Dockerfile.backend .`

__To run container from image:__ 

`docker run --gpus all -it cluster-backend-image`

__OR__

`docker run --gpus all -it (-p 8000:8000) -v /usr/local/home/u200111/CLUSTER/backend:/app/backend cluster-backend-image`
_________________________________________________________________________________

2. __Dockerfile.frontend:__

__To build image from file:__ 

`docker build --no-cache -t cluster-frontend-image -f Dockerfile.frontend .`

__To run container from image:__

`docker run -it -p 5173:5173 -v /usr/local/home/u200111/CLUSTER/frontend:/app cluster-frontend-image`


__OR__


`docker run -it -p 5173:5173 -v /usr/local/home/u200111/CLUSTER/frontend:/app -v /app/node_modules cluster-frontend-image`


## Usage
After everything has been installed correctly I would recommend opening two seperate terminals for the frontend and backend folders.

__To run the backend server:__

In the `backend` terminal, run `cd backend`, followed by `.venv/scripts/activate` if you've used a virtual environment, followed by `uvicorn server:app --reload`. This  will run the FastAPI server on port 8000.  

__To run the frontend UI:__

In the `frontend` terminal, run `cd frontend`followed by `npm run dev`. The application will run on port 5173. To view and use the application visit `localhost:5173` in your browser.

You are now running the application locally. To interact with the AI students, create an account, log in and access the `Upload` page to upload lecture summaries/PDFs/Powerpoints and questions will be generated over the uploaded content.

## Known Errors & Solutions

Below I am listing some errors that occasionally occur and their solutions:

| Error  | Solution |
| ------------- |:-------------:|
| Libary conflict with __pymongo__ and __dnspython__      | Run: ```python -m pip install --upgrade pymongo[srv]``` & ```python -m pip install --upgrade dnspython```|

## Technologies Used
- Python 
- FastAPI
- React + Vite
- MongoDB Atlas
- llama-cpp-python
- Mistral 7B Instruct GGUF Q4_K_M
- Ollama
- llama3.2 LLM
- llama-index

