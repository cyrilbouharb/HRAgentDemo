"use client";

import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function Chat() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    { id: 1, user: "HR Agent", text: "Welcome! How can I assist you today?", timestamp: "Just now", align: "left" },
  ]);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef(null); // Ref to store the MediaRecorder instance
  const audioChunksRef = useRef([]); // Ref to store audio chunks

  const sendMessageToAgent = async (messageText) => {
    const userMessage = {
      id: messages.length + 1,
      user: "User",
      text: messageText,
      timestamp: "Just now",
      align: "right",
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      setIsProcessing(true);
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: messageText }),
      });

      const data = await res.json();
      const agentMessage = {
        id: messages.length + 2,
        user: "HR Agent",
        text: data.assistant || "I'm here to help!",
        timestamp: "Just now",
        align: "left",
      };

      setMessages((prev) => [...prev, agentMessage]);
    } catch (error) {
      console.error("Error sending message to agent:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    const messageText = input.trim();
    setInput("");
    await sendMessageToAgent(messageText);
  };

  const handleSpeechToText = async () => {
    if (isListening) {
      mediaRecorderRef.current?.stop();
      setIsListening(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.onstart = () => {
        setIsListening(true);
      };

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        setIsListening(false);
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (audioBlob.size === 0) return;

        const arrayBuffer = await audioBlob.arrayBuffer();
        const audioContext = new (window.AudioContext || window.webkitAudioContext)({ sampleRate: 16000 });
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        const pcmData = audioBuffer.getChannelData(0);
        const wavBlob = encodeWAV(pcmData);

        const formData = new FormData();
        formData.append("file", new File([wavBlob], "audio.wav", { type: "audio/wav" }));

        try {
          setIsProcessing(true);
          const res = await fetch("http://localhost:8000/speech-to-text", { method: "POST", body: formData });
          const data = await res.json();
          if (res.ok) await sendMessageToAgent(data.text || "");
        } catch (error) {
          console.error("Error in speech-to-text:", error);
        } finally {
          setIsProcessing(false);
        }
      };

      mediaRecorder.start();
    } catch (error) {
      console.error("Microphone access error:", error);
    }
  };

  const encodeWAV = (samples) => {
    const sampleRate = 16000;
    const numChannels = 1;
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const writeString = (view, offset, string) => {
      for (let i = 0; i < string.length; i++) view.setUint8(offset + i, string.charCodeAt(i));
    };

    writeString(view, 0, "RIFF");
    view.setUint32(4, 36 + samples.length * 2, true);
    writeString(view, 8, "WAVE");
    writeString(view, 12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numChannels * 2, true);
    view.setUint16(32, numChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(view, 36, "data");
    view.setUint32(40, samples.length * 2, true);

    let offset = 44;
    for (let i = 0; i < samples.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, samples[i]));
      view.setInt16(offset, s * 0x7fff, true);
    }

    return new Blob([view], { type: "audio/wav" });
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white shadow-lg rounded-lg overflow-hidden">
      {/* Header */}
      <header className="bg-gradient-to-r from-green-500 to-blue-500 text-white p-6 flex items-center gap-4">
        <img src="/company-logo.png" alt="Company Logo" className="w-12 h-12 rounded-full" />
        <h2 className="text-xl font-bold">HR Chat</h2>
      </header>

      {/* Chat Area */}
      <div className="flex flex-col gap-4 p-6 overflow-y-auto max-h-[500px] bg-gray-800">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.align === "right" ? "justify-end" : "justify-start"}`}>
            <div className="flex items-start gap-2">
              {msg.align === "left" && <img src="/hr-agent-avatar.png" alt="Avatar" className="w-10 h-10 rounded-full" />}
              <div className={`p-4 rounded-lg ${msg.align === "right" ? "bg-blue-500 text-white" : "bg-gray-700 text-gray-200"}`}>
                {msg.user === "HR Agent" ? (
                  <div className="text-sm whitespace-pre-wrap">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                )}
                <span className="text-xs text-gray-400 block mt-2">{msg.timestamp}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input Field */}
      <div className="flex items-center p-6 border-t border-gray-700 bg-gray-900">
        {isListening && <p className="text-red-500 text-sm mr-4">Recording...</p>}
        <input
          type="text"
          className="flex-1 p-3 border rounded-md text-sm bg-gray-700 text-white placeholder-gray-400"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button
          className="ml-4 px-6 py-3 bg-green-500 text-white rounded-md hover:bg-green-600"
          onClick={handleSend}
        >
          {isProcessing ? "Processing..." : "Send"}
        </button>
        <button
          className={`ml-4 p-3 rounded-full ${isListening ? "bg-red-500" : "bg-gray-700"} hover:bg-gray-600`}
          onClick={handleSpeechToText}
        >
          <img src="/mic-icon.png" alt="Mic Icon" className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
