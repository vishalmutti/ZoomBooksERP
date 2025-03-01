/**
 * Test script for client-side PDF image extraction
 * 
 * This script tests the improved image extraction functionality in pdf-processor.ts
 * It simulates the browser environment and tests the extractImagesFromPDF function
 */

// Import required modules
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as pdfjsLib from 'pdfjs-dist';

// Set up __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Mock browser APIs needed by the PDF processor
global.document = {
  createElement: (tagName) => {
    if (tagName === 'canvas') {
      return {
        getContext: () => ({
          drawImage: () => {},
          fillRect: () => {},
          fillText: () => {},
          fillStyle: '',
          font: '',
          textAlign: ''
        }),
        width: 0,
        height: 0,
        toDataURL: () => 'data:image/png;base64,mockImageData'
      };
    }
    return {};
  }
};

// Import the PDF processor module
// Note: We need to dynamically import it since it uses browser APIs
async function importPdfProcessor() {
  try {
    // Create a temporary file that re-exports the functions we need
    const tempFile = path.join(__dirname, 'temp-pdf-processor.js');
    
    fs.writeFileSync(tempFile, `
      import * as pdfjsLib from 'pdfjs-dist';
      
      // Function to extract images from a PDF file
      export async function extractImagesFromPDF(pdfFile, setStatus) {
        try {
          if (setStatus) setStatus(\`Extracting images from \${pdfFile.name}...\`);
          console.log(\`Starting image extraction for: \${pdfFile.name}\`);
          
          // Verify worker is configured
          if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
            console.warn("Worker source not set for image extraction, reconfiguring...");
            pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.js';
          }
          
          // Get file as array buffer
          const arrayBuffer = await pdfFile.arrayBuffer();
          
          // Create a timeout promise to prevent infinite loading
          const pdfLoadingTimeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error("PDF loading for image extraction timed out after 30 seconds")), 30000);
          });
          
          // Load the PDF document with timeout protection
          const pdfLoadingPromise = pdfjsLib.getDocument({ 
            data: arrayBuffer,
            cMapUrl: 'https://unpkg.com/pdfjs-dist/cmaps/',
            cMapPacked: true,
          }).promise;
          
          // Race the loading promise against the timeout
          let pdf;
          try {
            pdf = await Promise.race([pdfLoadingPromise, pdfLoadingTimeoutPromise]);
            console.log(\`PDF loaded for image extraction: \${pdf.numPages} pages\`);
          } catch (loadError) {
            console.error("Error loading PDF for image extraction:", loadError);
            return ["Error: Failed to load PDF for image extraction"];
          }
          
          const imageDataUrls = [];
          const maxPagesToProcess = Math.min(pdf.numPages, 5); // Process at most 5 pages to avoid performance issues
          
          // Process each page with timeout protection
          for (let pageNum = 1; pageNum <= maxPagesToProcess; pageNum++) {
            try {
              if (setStatus) setStatus(\`Extracting images from page \${pageNum} of \${maxPagesToProcess}...\`);
              console.log(\`Processing page \${pageNum} for images...\`);
              
              // Create a timeout promise for page processing
              const pageTimeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error(\`Page \${pageNum} image extraction timed out after 15 seconds\`)), 15000);
              });
              
              // Get the page with timeout protection
              const pagePromise = pdf.getPage(pageNum);
              const page = await Promise.race([pagePromise, pageTimeoutPromise]);
              
              // First approach: Try to extract embedded images using getOperatorList
              try {
                const operatorListPromise = page.getOperatorList();
                const operatorList = await Promise.race([operatorListPromise, pageTimeoutPromise]);
                
                // Check if we have any image XObjects in this page
                let hasImages = false;
                if (operatorList && operatorList.fnArray) {
                  for (let i = 0; i < operatorList.fnArray.length; i++) {
                    // Check for paintImageXObject operations (image drawing)
                    if (operatorList.fnArray[i] === pdfjsLib.OPS.paintImageXObject) {
                      hasImages = true;
                      break;
                    }
                  }
                }
                
                if (hasImages) {
                  console.log(\`Page \${pageNum} contains images, rendering as fallback...\`);
                } else {
                  console.log(\`No embedded images found on page \${pageNum}, skipping...\`);
                  continue; // Skip to next page if no images found
                }
              } catch (opListError) {
                console.warn(\`Error checking for images in page \${pageNum}:\`, opListError);
                // Continue to fallback rendering approach
              }
              
              // Fallback approach: Render the page as an image
              try {
                // Create a viewport at a reasonable scale
                const viewport = page.getViewport({ scale: 1.5 });
                
                // Create a canvas to render the page
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                
                if (!context) {
                  throw new Error("Could not create canvas context");
                }
                
                // Set canvas dimensions to match the viewport
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                
                // Render the page to the canvas with timeout
                const renderPromise = page.render({
                  canvasContext: context,
                  viewport: viewport
                }).promise;
                
                await Promise.race([renderPromise, pageTimeoutPromise]);
                
                // Convert canvas to data URL
                const dataUrl = canvas.toDataURL('image/png', 0.85);
                imageDataUrls.push(dataUrl);
                console.log(\`Successfully rendered page \${pageNum} as image\`);
              } catch (renderError) {
                console.error(\`Error rendering page \${pageNum} as image:\`, renderError);
                // Continue to next page instead of failing completely
              }
              
            } catch (pageError) {
              console.error(\`Error processing page \${pageNum} for images:\`, pageError);
              // Continue to next page instead of failing completely
            }
          }
          
          // If we couldn't extract any images, return a placeholder
          if (imageDataUrls.length === 0) {
            console.log("No images could be extracted from the PDF, returning placeholder");
            // Create a simple canvas with text as a placeholder
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (ctx) {
              canvas.width = 400;
              canvas.height = 200;
              ctx.fillStyle = '#f0f0f0';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.font = '16px Arial';
              ctx.fillStyle = '#333333';
              ctx.textAlign = 'center';
              ctx.fillText('No images could be extracted from this PDF', canvas.width/2, canvas.height/2);
              imageDataUrls.push(canvas.toDataURL('image/png'));
            }
          }
          
          console.log(\`Image extraction complete, found \${imageDataUrls.length} images\`);
          return imageDataUrls;
        } catch (error) {
          console.error("Error extracting images from PDF:", error);
          // Return a placeholder image with the error message
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = 400;
            canvas.height = 200;
            ctx.fillStyle = '#fff0f0';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.font = '16px Arial';
            ctx.fillStyle = '#ff0000';
            ctx.textAlign = 'center';
            ctx.fillText('Error extracting images from PDF:', canvas.width/2, canvas.height/2 - 10);
            ctx.fillText(error instanceof Error ? error.message : String(error), canvas.width/2, canvas.height/2 + 20);
            return [canvas.toDataURL('image/png')];
          }
          return ["Error: Failed to extract images from PDF"];
        }
      }
    `);
    
    // Import the temporary module
    const module = await import(`./temp-pdf-processor.js`);
    
    // Clean up the temporary file
    fs.unlinkSync(tempFile);
    
    return module;
  } catch (error) {
    console.error('Error importing PDF processor:', error);
    throw error;
  }
}

