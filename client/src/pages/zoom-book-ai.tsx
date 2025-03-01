import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, PlusCircle, Search, Paperclip, Send, Trash, Edit, Bot, FileText, Image } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import { GlobalWorkerOptions } from 'pdfjs-dist';
import { processPDFAttachment } from '@/pdf-processor';

// For debugging
console.log("PDF.js version:", pdfjsLib.version);

// Set up the worker with multiple fallback options and better error handling
const setupPdfWorker = () => {
  try {
    console.log("Setting up PDF.js worker...");
    const pdfJsVersion = pdfjsLib.version;
    console.log("PDF.js version:", pdfJsVersion);
    
    // Define worker paths with multiple fallbacks
    const workerPaths = [
      // Local path (if available)
      `/pdfjs/pdf.worker.js`,
      // CDN paths
      `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfJsVersion}/build/pdf.worker.min.js`,
      `https://unpkg.com/pdfjs-dist@${pdfJsVersion}/build/pdf.worker.min.js`,
      // Specific version fallback
      `https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.js`,
      // Generic fallback
      `https://mozilla.github.io/pdf.js/build/pdf.worker.js`
    ];
    
    // Check if worker is already set
    if (pdfjsLib.GlobalWorkerOptions.workerSrc) {
      console.log("Worker already configured:", pdfjsLib.GlobalWorkerOptions.workerSrc);
      return;
    }
    
    // Function to try loading a worker
    const tryWorkerPath = async (path: string): Promise<boolean> => {
      console.log(`Attempting to use worker at: ${path}`);
      
      try {
        // Set the worker source
        pdfjsLib.GlobalWorkerOptions.workerSrc = path;
        console.log("Worker source set to:", pdfjsLib.GlobalWorkerOptions.workerSrc);
        
        // Test if the worker is accessible
        const response = await fetch(path, { method: 'HEAD' });
        if (!response.ok) {
          console.warn(`Worker not accessible at ${path}: ${response.status}`);
          return false;
        }
        
        console.log(`Worker file is accessible at ${path}`);
        return true;
      } catch (error) {
        console.warn(`Failed to access worker at ${path}:`, error);
        return false;
      }
    };
    
    // Try each worker path in sequence
    (async () => {
      for (const path of workerPaths) {
        const success = await tryWorkerPath(path);
        if (success) {
          console.log(`Successfully configured PDF.js worker with: ${path}`);
          // Create a test PDF document to verify worker is functioning
          try {
            // Create a minimal valid PDF as a Uint8Array
            const pdfString = '%PDF-1.7\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 100 100] /Contents 4 0 R >>\nendobj\n4 0 obj\n<< /Length 8 >>\nstream\nBT\n/F1 12 Tf\nET\nendstream\nendobj\nxref\n0 5\n0000000000 65535 f\n0000000010 00000 n\n0000000059 00000 n\n0000000118 00000 n\n0000000217 00000 n\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n275\n%%EOF';
            
            // Convert string to Uint8Array
            const encoder = new TextEncoder();
            const testPdf = encoder.encode(pdfString);
            
            const loadingTask = pdfjsLib.getDocument({ data: testPdf });
            const pdf = await loadingTask.promise;
            console.log("PDF.js worker test successful, loaded PDF with", pdf.numPages, "pages");
            break;
          } catch (testError) {
            console.warn("PDF.js worker test failed:", testError);
            // Continue to next worker path
          }
        }
      }
    })();
    
    // Add a global error handler for worker loading issues
    window.addEventListener('error', (event: ErrorEvent) => {
      // Check if this is a PDF.js worker loading error
      if ((event.message?.includes('worker') || event.filename?.includes('worker')) && 
          (event.message?.includes('pdf') || event.filename?.includes('pdf'))) {
        console.warn("PDF.js worker loading error:", event.message);
        
        // Try the next worker path in the list
        const currentIndex = workerPaths.indexOf(pdfjsLib.GlobalWorkerOptions.workerSrc);
        if (currentIndex >= 0 && currentIndex < workerPaths.length - 1) {
          const nextPath = workerPaths[currentIndex + 1];
          console.log("Trying next worker path due to error:", nextPath);
          pdfjsLib.GlobalWorkerOptions.workerSrc = nextPath;
        }
      }
    });
  } catch (error) {
    console.error("Error setting up PDF.js worker:", error);
    // Use a reliable CDN as last resort
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://mozilla.github.io/pdf.js/build/pdf.worker.js';
    console.log("Using fallback worker source:", pdfjsLib.GlobalWorkerOptions.workerSrc);
  }
};

