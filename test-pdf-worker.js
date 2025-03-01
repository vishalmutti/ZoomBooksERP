// Test script for PDF.js worker
const fs = require('fs');
const path = require('path');
const http = require('http');
const open = require('open');

// Create a simple HTML file to test PDF.js worker
const createTestHtml = () => {
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PDF.js Worker Test</title>
  <script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.js"></script>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      border: 1px solid #ccc;
      padding: 20px;
      border-radius: 5px;
      margin-bottom: 20px;
    }
    .log-container {
      background-color: #f5f5f5;
      padding: 10px;
      border-radius: 5px;
      max-height: 300px;
      overflow-y: auto;
      font-family: monospace;
      white-space: pre-wrap;
    }
    .success { color: green; }
    .error { color: red; }
    .warning { color: orange; }
    button {
      padding: 10px 15px;
      background-color: #4CAF50;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      margin-right: 10px;
    }
    button:hover { background-color: #45a049; }
    button:disabled { background-color: #cccccc; cursor: not-allowed; }
  </style>
</head>
<body>
  <h1>PDF.js Worker Test</h1>
  
  <div class="container">
    <h2>Worker Configuration</h2>
    <div id="workerConfig">Checking worker configuration...</div>
    <button id="testWorker">Test Worker</button>
  </div>
  
  <div class="container">
    <h2>PDF Processing Test</h2>
    <input type="file" id="pdfFile" accept=".pdf" />
    <button id="processPdf" disabled>Process PDF</button>
    <div id="processingStatus">Select a PDF file</div>
  </div>
  
  <div class="container">
    <h2>Log</h2>
    <button id="clearLog">Clear Log</button>
    <div id="logContainer" class="log-container"></div>
  </div>
  
  <script>
    // Log function
    function log(message, type = 'info') {
      const logContainer = document.getElementById('logContainer');
      const timestamp = new Date().toLocaleTimeString();
      const logEntry = document.createElement('div');
      logEntry.className = type;
      logEntry.textContent = \`[\${timestamp}] \${message}\`;
      logContainer.appendChild(logEntry);
      logContainer.scrollTop = logContainer.scrollHeight;
    }
    
    // Clear log
    document.getElementById('clearLog').addEventListener('click', () => {
      document.getElementById('logContainer').innerHTML = '';
      log('Log cleared');
    });
    
    // Set up PDF.js worker
    function setupPdfWorker() {
      try {
        log("Setting up PDF.js worker...");
        const pdfJsVersion = pdfjsLib.version;
        log("PDF.js version: " + pdfJsVersion);
        
        // Define worker paths with multiple fallbacks
        const workerPaths = [
          // Local path (if available)
          \`/pdfjs/pdf.worker.js\`,
          // CDN paths
          \`https://cdn.jsdelivr.net/npm/pdfjs-dist@\${pdfJsVersion}/build/pdf.worker.min.js\`,
          \`https://unpkg.com/pdfjs-dist@\${pdfJsVersion}/build/pdf.worker.min.js\`,
          // Specific version fallback
          \`https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.js\`,
          // Generic fallback
          \`https://mozilla.github.io/pdf.js/build/pdf.worker.js\`
        ];
        
        // Check if worker is already set
        if (pdfjsLib.GlobalWorkerOptions.workerSrc) {
          log("Worker already configured: " + pdfjsLib.GlobalWorkerOptions.workerSrc);
          return;
        }
        
        // Use the first path in the list
        const workerPath = workerPaths[0];
        log("Setting worker source to: " + workerPath);
        
        // IMPORTANT: This must be set BEFORE any PDF operations
        pdfjsLib.GlobalWorkerOptions.workerSrc = workerPath;
        
        // Verify the worker source is set
        log("Worker source is now: " + pdfjsLib.GlobalWorkerOptions.workerSrc);
        
        // Update worker config display
        document.getElementById('workerConfig').textContent = 
          "Worker configured: " + pdfjsLib.GlobalWorkerOptions.workerSrc;
        
        // Test if the worker is accessible
        fetch(workerPath)
          .then(response => {
            if (!response.ok) {
              throw new Error(\`Worker not accessible at \${workerPath}: \${response.status}\`);
            }
            log("Worker file is accessible", "success");
          })
          .catch(error => {
            log("Worker file not accessible, trying fallbacks: " + error.message, "error");
            // Try the next worker path in the list
            for (let i = 1; i < workerPaths.length; i++) {
              log(\`Trying fallback worker path \${i}: \${workerPaths[i]}\`);
              pdfjsLib.GlobalWorkerOptions.workerSrc = workerPaths[i];
              
              // Update worker config display
              document.getElementById('workerConfig').textContent = 
                "Worker configured: " + pdfjsLib.GlobalWorkerOptions.workerSrc;
              
              break; // Just try the next one, the fetch test would be async anyway
            }
          });
      } catch (error) {
        log("Error setting up PDF.js worker: " + error.message, "error");
        // Use a reliable CDN as last resort
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://mozilla.github.io/pdf.js/build/pdf.worker.js';
        log("Using fallback worker source: " + pdfjsLib.GlobalWorkerOptions.workerSrc);
        
        // Update worker config display
        document.getElementById('workerConfig').textContent = 
          "Worker configured (fallback): " + pdfjsLib.GlobalWorkerOptions.workerSrc;
      }
    }
    
    // Initialize the PDF worker
    setupPdfWorker();
    
    // Test worker button
    document.getElementById('testWorker').addEventListener('click', async () => {
      log("Testing PDF.js worker...");
      
      try {
        // Create a minimal valid PDF as a Uint8Array
        const pdfString = '%PDF-1.7\\n1 0 obj\\n<< /Type /Catalog /Pages 2 0 R >>\\nendobj\\n2 0 obj\\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\\nendobj\\n3 0 obj\\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 100 100] /Contents 4 0 R >>\\nendobj\\n4 0 obj\\n<< /Length 8 >>\\nstream\\nBT\\n/F1 12 Tf\\nET\\nendstream\\nendobj\\nxref\\n0 5\\n0000000000 65535 f\\n0000000010 00000 n\\n0000000059 00000 n\\n0000000118 00000 n\\n0000000217 00000 n\\ntrailer\\n<< /Size 5 /Root 1 0 R >>\\nstartxref\\n275\\n%%EOF';
        
        // Convert string to Uint8Array
        const encoder = new TextEncoder();
        const testPdf = encoder.encode(pdfString);
        
        log("Created test PDF data, attempting to load with PDF.js...");
        
        const loadingTask = pdfjsLib.getDocument({ data: testPdf });
        const pdf = await loadingTask.promise;
        
        log("PDF.js worker test successful, loaded PDF with " + pdf.numPages + " pages", "success");
        
        // Get the first page
        const page = await pdf.getPage(1);
        log("Successfully retrieved page 1", "success");
        
        // Get page text content
        const textContent = await page.getTextContent();
        log("Successfully retrieved text content", "success");
        log("Text items: " + textContent.items.length);
        
        document.getElementById('workerConfig').innerHTML = 
          "<span style='color:green'>✓ Worker is functioning correctly</span>";
      } catch (error) {
        log("PDF.js worker test failed: " + error.message, "error");
        document.getElementById('workerConfig').innerHTML = 
          "<span style='color:red'>✗ Worker test failed: " + error.message + "</span>";
      }
    });
    
    // Enable PDF processing button when file is selected
    document.getElementById('pdfFile').addEventListener('change', (event) => {
      const fileInput = event.target;
      const processButton = document.getElementById('processPdf');
      const statusDiv = document.getElementById('processingStatus');
      
      if (fileInput.files && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        if (file.type === 'application/pdf') {
          processButton.disabled = false;
          statusDiv.textContent = \`Selected: \${file.name} (\${Math.round(file.size / 1024)} KB)\`;
          log(\`PDF file selected: \${file.name} (\${Math.round(file.size / 1024)} KB)\`);
        } else {
          processButton.disabled = true;
          statusDiv.textContent = 'Please select a PDF file';
          log('Selected file is not a PDF', 'error');
        }
      } else {
        processButton.disabled = true;
        statusDiv.textContent = 'Select a PDF file';
      }
    });
    
    // Process PDF
    document.getElementById('processPdf').addEventListener('click', async () => {
      const fileInput = document.getElementById('pdfFile');
      const statusDiv = document.getElementById('processingStatus');
      
      if (!fileInput.files || fileInput.files.length === 0) {
        statusDiv.textContent = 'Please select a PDF file';
        return;
      }
      
      const pdfFile = fileInput.files[0];
      statusDiv.textContent = \`Processing \${pdfFile.name}...\`;
      log(\`Starting to process PDF: \${pdfFile.name}\`);
      
      try {
        // Read the file
        const arrayBuffer = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsArrayBuffer(pdfFile);
        });
        
        log(\`File read as ArrayBuffer, size: \${arrayBuffer.byteLength} bytes\`);
        
        // Load the PDF
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        log(\`PDF loaded successfully: \${pdf.numPages} pages\`, "success");
        
        // Extract text from the first page
        const page = await pdf.getPage(1);
        log(\`Retrieved page 1\`);
        
        const textContent = await page.getTextContent();
        log(\`Retrieved text content from page 1\`);
        
        // Display text content
        let text = "";
        for (const item of textContent.items) {
          if ('str' in item) {
            text += item.str + " ";
          }
        }
        
        log(\`Extracted text from page 1: \${text.substring(0, 100)}...\`);
        
        statusDiv.textContent = \`✓ Processed \${pdfFile.name} (\${pdf.numPages} pages)\`;
        statusDiv.style.color = 'green';
      } catch (error) {
        log(\`Error processing PDF: \${error.message}\`, "error");
        statusDiv.textContent = \`✗ Error: \${error.message}\`;
        statusDiv.style.color = 'red';
      }
    });
    
    // Initial log
    log('PDF.js Worker Test page loaded');
  </script>
</body>
</html>
  `;
  
  fs.writeFileSync('test-pdf-worker.html', html);
  return path.resolve('test-pdf-worker.html');
}

// Create a simple HTTP server to serve the test HTML
const startServer = (htmlPath) => {
  const server = http.createServer((req, res) => {
    if (req.url === '/') {
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(fs.readFileSync(htmlPath));
    } else if (req.url === '/pdfjs/pdf.worker.js') {
      // Try to serve the PDF.js worker from node_modules
      try {
        const workerPath = require.resolve('pdfjs-dist/build/pdf.worker.js');
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(fs.readFileSync(workerPath));
      } catch (error) {
        console.error('Error serving PDF.js worker:', error);
        res.writeHead(404);
        res.end('PDF.js worker not found');
      }
    } else {
      res.writeHead(404);
      res.end('Not found');
    }
  });
  
  const port = 3000;
  server.listen(port, () => {
    console.log(`Test server running at http://localhost:${port}`);
    console.log('Opening browser...');
    open(`http://localhost:${port}`);
  });
  
  return server;
}

// Main function
const main = async () => {
  try {
    console.log('Creating test HTML file...');
    const htmlPath = createTestHtml();
    console.log(`Test HTML file created at: ${htmlPath}`);
    
    console.log('Starting test server...');
    const server = startServer(htmlPath);
    
    console.log('Press Ctrl+C to stop the server');
    
    // Handle Ctrl+C
    process.on('SIGINT', () => {
      console.log('Stopping server...');
      server.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
};

main();
