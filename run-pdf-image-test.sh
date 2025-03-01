#!/bin/bash

# This script tests the PDF image extraction functionality

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed. Please install Node.js to run this test."
    exit 1
fi

# Check if required packages are installed
if [ ! -d "node_modules/pdfjs-dist" ]; then
    echo "Installing required packages..."
    npm install pdfjs-dist
fi

# Create uploads directory if it doesn't exist
mkdir -p uploads

# Check if there are any PDF files in the uploads directory
if [ -z "$(find uploads -name "*.pdf" -type f -print -quit)" ]; then
    echo "No PDF files found in uploads directory."
    echo "Please place at least one PDF file in the uploads directory to test."
    exit 1
fi

# Run the test script
echo "Running PDF image extraction test..."
node --experimental-modules test-pdf-image-extraction.js
