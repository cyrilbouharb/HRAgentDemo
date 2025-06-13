#!/bin/bash

# Start the FastAPI backend
echo "Starting FastAPI backend..."
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000 &

# Start the Next.js frontend
echo "Starting Next.js frontend..."
cd ../frontend
npm run dev