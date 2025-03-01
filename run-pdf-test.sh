#!/bin/bash

# This script starts the PDF processing server and opens the test HTML page

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js to run this test."
    exit 1
fi

# Check if required packages are installed
if [ ! -d "node_modules/express" ] || [ ! -d "node_modules/multer" ] || [ ! -d "node_modules/pdf-parse" ]; then
    echo "Installing required packages..."
    npm install express multer pdf-parse
fi

# Create uploads directory if it doesn't exist
mkdir -p uploads

# Start the PDF processing server in the background
echo "Starting PDF processing server..."
node test-pdf-server.js > pdf-server-log.txt 2>&1 &
SERVER_PID=$!

# Wait for the server to start
echo "Waiting for server to start..."
sleep 3

# Check if the server is running
if ! curl -s http://localhost:5001/ > /dev/null; then
    echo "Error: Failed to start the PDF processing server. Check pdf-server-log.txt for details."
    kill $SERVER_PID 2>/dev/null
    exit 1
fi

echo "PDF processing server is running (PID: $SERVER_PID)"

# Open the test HTML page
echo "Opening test HTML page..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open test-pdf-cors.html
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open test-pdf-cors.html
elif [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    # Windows
    start test-pdf-cors.html
else
    echo "Could not automatically open the test HTML page."
    echo "Please open test-pdf-cors.html in your browser manually."
fi

echo ""
echo "Test environment is ready!"
echo "1. Use the test page to check if the CORS issue is resolved"
echo "2. Check pdf-server-log.txt for server logs"
echo "3. Press Ctrl+C to stop the server when done"

# Wait for user to press Ctrl+C
trap "echo 'Stopping server...'; kill $SERVER_PID 2>/dev/null; exit 0" INT
while true; do
    sleep 1
done
