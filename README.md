# HR Agent Demo Application

---

## Overview

The **HR Agent Demo Application** is a full-stack project designed to showcase the integration of Azure AI services with modern web technologies. This application allows users to interact with an AI-powered HR assistant via text and speech, providing a seamless experience for onboarding and HR-related queries.

---

## Technologies Used

### Frontend
- **React**: Used for building the user interface.
- **Next.js**: Framework for server-side rendering and static site generation.
- **React Markdown**: For rendering markdown responses from the AI agent.
- **remark-gfm**: Enables GitHub-flavored markdown for better formatting of agent responses.
- **Tailwind CSS**: For styling the application with a modern and responsive design.

### Backend
- **FastAPI**: Python framework for building RESTful APIs.
- **Azure AI**: Used for creating and managing the HR agent.
- **Azure Cognitive Services (Speech)**: Handles speech-to-text conversion.
- **Pydantic**: For data validation and serialization.
- **dotenv**: For managing environment variables securely.

### Azure Services
- **Azure AI Projects**: Used to create and manage the HR agent.
- **Azure Cognitive Services (Speech)**: Used for speech recognition and processing.
- **Azure Identity**: Provides secure authentication for accessing Azure resources.

---

## How It Works

### 1. **Creating the HR Agent**
The HR agent was created in **Azure Foundry** using the **Agent Vector Store**. The agent was configured with instructions and connected to HR-related files stored in the vector store. This allows the agent to retrieve relevant information and provide accurate responses to user queries.

### 2. **Frontend Workflow**
- **Text Interaction**:
  - Users type their queries into the input field.
  - The query is sent to the backend via the `/chat` endpoint.
  - Responses from the HR agent are displayed in the chat interface using markdown formatting.

- **Speech Interaction**:
  - Users can click the microphone button to start recording their voice.
  - The recorded audio is processed in the frontend and sent to the backend via the `/speech-to-text` endpoint.
  - The backend converts the speech to text and sends it to the HR agent for processing.
  - The agent's response is displayed in the chat interface.

### 3. **Backend Workflow**
- **Speech-to-Text**:
  - The backend uses **Azure Cognitive Services (Speech)** to convert audio files into text.
  - The speech resource is configured using the `AZURE_SPEECH_KEY` and `AZURE_REGION` environment variables.
  - The converted text is sent to the HR agent for processing.

- **Chat Interaction**:
  - The backend interacts with the HR agent using the **Azure AI Projects** SDK.
  - User messages are sent to the agent's thread, and the agent processes the input to generate a response.
  - The response is retrieved and sent back to the frontend.

---

## Environment Variables

The application uses the following environment variables:

```properties
AZURE_AI_ENDPOINT=https://<your-ai-endpoint>.services.ai.azure.com/api/projects/<project-name>
AGENT_ID=<your-agent-id>
THREAD_ID=<your-thread-id>
AZURE_SPEECH_KEY=<your-speech-key>
AZURE_REGION=<your-region>
```

These variables are stored in the .env file and loaded using the dotenv library.
----

## Setting Up Speech Resource
To handle speech-to-text functionality:

### 1. Create a Speech Resource:

Go to the Azure portal and create a Speech resource.
Note down the Key and Region.
### 2. Configure Backend:

Add the AZURE_SPEECH_KEY and AZURE_REGION to the .env file.
Use the azure.cognitiveservices.speech SDK to process audio files.
### 3. Frontend Integration:

Use the browser's MediaRecorder API to record audio.
Convert the recorded audio to WAV format and send it to the backend for processing.

---

## Features
1. Text-Based Interaction
Users can type their queries and receive responses from the HR agent in real-time.

2. Speech-Based Interaction
Users can speak their queries, which are converted to text and processed by the HR agent.

3. Markdown Rendering
Agent responses are formatted using markdown for better readability.

4. Azure Integration
The application leverages Azure AI and Cognitive Services for intelligent responses and speech processing.

---

## How to Run

### Prerequisites
- Node.js and npm installed.
- Python 3.9+ installed.
- Azure account with AI and Speech resources.

### Steps
1. **Clone the repository**:
   ```bash
   git clone https://github.com/cyrilbouharb/HRAgentDemo.git
   cd HRAgentDemo
    ```
2. **Install dependencies**:

    -Frontend:
    ```bash
    cd frontend
    npm install
    ```

    -Backend:
    ```bash
    cd backend
    pip install -r requirements.txt
    ```
3. **Set up Azure credentials**:
    Create a new file named `.env` in the `backend` directory with the following:
    ```bash
    AZURE_AI_ENDPOINT=https://<your-ai-endpoint>.services.ai.azure.com/api/projects/<project-name>
    AGENT_ID=<your-agent-id>
    THREAD_ID=<your-thread-id>
    AZURE_SPEECH_KEY=<your-speech-key>
    AZURE_REGION=<your-region>
    ```
4. **Start the backend**:
    ```bash
    uvicorn main:app --reload

5. **Start the frontend**:
    ```bash
    npm run dev

6. **Open the application**:
    ```bash
    Visit http://localhost:3000 in your browser.

