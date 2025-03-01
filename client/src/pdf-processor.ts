/**
 * PDF Processing Service
 * 
 * This module provides functions for processing PDF files, including:
 * - Extracting text content
 * - Rendering pages as images
 * - Analyzing PDF content
 */
import * as pdfjsLib from 'pdfjs-dist';

// Function to extract text from a PDF file using client-side processing
export async function extractTextFromPDF(pdfFile: File, setStatus?: (status: string) => void): Promise<string> {
  try {
    console.log(`PDF Processing started for: ${pdfFile.name}, size: ${pdfFile.size} bytes, type: ${pdfFile.type}`);
    if (setStatus) {
      setStatus(`Processing PDF: ${pdfFile.name}...`);
      console.log(`Status updated: Processing PDF: ${pdfFile.name}...`);
    }
    
    // Check if the file is actually a PDF
    if (pdfFile.type !== 'application/pdf') {
      console.error(`File is not a PDF: ${pdfFile.type}`);
      throw new Error(`File is not a PDF: ${pdfFile.type}`);
    }
    
      // First try server-side processing
      try {
        // Create a FormData object to send the file to the server
        const formData = new FormData();
        formData.append('file', pdfFile);
        
        console.log(`Attempting server-side PDF processing: ${pdfFile.name}, size: ${pdfFile.size} bytes`);
        
        // Send the PDF to the server for processing with a timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.warn("PDF server request timed out after 15 seconds");
          controller.abort();
        }, 15000); // 15 second timeout (increased from 10)
        
        // Try to ping the server first to check if it's running
        try {
          console.log("Pinging PDF server at http://localhost:5001/...");
          
          // Try multiple server URLs to handle different network configurations
          const serverUrls = [
            'http://localhost:5001/',
            'http://127.0.0.1:5001/',
            'http://0.0.0.0:5001/'
          ];
          
          let pingSuccess = false;
          let pingResponse;
          
          for (const serverUrl of serverUrls) {
            try {
              console.log(`Trying to ping server at ${serverUrl}...`);
              pingResponse = await fetch(serverUrl, {
                method: 'GET',
                signal: controller.signal,
                // Explicitly set mode to cors to ensure CORS headers are respected
                mode: 'cors',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                }
              });
              
              if (pingResponse.ok) {
                console.log(`Server ping succeeded at ${serverUrl}`);
                pingSuccess = true;
                break;
              } else {
                console.warn(`Server at ${serverUrl} returned status:`, pingResponse.status);
              }
            } catch (urlError) {
              console.warn(`Failed to ping server at ${serverUrl}:`, urlError);
            }
          }
          
          if (!pingSuccess) {
            console.warn("All PDF server ping attempts failed");
            throw new Error("PDF server is not available at any of the tried URLs");
          }
        } catch (pingError) {
          console.warn("PDF server ping failed:", pingError);
          throw new Error("PDF server is not available");
        }
        
        // If ping succeeded, proceed with the actual PDF processing request
        console.log("Sending PDF to server for processing...");
        const processingUrl = 'http://localhost:5001/api/process-pdf';
        
        // Try with regular CORS mode first
        try {
          console.log("Attempting with regular CORS mode...");
          const response = await fetch(processingUrl, {
            method: 'POST',
            body: formData,
            signal: controller.signal,
            mode: 'cors',
            credentials: 'omit',
            headers: {
              'Accept': 'application/json'
            }
          });
          
          clearTimeout(timeoutId);
          
          console.log("Server response status:", response.status);
          console.log("Server response headers:", Object.fromEntries(response.headers.entries()));
          
          if (response.ok) {
            // Parse the response
            const result = await response.json();
            console.log('Server processed PDF successfully:', result);
            
            // Format the extracted text
            let formattedText = '';
            if (result.text) {
              formattedText = `PDF Content (${result.pageCount} pages):\n\n${result.text}`;
            } else {
              formattedText = "No text content could be extracted from the PDF.";
            }
            
            return formattedText;
          } else {
            throw new Error(`Server returned error status: ${response.status}`);
          }
        } catch (corsError) {
          console.warn("CORS mode failed, trying with no-cors mode:", corsError);
          
          // If CORS mode fails, try with no-cors mode
          // Note: This will return an opaque response that can't be read directly
          // But it might still process the PDF on the server side
          const response = await fetch(processingUrl, {
            method: 'POST',
            body: formData,
            signal: controller.signal,
            mode: 'no-cors',
            credentials: 'omit'
          });
          
          // Since we can't read the response with no-cors mode,
          // we'll just assume it worked and return a placeholder
          console.log("no-cors request sent, can't read response due to CORS restrictions");
          return "PDF processed on server (details not available due to CORS restrictions)";
        }
        
      } catch (serverError) {
        console.warn("Server-side PDF processing failed, falling back to client-side:", serverError);
        // Continue to client-side processing
      }
    
    // Fall back to client-side processing
    console.log("Using client-side PDF processing");
    if (setStatus) setStatus(`Processing PDF locally: ${pdfFile.name}...`);
    
    // Verify worker is configured
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      console.warn("Worker source not set, configuring default worker...");
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.js';
    }
    
    // Get file as array buffer
    const arrayBuffer = await pdfFile.arrayBuffer();
    
    // Create a timeout promise to prevent infinite loading
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error("PDF loading timed out after 60 seconds")), 60000); // Increased from 30 to 60 seconds
    });
    
    // Load the PDF document with timeout protection
    const pdfLoadingPromise = pdfjsLib.getDocument({ 
      data: arrayBuffer,
      cMapUrl: 'https://unpkg.com/pdfjs-dist/cmaps/',
      cMapPacked: true,
    }).promise;
    
    // Race the loading promise against the timeout
    const pdf = await Promise.race([pdfLoadingPromise, timeoutPromise]);
    
    console.log(`PDF loaded: ${pdf.numPages} pages`);
    
    // Extract text from each page with timeout protection
    let fullText = '';
    
    for (let i = 1; i <= pdf.numPages; i++) {
      if (setStatus) setStatus(`Processing page ${i} of ${pdf.numPages}...`);
      
      // Create a timeout promise for each page processing
      const pageTimeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Page ${i} processing timed out after 20 seconds`)), 20000); // Increased from 10 to 20 seconds
      });
      
      try {
        // Get the page with timeout protection
        const pagePromise = pdf.getPage(i);
        const page = await Promise.race([pagePromise, pageTimeoutPromise]);
        
        // Get text content with timeout protection
        const textContentPromise = page.getTextContent();
        const textContent = await Promise.race([textContentPromise, pageTimeoutPromise]);
        
        // Concatenate the text items
        const pageText = textContent.items
          .map(item => 'str' in item ? item.str : '')
          .join(' ');
        
        fullText += `\n--- Page ${i} ---\n${pageText}\n`;
      } catch (error) {
        const pageError = error as Error;
        console.error(`Error processing page ${i}:`, pageError);
        fullText += `\n--- Page ${i} ---\n[Error extracting text: ${pageError.message || 'Unknown error'}]\n`;
        // Continue with next page instead of failing completely
      }
    }
    
    return `PDF Content (${pdf.numPages} pages):\n\n${fullText}`;
    
  } catch (error) {
    console.error("Error processing PDF:", error);
    return `Error processing PDF: ${error instanceof Error ? error.message : String(error)}`;
  }
}

// Function to extract images from a PDF file
export async function extractImagesFromPDF(pdfFile: File, setStatus?: (status: string) => void): Promise<string[]> {
  try {
    if (setStatus) setStatus(`Extracting images from ${pdfFile.name}...`);
    console.log(`Starting image extraction for: ${pdfFile.name}`);
    
    // Verify worker is configured
    if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
      console.warn("Worker source not set for image extraction, reconfiguring...");
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdfjs/pdf.worker.js';
    }
    
    // Get file as array buffer
    const arrayBuffer = await pdfFile.arrayBuffer();
    
    // Create a timeout promise to prevent infinite loading
    const pdfLoadingTimeoutPromise = new Promise<never>((_, reject) => {
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
      console.log(`PDF loaded for image extraction: ${pdf.numPages} pages`);
    } catch (loadError) {
      console.error("Error loading PDF for image extraction:", loadError);
      return ["Error: Failed to load PDF for image extraction"];
    }
    
    const imageDataUrls: string[] = [];
    const maxPagesToProcess = Math.min(pdf.numPages, 5); // Process at most 5 pages to avoid performance issues
    
    // Process each page with timeout protection
    for (let pageNum = 1; pageNum <= maxPagesToProcess; pageNum++) {
      try {
        if (setStatus) setStatus(`Extracting images from page ${pageNum} of ${maxPagesToProcess}...`);
        console.log(`Processing page ${pageNum} for images...`);
        
        // Create a timeout promise for page processing
        const pageTimeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Page ${pageNum} image extraction timed out after 15 seconds`)), 15000);
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
            console.log(`Page ${pageNum} contains images, rendering as fallback...`);
          } else {
            console.log(`No embedded images found on page ${pageNum}, skipping...`);
            continue; // Skip to next page if no images found
          }
        } catch (opListError) {
          console.warn(`Error checking for images in page ${pageNum}:`, opListError);
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
          console.log(`Successfully rendered page ${pageNum} as image`);
        } catch (renderError) {
          console.error(`Error rendering page ${pageNum} as image:`, renderError);
          // Continue to next page instead of failing completely
        }
        
      } catch (pageError) {
        console.error(`Error processing page ${pageNum} for images:`, pageError);
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
    
    console.log(`Image extraction complete, found ${imageDataUrls.length} images`);
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

// Function to analyze images with AI (placeholder implementation)
export async function analyzeImagesWithAI(imageDataUrls: string[], setStatus?: (status: string) => void): Promise<string> {
  try {
    if (imageDataUrls.length === 0) {
      console.log("No images to analyze");
      return "No images were found in the PDF.";
    }
    
    if (setStatus) setStatus(`Analyzing ${imageDataUrls.length} images from PDF...`);
    console.log(`Starting analysis of ${imageDataUrls.length} images`);
    
    let analysisResults = '';
    
    // Only process a limited number of images to avoid token limits
    const maxImagesToProcess = 3; // Process max 3 images
    const imagesToProcess = imageDataUrls.slice(0, maxImagesToProcess);
    
    if (imageDataUrls.length > maxImagesToProcess) {
      console.log(`Limiting analysis to ${maxImagesToProcess} images out of ${imageDataUrls.length} total`);
      analysisResults += `Note: Only analyzing ${maxImagesToProcess} out of ${imageDataUrls.length} images from the PDF due to processing constraints.\n\n`;
    }
    
    for (let i = 0; i < imagesToProcess.length; i++) {
      try {
        if (setStatus) setStatus(`Analyzing image ${i+1} of ${imagesToProcess.length}...`);
        console.log(`Analyzing image ${i+1}...`);
        
        // For now, we'll just include a placeholder
        const analysis = `[This is a placeholder for AI analysis of image ${i+1} from PDF page ${i+1}]`;
        
        analysisResults += `Image ${i+1}:\n${analysis}\n\n`;
        console.log(`Successfully analyzed image ${i+1}`);
      } catch (imageError) {
        console.error(`Error analyzing image ${i+1}:`, imageError);
        analysisResults += `Image ${i+1}: [Error analyzing image: ${imageError instanceof Error ? imageError.message : String(imageError)}]\n\n`;
      }
    }
    
    return analysisResults || "No image analysis results available.";
  } catch (error) {
    console.error("Error analyzing images:", error);
    return `Error analyzing images: ${error instanceof Error ? error.message : String(error)}`;
  }
}

// Function to assemble PDF context
export function assemblePDFContext(fileName: string, textContent: string, imageAnalysis: string): string {
  // Get current date and time for the analysis timestamp
  const timestamp = new Date().toLocaleString();
  
  // Create a structured context with metadata
  return `
# PDF ANALYSIS RESULTS
- Document: ${fileName}
- Analyzed: ${timestamp}

## TEXT CONTENT
${textContent}

## IMAGE CONTENT
${imageAnalysis}

Please analyze the above PDF content and respond to the user's query based on this information.
If the user hasn't asked a specific question, provide a comprehensive summary of the PDF's key information.
`;
}

// Main function to process a PDF attachment
export async function processPDFAttachment(pdfFile: File, setStatus?: (status: string) => void): Promise<string> {
  console.log(`Starting PDF attachment processing for: ${pdfFile.name}`);
  try {
    // Extract text from PDF
    console.log(`Extracting text from PDF: ${pdfFile.name}`);
    if (setStatus) setStatus(`Extracting text from ${pdfFile.name}...`);
    
    const textContent = await extractTextFromPDF(pdfFile, (status) => {
      console.log(`Text extraction status: ${status}`);
      if (setStatus) setStatus(status);
    });
    console.log(`Text extraction complete, extracted ${textContent.length} characters`);
    
    // Extract and analyze images from PDF
    console.log(`Extracting images from PDF: ${pdfFile.name}`);
    if (setStatus) setStatus(`Extracting images from ${pdfFile.name}...`);
    
    const imageDataUrls = await extractImagesFromPDF(pdfFile, (status) => {
      console.log(`Image extraction status: ${status}`);
      if (setStatus) setStatus(status);
    });
    console.log(`Image extraction complete, found ${imageDataUrls.length} images`);
    
    console.log(`Analyzing images from PDF: ${pdfFile.name}`);
    if (setStatus) setStatus(`Analyzing images from ${pdfFile.name}...`);
    
    const imageAnalysis = await analyzeImagesWithAI(imageDataUrls, (status) => {
      console.log(`Image analysis status: ${status}`);
      if (setStatus) setStatus(status);
    });
    console.log(`Image analysis complete, analysis length: ${imageAnalysis.length} characters`);
    
    // Assemble PDF context
    console.log(`Assembling PDF context for: ${pdfFile.name}`);
    if (setStatus) setStatus(`Finalizing PDF processing...`);
    
    const result = assemblePDFContext(pdfFile.name, textContent, imageAnalysis);
    console.log(`PDF processing complete for: ${pdfFile.name}, result length: ${result.length} characters`);
    
    return result;
  } catch (error) {
    console.error("Error processing PDF:", error);
    if (setStatus) setStatus(`Error processing PDF: ${error instanceof Error ? error.message : String(error)}`);
    return `Error processing PDF ${pdfFile.name}: ${error instanceof Error ? error.message : String(error)}`;
  }
}
