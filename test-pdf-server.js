import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import pdfParse from 'pdf-parse';
import { fileURLToPath } from 'url';

// Get current file directory (equivalent to __dirname in CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 5001;

// Set up multer for file uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  })
});

// Enable CORS for local development
const allowedOrigins = ['http://0.0.0.0:5001', 'http://localhost:5001', 'http://127.0.0.1:5001'];

// Simplified CORS middleware - allow all origins
app.use((req, res, next) => {
  // Log the request
  console.log(`[CORS] Request from origin: ${req.headers.origin || 'unknown'} to path: ${req.path}`);
  
  // Set CORS headers - allow all origins
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    console.log('[CORS] Handling OPTIONS preflight request');
    return res.status(200).end();
  }
  
  next();
});

// Add a simple health check endpoint with more detailed information
app.get('/', (req, res) => {
  console.log('[Health Check] Received request from:', req.headers.origin);
  res.json({ 
    status: 'PDF processing server is running',
    time: new Date().toISOString(),
    headers: req.headers,
    corsEnabled: true
  });
});

// Serve static files from the client directory
app.use(express.static(path.join(__dirname, 'client')));

// PDF processing endpoint with enhanced logging
app.post('/api/process-pdf', upload.single('file'), async (req, res) => {
  try {
    console.log("[PDF Processing] Request received from:", req.headers.origin);
    console.log("[PDF Processing] Request headers:", req.headers);
    
    // Check if file was uploaded
    if (!req.file) {
      console.log("[PDF Processing] Error: No file uploaded");
      return res.status(400).json({ error: "No PDF file uploaded" });
    }
    
    const pdfFile = req.file;
    console.log(`[PDF Processing] Processing file: ${pdfFile.filename}, size: ${pdfFile.size} bytes`);
    
    // Read the PDF file
    const pdfPath = path.join(uploadDir, pdfFile.filename);
    const dataBuffer = fs.readFileSync(pdfPath);
    
    console.log(`[PDF Processing] Successfully read file from disk, size: ${dataBuffer.length} bytes`);
    
    // Extract text from PDF
    console.log(`[PDF Processing] Starting PDF parsing...`);
    const pdfData = await pdfParse(dataBuffer);
    console.log(`[PDF Processing] PDF parsing complete, extracted ${pdfData.text.length} characters`);
    
    // Return the extracted data
    console.log(`[PDF Processing] Sending successful response with ${pdfData.numpages} pages of content`);
    res.json({
      text: pdfData.text,
      pageCount: pdfData.numpages,
      info: pdfData.info,
      metadata: pdfData.metadata,
      version: pdfData.version
    });
    
  } catch (error) {
    console.error("[PDF Processing] Error:", error);
    res.status(500).json({ 
      error: "Failed to process PDF", 
      details: error instanceof Error ? error.message : "Unknown error" 
    });
  }
});

// Start the server with more detailed logging
app.listen(port, '0.0.0.0', () => {
  console.log(`PDF processing server running at http://0.0.0.0:${port}`);
  console.log(`Server is also accessible at http://localhost:${port}`);
  console.log(`CORS is enabled for origins:`, allowedOrigins);
  console.log(`Upload directory: ${uploadDir}`);
});

// Add error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  // Keep the server running despite the error
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Keep the server running despite the rejection
});
