#!/bin/bash

# This script installs the required dependencies for the PDF server and starts it

echo "Installing required dependencies..."
npm install express multer pdf-parse

echo "Starting PDF server..."
node test-pdf-server.js