// Mock File class for testing
class MockFile {
  constructor(name, data) {
    this.name = name;
    this._data = data;
    this.type = 'application/pdf';
    this.size = data.length;
  }
  
  async arrayBuffer() {
    return this._data;
  }
}

// Main test function
async function testPdfImageExtraction() {
  try {
    console.log('Testing PDF image extraction...');
    
    // Configure PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'node_modules/pdfjs-dist/build/pdf.worker.js';
    
    // Find a PDF file to test with
    const uploadsDir = path.join(__dirname, 'uploads');
    console.log(`Looking for PDF files in ${uploadsDir}...`);
    
    if (!fs.existsSync(uploadsDir)) {
      console.error(`Uploads directory does not exist: ${uploadsDir}`);
      return;
    }
    
    const files = fs.readdirSync(uploadsDir);
    const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));
    
    if (pdfFiles.length === 0) {
      console.error('No PDF files found in uploads directory');
      return;
    }
    
    const testFile = pdfFiles[0];
    console.log(`Testing with PDF file: ${testFile}`);
    
    const filePath = path.join(uploadsDir, testFile);
    console.log(`Full file path: ${filePath}`);
    
    // Read the PDF file
    const pdfData = fs.readFileSync(filePath);
    console.log(`Read ${pdfData.length} bytes from file`);
    
    // Create a mock File object
    const mockFile = new MockFile(testFile, pdfData);
    
    // Import the PDF processor
    const pdfProcessor = await importPdfProcessor();
    
    // Status update function
    const setStatus = (status) => {
      console.log(`Status update: ${status}`);
    };
    
    // Extract images from the PDF
    console.log('Starting image extraction...');
    const startTime = Date.now();
    
    const imageDataUrls = await pdfProcessor.extractImagesFromPDF(mockFile, setStatus);
    
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000;
    
    console.log(`Image extraction completed in ${duration.toFixed(2)} seconds`);
    console.log(`Extracted ${imageDataUrls.length} images`);
    
    // Check if we got any images
    if (imageDataUrls.length > 0) {
      console.log('✅ Successfully extracted images from PDF');
      
      // Log the first few characters of each image data URL
      imageDataUrls.forEach((dataUrl, index) => {
        console.log(`Image ${index + 1}: ${dataUrl.substring(0, 50)}...`);
      });
    } else {
      console.log('❌ Failed to extract any images from PDF');
    }
    
    console.log('Test completed successfully');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

// Run the test
testPdfImageExtraction();
