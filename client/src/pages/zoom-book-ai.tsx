import React, { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MessageSquare, PlusCircle, Search, Paperclip, Send, Trash, Edit, Bot } from 'lucide-react';

interface Message {
  text: string;
  sender: 'user' | 'bot';
  attachments?: File[];
}

const ZoomBookAI = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [chats, setChats] = useState<{ id: string; name: string }[]>([]);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const messageEndRef = useRef<HTMLDivElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);

  const apiKey = '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';
  const model = 'google/gemini-2.0-flash-001';

  useEffect(() => {
    // Scroll to bottom on message change
    messageEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input && attachments.length === 0) return;

    const newMessage: Message = { text: input, sender: 'user', attachments };
    setMessages([...messages, newMessage]);
    setInput('');
    setAttachments([]);

    try {
      let modelToUse = model;
      
      // Create the request body
      const requestBody: any = {
        model: modelToUse,
        messages: [{
          role: 'user',
          content: input // Will be updated if there are attachments
        }],
      };

      if (webSearchEnabled) {
        requestBody.model = `${model}:online`;
      }
      
      // Handle attachments if any
      if (attachments.length > 0) {
        let messageContent: any = [];
        
        // Add text content if it exists
        if (input) {
          messageContent.push({
            type: "text",
            text: input
          });
        }
        
        // Convert each attachment to base64 and add it to the message content
        for (const attachment of attachments) {
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
            // For PDFs and other files, instruct the model to analyze the file
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

      const data = await response.json();
      if (data.choices && data.choices.length > 0) {
        const reply = data.choices[0].message.content;
        const newReply: Message = { text: reply, sender: 'bot' };
        setMessages([...messages, newReply]);
      } else {
        console.error("OpenRouter API Error: No choices returned");
        const errorReply: Message = { text: 'Error communicating with AI: No response', sender: 'bot' };
        setMessages([...messages, errorReply]);
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
                          <Paperclip className="h-3.5 w-3.5 mr-1.5" />
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
                disabled={!input && attachments.length === 0}
              >
                <Send className="h-4 w-4 mr-1" /> Send
              </Button>
            </div>
            
            {attachments.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {attachments.map((attachment, index) => (
                  <div key={index} className="flex items-center bg-gray-100 text-sm text-gray-700 px-3 py-1 rounded-full">
                    <Paperclip className="h-3.5 w-3.5 mr-1.5" />
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
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ZoomBookAI;
