// Test script for PDF processing server
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testPDFServer() {
  try {
    console.log('Testing PDF processing server...');
    
    // Test if server is running
    try {
      console.log('Pinging server at http://localhost:5001/...');
      const pingResponse = await fetch('http://localhost:5001/', {
        method: 'GET',
      });
      
      console.log(`Server ping response: ${pingResponse.status} ${pingResponse.statusText}`);
    } catch (error) {
      console.error('Server ping failed:', error.message);
      console.log('Make sure the PDF processing server is running on port 5001');
      return;
    }
    
    // Find a PDF file to test with
    const uploadsDir = path.join(__dirname, 'uploads');
    console.log(`Looking for PDF files in ${uploadsDir}...`);
    
    if (!fs.existsSync(uploadsDir)) {
      console.error(`Uploads directory does not exist: ${uploadsDir}`);
      return;
    }
    
    const files = fs.readdirSync(uploadsDir);
    console.log(`Found ${files.length} files in uploads directory`);
    
    const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
    console.log(`Found ${pdfFiles.length} PDF files`);
    
    if (pdfFiles.length === 0) {
      console.error('No PDF files found in uploads directory');
      return;
    }
    
    const testFile = pdfFiles[0];
    console.log(`Testing with PDF file: ${testFile}`);
    
    const filePath = path.join(uploadsDir, testFile);
    console.log(`Full file path: ${filePath}`);
    console.log(`File exists: ${fs.existsSync(filePath)}`);
    
    // Create form data with the PDF file
    const formData = new FormData();
    formData.append('file', fs.createReadStream(filePath));
    
    // Send the request
    console.log('Sending PDF to server for processing...');
    const response = await fetch('http://localhost:5001/api/process-pdf', {
      method: 'POST',
      body: formData,
    });
    
    console.log(`Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      console.error('Server returned an error');
      const text = await response.text();
      console.log('Response text:', text);
      return;
    }
    
    try {
      console.log('Parsing response as JSON...');
      const result = await response.json();
      console.log('Successfully parsed JSON response');
      console.log('Page count:', result.pageCount);
      console.log('Text excerpt (first 200 chars):', result.text?.substring(0, 200) || 'No text extracted');
    } catch (error) {
      console.error('Failed to parse JSON response:', error.message);
      const text = await response.text();
      console.log('Raw response text:', text.substring(0, 500) + '...');
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testPDFServer();
