import requests

# Define the endpoint URL
url = "http://127.0.0.1:8000/speech-to-text"

# Path to the test audio file
audio_file_path = "harvard.wav"

# Open the audio file in binary mode
with open(audio_file_path, "rb") as audio_file:
    # Send a POST request with the audio file
    files = {"file": ("harvard.wav", audio_file, "audio/wav")}
    response = requests.post(url, files=files)

# Print the response from the server
if response.status_code == 200:
    print("Transcription Result:", response.json())
else:
    print("Error:", response.status_code, response.text)