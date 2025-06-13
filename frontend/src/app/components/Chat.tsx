"use client";

import { useState } from "react";

export default function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, user: "HR Agent", text: "Welcome! How can I assist you today?", timestamp: "Just now", align: "left" },
  ]);
  const [isListening, setIsListening] = useState(false); // State to track microphone listening
  const [isProcessing, setIsProcessing] = useState(false); // State to track backend processing

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      user: "User",
      text: input,
      timestamp: "Just now",
      align: "right",
    };

    setMessages([...messages, userMessage]);
    setInput("");

    try {
      setIsProcessing(true); // Show processing indicator
      console.log("Sending message to backend:", input);
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ input }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch response from the backend.");
      }

      const data = await res.json();
      console.log("Received response from backend:", data);
      const agentMessage = {
        id: messages.length + 2,
        user: "HR Agent",
        text: data.assistant || "I'm here to help!",
        timestamp: "Just now",
        align: "left",
      };

      setMessages((prevMessages) => [...prevMessages, agentMessage]);
    } catch (error) {
      console.error("Error in handleSend:", error);
      const errorMessage = {
        id: messages.length + 2,
        user: "HR Agent",
        text: "Sorry, there was an error processing your request.",
        timestamp: "Just now",
        align: "left",
      };
      setMessages((prevMessages) => [...prevMessages, errorMessage]);
    } finally {
      setIsProcessing(false); // Hide processing indicator
    }
  };

  const handleSpeechToText = async () => {
    console.log("handleSpeechToText triggered");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("Microphone access granted");
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.onstart = () => {
        console.log("Recording started...");
        setIsListening(true); // Show listening indicator
      };

      mediaRecorder.ondataavailable = (event) => {
        console.log("Audio data available:", event.data);
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        console.log("Recording stopped.");
        setIsListening(false); // Hide listening indicator

        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        console.log("Audio blob created:", audioBlob);
        const formData = new FormData();
        formData.append("file", audioBlob);

        try {
          setIsProcessing(true); // Show processing indicator
          console.log("Sending audio to backend...");
          const res = await fetch("http://localhost:8000/speech-to-text", {
            method: "POST",
            body: formData,
          });

          if (!res.ok) {
            throw new Error("Failed to process speech-to-text.");
          }

          const data = await res.json();
          console.log("Received transcription from backend:", data);
          setInput(data.text || "");

          const userMessage = {
            id: messages.length + 1,
            user: "User",
            text: data.text || "",
            timestamp: "Just now",
            align: "right",
          };

          setMessages([...messages, userMessage]);
        } catch (error) {
          console.error("Error in handleSpeechToText:", error);
        } finally {
          setIsProcessing(false); // Hide processing indicator
        }
      };

      mediaRecorder.start();

      setTimeout(() => {
        mediaRecorder.stop();
      }, 5000); // Stop recording after 5 seconds
    } catch (error) {
      console.error("Error accessing microphone:", error);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-lg mx-auto bg-white shadow-md rounded-lg overflow-hidden">
      {/* Header */}
      <header className="bg-gray-100 border-b border-gray-300 p-4 flex items-center gap-4">
        <img
          src="/company-logo.png" // Replace with the actual path to your logo
          alt="Company Logo"
          className="w-10 h-10"
        />
        <h2 className="text-lg font-bold text-gray-800">HR Chat</h2>
      </header>

      {/* Chat Area */}
      <div className="flex flex-col gap-4 p-4 overflow-y-auto max-h-[400px]">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.align === "right" ? "justify-end" : "justify-start"}`}
          >
            <div className="flex items-start gap-2">
              {message.align === "left" && (
                <img
                  src="/hr-agent-avatar.png" // Replace with actual avatar path
                  alt={`${message.user} avatar`}
                  className="w-10 h-10 rounded-full"
                />
              )}
              <div
                className={`p-3 rounded-lg ${
                  message.align === "right" ? "bg-blue-500 text-white" : "bg-gray-300 text-black"
                }`}
              >
                <p className="text-sm">{message.text}</p>
                <span className="text-xs text-gray-600">{message.timestamp}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input Field */}
      <div className="flex items-center p-4 border-t border-gray-300 bg-gray-200">
        {isListening && (
          <p className="text-red-500 text-sm mr-4">Recording...</p>
        )}
        <input
          type="text"
          className="flex-1 p-2 border rounded-md text-sm bg-white text-black"
          placeholder="+ Add a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          className="ml-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          onClick={handleSend}
        >
          {isProcessing ? "Processing..." : "Send"}
        </button>
        <button
          className={`ml-2 p-2 rounded-full ${isListening ? "bg-green-500" : "bg-gray-300"} hover:bg-gray-400`}
          onClick={handleSpeechToText}
        >
          <img
            src="/mic-icon.png" // Replace with the actual path to your microphone icon
            alt="Mic Icon"
            className="w-5 h-5"
          />
        </button>
      </div>
    </div>
  );
}