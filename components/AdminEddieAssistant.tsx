"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Send } from "lucide-react";

export default function AdminEddieAssistant() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState([
    { role: "ai", content: "Hallo! Wie kann ich Ihnen heute helfen?" },
  ]);
  const [isSpinning, setIsSpinning] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Eddie chat functions
  useEffect(() => {
    if (chatOpen) {
      scrollToBottom();
    }
  }, [chatMessages, chatOpen]);

  // Set CSS variables for light/dark mode input styling
  useEffect(() => {
    document.documentElement.style.setProperty(
      '--input-bg',
      'linear-gradient(to bottom, rgba(243,244,246,0.95), rgba(249,250,251,0.95))'
    );

    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const updateColorMode = (isDark: boolean) => {
      if (isDark) {
        document.documentElement.style.setProperty(
          '--input-bg',
          'linear-gradient(to bottom, rgba(31,41,55,0.95), rgba(17,24,39,0.95))'
        );
      } else {
        document.documentElement.style.setProperty(
          '--input-bg',
          'linear-gradient(to bottom, rgba(243,244,246,0.95), rgba(249,250,251,0.95))'
        );
      }
    };
    
    updateColorMode(darkModeMediaQuery.matches);
    darkModeMediaQuery.addEventListener('change', (e) => updateColorMode(e.matches));
    
    return () => {
      darkModeMediaQuery.removeEventListener('change', (e) => updateColorMode(e.matches));
    };
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const newMessages = [...chatMessages, { role: "user", content: chatInput }];
    setChatMessages(newMessages);
    setChatInput("");

    setTimeout(() => {
      setChatMessages([
        ...newMessages,
        { 
          role: "ai", 
          content: "Ich verarbeite Ihre Anfrage. Wie kann ich Ihnen weiter behilflich sein?" 
        }
      ]);
    }, 1000);
  };

  return (
    <>
      {/* Eddie KI Assistant Floating Button */}
      <button 
        className="fixed bottom-20 right-4 w-14 h-14 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg flex items-center justify-center z-40 hover:shadow-xl transition-shadow"
        onClick={() => {
          setChatOpen(true);
          setIsSpinning(true);
          setTimeout(() => setIsSpinning(false), 1000);
        }}
      >
        <div className="absolute w-full h-full rounded-full bg-gradient-to-r from-blue-500 to-blue-600 animate-ping-slow opacity-70"></div>
        <img
          src="/icons/robot 1.svg"
          alt="KI Assistant"
          className={`h-8 w-8 relative z-10 ${isSpinning ? 'animate-spin-once' : ''} brightness-0 invert`}
        />
      </button>

      {/* Darkening overlay for when KI assistant chat is shown */}
      <div 
        className={`fixed inset-0 bg-black transition-opacity duration-500 z-[35] ${
          chatOpen ? 'opacity-40' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setChatOpen(false)}
      ></div>

      {/* Eddie KI Assistant Chat Interface */}
      {chatOpen && (
        <div className="fixed bottom-36 right-4 w-72 h-[400px] bg-white dark:bg-gray-900 rounded-lg shadow-xl flex flex-col z-50 overflow-hidden">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-3 flex items-center justify-between shadow-md sticky top-0 z-10">
            <div className="flex items-center">
              <img
                src="/icons/robot 1.svg"
                alt="KI Assistant"
                className="h-5 w-5 mr-2 brightness-0 invert"
              />
              <h3 className="text-white font-medium">Frag Eddie!</h3>
            </div>
            <button 
              onClick={() => setChatOpen(false)} 
              className="text-white hover:bg-blue-600 rounded-full p-1"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-3 pb-16 scrollbar-thin scrollbar-track-transparent hover:scrollbar-thumb-blue-600 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-blue-500/50 [&::-webkit-scrollbar-thumb:hover]:bg-blue-500">
            <div className="space-y-3">
              {chatMessages.map((message, index) => (
                <div 
                  key={index} 
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      message.role === 'user' 
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100' 
                        : 'bg-blue-400 text-white'
                    }`}
                  >
                    {message.content}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Chat Input */}
          <div className="absolute bottom-3 left-3 right-3 z-20">
            <form onSubmit={sendMessage} className="relative">
              <input 
                type="text"
                value={chatInput} 
                onChange={(e) => setChatInput(e.target.value)} 
                placeholder="Frag Eddie egal was..." 
                className="w-full pr-12 py-2 px-5 rounded-full outline-none text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400 placeholder:text-xs"
                style={{ 
                  border: 'none', 
                  boxShadow: '0 3px 8px rgba(0,0,0,0.18)', 
                  WebkitAppearance: 'none', 
                  MozAppearance: 'none', 
                  appearance: 'none',
                  background: 'var(--input-bg, linear-gradient(to bottom, rgba(243,244,246,0.95), rgba(249,250,251,0.95)))'
                }}
              />
              <Button 
                type="submit" 
                size="icon" 
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center"
                disabled={!chatInput.trim()}
              >
                <Send className="h-3.5 w-3.5 rotate-15" />
              </Button>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes ping-slow {
          75%, 100% {
            transform: scale(2);
            opacity: 0;
          }
        }
        @keyframes spin-once {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-ping-slow {
          animation: ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite;
        }
        .animate-spin-once {
          animation: spin-once 1s ease-in-out;
        }
      `}</style>
    </>
  );
} 