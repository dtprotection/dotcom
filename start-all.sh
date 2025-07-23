#!/bin/bash

# Start the backend dev server in a new terminal tab/window
cd backend || exit 1
if [ ! -d node_modules ]; then
  echo "Installing backend dependencies..."
  npm install
fi

echo "Starting backend dev server..."
npm run dev &
BACKEND_PID=$!
cd ..

# Start the frontend dev server in a new terminal tab/window
cd frontend || exit 1
if [ ! -d node_modules ]; then
  echo "Installing frontend dependencies..."
  npm install
fi

echo "Starting frontend dev server..."
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for both to exit
wait $BACKEND_PID $FRONTEND_PID 