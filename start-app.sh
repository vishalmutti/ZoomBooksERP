#!/bin/bash

# This script starts both the main application and the PDF server

# Start the PDF server in a new terminal window
echo "Starting PDF server..."
osascript -e 'tell app "Terminal" to do script "cd '$PWD' && ./setup-pdf-server.sh"'

# Wait a moment for the PDF server to start
sleep 2

# Start the main application
echo "Starting main application..."
npm run dev
