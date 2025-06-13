from pydantic import BaseModel
from fastapi import FastAPI, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import os
import warnings
from urllib3.exceptions import NotOpenSSLWarning
from azure.ai.projects import AIProjectClient
from azure.identity import DefaultAzureCredential
from azure.ai.agents.models import ListSortOrder
from dotenv import load_dotenv
import tempfile
import logging
from fastapi.responses import JSONResponse
import azure.cognitiveservices.speech as speechsdk
import websockets
import asyncio

# Configure logging (ensure this is set appropriately in your application)
logging.basicConfig(level=logging.INFO)

# Define the UserInput model
class UserInput(BaseModel):
    input: str

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Suppress LibreSSL warning
warnings.filterwarnings("ignore", category=NotOpenSSLWarning)

# Load environment variables
load_dotenv()

# Initialize Azure AI client
project = AIProjectClient(
    credential=DefaultAzureCredential(),
    endpoint=os.getenv("AZURE_AI_ENDPOINT")
)

agent_id = os.getenv("AGENT_ID")
thread_id = os.getenv("THREAD_ID")

agent = project.agents.get_agent(agent_id)
thread = project.agents.threads.get(thread_id)

@app.post("/speech-to-text")
async def speech_to_text(file: UploadFile):
    try:
        speech_key = os.getenv("AZURE_SPEECH_KEY")
        service_region = os.getenv("AZURE_REGION")

        if not speech_key or not service_region:
            return JSONResponse(status_code=500, content={"error": "Azure credentials not set."})

        # Save the uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_file_path = temp_file.name

        print(f"Received file: {file.filename}, size: {os.path.getsize(temp_file_path)} bytes")

        # Set up the speech configuration
        speech_config = speechsdk.SpeechConfig(subscription=speech_key, region=service_region)
        speech_config.speech_recognition_language = "en-US"
        audio_config = speechsdk.audio.AudioConfig(filename=temp_file_path)

        # Create a recognizer
        recognizer = speechsdk.SpeechRecognizer(speech_config=speech_config, audio_config=audio_config)

        result = recognizer.recognize_once()
        os.remove(temp_file_path)

        if result.reason == speechsdk.ResultReason.RecognizedSpeech:
            print("Recognized:", result.text)
            return {"text": result.text}
        elif result.reason == speechsdk.ResultReason.NoMatch:
            return JSONResponse(status_code=400, content={"error": "No speech could be recognized."})
        elif result.reason == speechsdk.ResultReason.Canceled:
            return JSONResponse(status_code=500, content={"error": f"Canceled: {result.cancellation_details.reason}"})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"error": str(e)})

@app.post("/chat")
async def chat_with_agent(user_input: UserInput):
    """
    Endpoint to process text input and interact with the Azure AI agent.
    """
    try:
        project.agents.messages.create(
            thread_id=thread.id,
            role="user",
            content=user_input.input
        )

        run = project.agents.runs.create_and_process(
            thread_id=thread.id,
            agent_id=agent.id
        )

        if run.status == "failed":
            raise HTTPException(status_code=500, detail=f"Run failed: {run.last_error}")

        messages = project.agents.messages.list(
            thread_id=thread.id,
            order=ListSortOrder.DESCENDING
        )
        for message in messages:
            if message.role == "assistant" and message.text_messages:
                return {"assistant": message.text_messages[-1].text.value}

        raise HTTPException(status_code=500, detail="No response from agent.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