// Initialize the PDF worker
console.log("Initializing PDF.js worker...");
setupPdfWorker();

interface Message {
  text: string;
  sender: 'user' | 'bot';
  attachments?: File[];
  pdfContent?: string;
}

const ZoomBookAI = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [chats, setChats] = useState<{ id: string; name: string }[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [processingPDF, setProcessingPDF] = useState(false);
  const [pdfProcessingStatus, setPdfProcessingStatus] = useState('');

  const apiKey = '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';
  const model = 'google/gemini-2.0-flash-001';

  useEffect(() => {
    // Scroll to bottom on message change
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // PDF Processing is now handled by the imported processPDFAttachment function

  const sendMessage = async () => {
    if (!input && attachments.length === 0) return;

    try {
      // Keep input and attachments until API call completes
      let modelToUse = model;
      let updatedInput = input;
      let pdfContext = '';

      // Process PDF attachments if any
      const pdfAttachments = attachments.filter(file => file.type === 'application/pdf');
      if (pdfAttachments.length > 0) {
        setProcessingPDF(true);
        
        for (const pdfFile of pdfAttachments) {
          const pdfContent = await processPDFAttachment(pdfFile, setPdfProcessingStatus);
          pdfContext += pdfContent + "\n\n";
        }
        
        setProcessingPDF(false);
        setPdfProcessingStatus('');
        
        // Add PDF context to input
        if (pdfContext) {
          updatedInput = pdfContext + (input ? `\n\nUser query: ${input}` : "\n\nPlease analyze the PDF content above.");
        }
      }

      if (webSearchEnabled) {
        updatedInput = "Search the web if required for more up to date information. " + updatedInput;
      }

      // Prepare messages array with full chat history including the new message
      const messagesForAPI = [...messages.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      })), {
        role: 'user',
        content: updatedInput
      }];

      let requestBody: any = {
        model: modelToUse,
        messages: messagesForAPI,
        stream: true,
      };

      if (webSearchEnabled) {
        requestBody = {
          model: "openrouter/auto",
          plugins: [
            {
              id: "web",
              max_results: 5,
              search_prompt: "A web search was conducted. Incorporate the following web search results into your response only if they contribute additional knowledge."
            }
          ],
          messages: messagesForAPI,
          stream: true
        };
      }

      // Handle non-PDF attachments
      const nonPdfAttachments = attachments.filter(file => file.type !== 'application/pdf');
      if (nonPdfAttachments.length > 0) {
        let messageContent: any = [];
        
        // Add text content if it exists
        if (updatedInput) {
          messageContent.push({
            type: "text",
            text: updatedInput
          });
        }
        
        // Convert each attachment to base64 and add it to the message content
        for (const attachment of nonPdfAttachments) {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(attachment);
          });
          
          if (attachment.type.startsWith('image/')) {
            // For images, include as image_url
            messageContent.push({
              type: "image_url",
              image_url: {
                url: base64,
                detail: "auto"
              }
            });
          } else {
            // For other files, instruct the model to analyze the file
            messageContent.push({
              type: "text",
              text: `I've attached a file named "${attachment.name}" (${attachment.type}). Please analyze this file and provide a summary or relevant information from it.`
            });
            
            // For OpenRouter API, attempt to use the document parameter
            requestBody.document = {
              type: attachment.type,
              data: base64.split(',')[1], // Remove the data URL prefix
              name: attachment.name
            };
          }
        }
        
        // Update the message content in the request body
        requestBody.messages[0].content = messageContent;
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        console.error("OpenRouter API Error:", response.status, response.statusText);
        try {
          const errorData = await response.json();
          console.error("Error details:", errorData);
        } catch (jsonError) {
          console.error("Failed to parse error JSON:", jsonError);
        }
        const errorReply: Message = { text: 'Error communicating with AI', sender: 'bot' };
        setMessages([...messages, errorReply]);
        return;
      }

      // Add user message immediately
      const userMessage: Message = { 
        text: input, 
        sender: 'user', 
        attachments,
        pdfContent: pdfContext || undefined
      };
      setMessages(prevMessages => [...prevMessages, userMessage]);
      
      let reply = "";
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('Response body is not readable');
      }
      const decoder = new TextDecoder();
      let buffer = '';
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          // Append new chunk to buffer
          buffer += decoder.decode(value, { stream: true });
          // Process complete lines from buffer
          while (true) {
            const lineEnd = buffer.indexOf('\n');
            if (lineEnd === -1) break;
            const line = buffer.slice(0, lineEnd).trim();
            buffer = buffer.slice(lineEnd + 1);
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') break;
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0].delta.content;
                if (content) {
                  reply += content;
                  setMessages(prevMessages => {
                    // Find the last bot message
                    const lastMessage = prevMessages[prevMessages.length - 1];
                    if (lastMessage?.sender === 'bot') {
                      // Update existing bot message
                      return [
                        ...prevMessages.slice(0, -1),
                        { text: reply, sender: 'bot' }
                      ];
                    } else {
                      // Add new bot message
                      return [
                        ...prevMessages,
                        { text: reply, sender: 'bot' }
                      ];
                    }
                  });
                }
              } catch (e) {
                // Ignore invalid JSON
              }
            } else if (line.startsWith(': OPENROUTER PROCESSING')) {
              // Handle processing messages if needed
              console.log("OpenRouter Processing...");
            }
          }
        }
      } finally {
        reader.cancel();
        // Clear input and attachments
        setInput('');
        setAttachments([]);
      }
    } catch (error) {
      console.error("OpenRouter API Error:", error);
      const errorReply: Message = { text: 'Error communicating with AI', sender: 'bot' };
      setMessages([...messages, errorReply]);
    }
  };

  const startNewChat = () => {
    const newChatId = Math.random().toString(36).substring(7);
    const newChatName = "New Chat";
    setChats([...chats, { id: newChatId, name: newChatName }]);
    setSelectedChat(newChatId);
    setMessages([]); // Clear messages for the new chat
  };

  const renameChat = (chatId: string, newName: string) => {
    setChats(chats.map(chat => chat.id === chatId ? { ...chat, name: newName } : chat));
  };

  const deleteChat = (chatId: string) => {
    setChats(chats.filter(chat => chat.id !== chatId));
    if (selectedChat === chatId) {
      setSelectedChat(null);
      setMessages([]);
    }
  };

  const handleAttachmentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 4) {
      alert("You can only attach up to 4 files.");
      return;
    }
    setAttachments(files);
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Chat List Sidebar */}
      <Card className="w-72 h-full rounded-none border-r border-t-0 border-b-0 border-l-0 shadow-none">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            Chats
          </CardTitle>
          <Button onClick={startNewChat} className="w-full mt-2" size="sm">
            <PlusCircle className="h-4 w-4 mr-1" /> New Chat
          </Button>
        </CardHeader>
        <CardContent className="p-3 h-[calc(100%-8rem)] overflow-y-auto">
          <ul className="space-y-1">
            {chats.map((chat) => (
              <li
                key={chat.id}
                className={`flex items-center justify-between py-2 px-3 rounded-md cursor-pointer hover:bg-gray-100 transition-colors duration-200 ${selectedChat === chat.id ? 'bg-gray-100 font-medium border-l-4 border-primary pl-2' : ''}`}
                onClick={() => setSelectedChat(chat.id)}
              >
                <div className="flex items-center gap-2 truncate">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                  <span className="truncate">{chat.name}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 hover:opacity-100">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newName = prompt('Enter new name for chat', chat.name);
                      if (newName) {
                        renameChat(chat.id, newName);
                      }
                    }}
                  >
                    <Edit className="h-3.5 w-3.5 text-gray-500" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteChat(chat.id);
                    }}
                  >
                    <Trash className="h-3.5 w-3.5 text-red-500" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Chat Area */}
      <Card className="flex-1 rounded-none border-0 shadow-none">
        <CardHeader className="border-b pb-3">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-2xl font-bold">Zoom Book AI</CardTitle>
              <CardDescription className="flex items-center gap-1.5">
                <Bot className="h-4 w-4 text-primary" />
                Powered by Gemini 2.0 Flash
              </CardDescription>
            </div>
            <div className="bg-primary/10 text-primary text-xs font-medium px-2.5 py-1 rounded-full flex items-center gap-1">
              <Bot className="h-3.5 w-3.5" />
              Gemini 2.0 Flash
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-6 h-[calc(100vh-13rem)]">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-8">
              <Bot className="h-12 w-12 text-primary/20 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Welcome to Zoom Book AI</h3>
              <p className="text-gray-500 max-w-md">
                Start a conversation with our AI assistant powered by Gemini 2.0 Flash. Ask questions, get information, or just chat!
              </p>
            </div>
          ) : (
            messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start mb-6 ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {message.sender === 'bot' && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center mr-2 mt-1">
                    <Bot className="h-5 w-5 text-primary" />
                  </div>
                )}
                <div
                  className={`max-w-3xl p-4 rounded-lg break-words shadow-sm ${
                    message.sender === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-none' 
                      : 'bg-gray-100 text-gray-800 rounded-tl-none'
                  }`}
                >
                  {message.text}
                  {message.attachments && message.attachments.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200/30">
                      {message.attachments.map((attachment, index) => (
                        <div key={index} className="flex items-center text-sm text-gray-600">
                          {attachment.type === 'application/pdf' ? (
                            <FileText className="h-3.5 w-3.5 mr-1.5" />
                          ) : attachment.type.startsWith('image/') ? (
                            <Image className="h-3.5 w-3.5 mr-1.5" />
                          ) : (
                            <Paperclip className="h-3.5 w-3.5 mr-1.5" />
                          )}
                          {attachment.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {message.sender === 'user' && (
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center ml-2 mt-1">
                    <div className="h-4 w-4 rounded-full bg-primary" />
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={messageEndRef} />
        </CardContent>

        <CardFooter className="border-t p-4">
          <div className="w-full space-y-2">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-full">
                <Search className={`h-4 w-4 ${webSearchEnabled ? 'text-primary' : 'text-gray-400'}`} />
                <label htmlFor="web-search-toggle" className="flex items-center cursor-pointer">
                  <span className="text-sm font-medium mr-2">Web Search</span>
                  <div className={`relative inline-block w-10 h-5 rounded-full transition-colors duration-200 ease-in-out ${webSearchEnabled ? 'bg-primary' : 'bg-gray-300'}`}>
                    <input
                      id="web-search-toggle"
                      type="checkbox"
                      className="opacity-0 w-0 h-0"
                      checked={webSearchEnabled}
                      onChange={(e) => setWebSearchEnabled(e.target.checked)}
                    />
                    <span className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out ${webSearchEnabled ? 'transform translate-x-5' : ''}`}></span>
                  </div>
                </label>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-full px-4 py-2.5 pr-12 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-colors duration-200"
                  placeholder="Type your message..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') sendMessage();
                  }}
                />
                <label htmlFor="attachment-input" className="absolute right-14 top-2.5 cursor-pointer text-gray-500 hover:text-gray-700 transition-colors duration-200">
                  <Paperclip className="h-5 w-5" />
                </label>
                <input
                  id="attachment-input"
                  type="file"
                  multiple
                  onChange={handleAttachmentChange}
                  accept="image/*, application/pdf, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                />
              </div>
              <Button
                onClick={sendMessage}
                className="rounded-full"
                disabled={(!input && attachments.length === 0) || processingPDF}
              >
                <Send className="h-4 w-4 mr-1" /> Send
              </Button>
            </div>
            
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center bg-gray-100 text-sm text-gray-700 px-3 py-1 rounded-full">
                    {attachment.type === 'application/pdf' ? (
                      <FileText className="h-3.5 w-3.5 mr-1.5" />
                    ) : attachment.type.startsWith('image/') ? (
                      <Image className="h-3.5 w-3.5 mr-1.5" />
                    ) : (
                      <Paperclip className="h-3.5 w-3.5 mr-1.5" />
                    )}
                    <span className="truncate max-w-[150px]">{attachment.name}</span>
                    <button 
                      className="ml-1.5 text-gray-500 hover:text-red-500"
                      onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                    >
                      <Trash className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            
            {processingPDF && (
              <div className="text-sm text-gray-500 mt-2 flex items-center">
                <div className="animate-spin mr-2 h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                {pdfProcessingStatus || "Processing PDF..."}
              </div>
            )}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ZoomBookAI;
