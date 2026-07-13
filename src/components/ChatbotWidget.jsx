import React, { useState, useRef, useEffect } from "react";
import { apiClient } from "../App";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "../lib/utils";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  User,
  HelpCircle,
  ChevronRight,
  Loader2
} from "lucide-react";

const QUICK_ACTIONS = [
  { label: "Reset password", query: "How do I reset my password?" },
  { label: "View attendance", query: "Where can I see my attendance?" },
  { label: "Submit assignment", query: "How do I submit assignments?" },
  { label: "Contact support", query: "How do I contact support?" },
];

const FAQS = [
  { q: "How do I reset my password?", a: "Go to Settings > Change Password or use the 'Forgot Password' link on the login page." },
  { q: "Where can I see my grades?", a: "Navigate to the Grades section from your dashboard to see all your current scores." },
  { q: "How do I submit an assignment?", a: "Go to Classwork section, find the assignment, and click Submit. You can upload files or enter text." },
  { q: "What if I'm marked absent by mistake?", a: "Contact your teacher immediately or submit a leave request with the correct details." },
];

export const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: "bot",
      content: "Hi! I'm your JAIN LMS assistant. How can I help you today?",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showFaqs, setShowFaqs] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (content = inputValue) => {
    if (!content.trim()) return;

    const userMessage = {
      type: "user",
      content: content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await apiClient.post("/chatbot/message", {
        message: content,
        context: { page: window.location.pathname },
      });

      const botMessage = {
        type: "bot",
        content: response.data.response,
        timestamp: new Date(),
        actions: response.data.suggested_actions,
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage = {
        type: "bot",
        content: "I'm having trouble connecting. Please try again or contact support@jainuniversity.ac.in",
        timestamp: new Date(),
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (query) => {
    handleSend(query);
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "fixed bottom-20 right-4 lg:bottom-8 z-50",
          "w-14 h-14 rounded-full bg-[#1a365d] hover:bg-[#102a43]",
          "flex items-center justify-center shadow-lg",
          "transition-all duration-300 hover:scale-110",
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a365d]",
          isOpen && "scale-0 opacity-0"
        )}
        aria-label="Open chat"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className={cn(
            "fixed bottom-20 right-4 lg:bottom-8 z-50",
            "w-[calc(100vw-2rem)] max-w-sm lg:w-96",
            "bg-white dark:bg-slate-900 rounded-2xl shadow-2xl",
            "border border-slate-200 dark:border-slate-700",
            "flex flex-col overflow-hidden",
            "animate-in slide-in-from-bottom-4 fade-in duration-300"
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-[#1a365d] text-white">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold">PAWSS Assistant</h3>
                <p className="text-xs text-slate-300">Online 24/7</p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowFaqs(!showFaqs)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="View FAQs"
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                aria-label="Close chat"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* FAQ Panel */}
          {showFaqs && (
            <div className="bg-slate-50 dark:bg-slate-800 p-4 border-b border-slate-200 dark:border-slate-700">
              <h4 className="text-sm font-medium mb-3 text-slate-900 dark:text-white">
                Frequently Asked Questions
              </h4>
              <div className="space-y-2">
                {FAQS.map((faq, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      handleQuickAction(faq.q);
                      setShowFaqs(false);
                    }}
                    className="w-full text-left p-2 text-sm rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors text-slate-700 dark:text-slate-300"
                  >
                    {faq.q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          <ScrollArea className="flex-1 h-80 p-4">
            <div className="space-y-4">
              {messages.map((message, idx) => (
                <div
                  key={idx}
                  className={cn(
                    "flex gap-3",
                    message.type === "user" && "flex-row-reverse"
                  )}
                >
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                      message.type === "bot"
                        ? "bg-[#1a365d] text-white"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300"
                    )}
                  >
                    {message.type === "bot" ? (
                      <Bot className="w-4 h-4" />
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                  </div>
                  <div
                    className={cn(
                      "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                      message.type === "bot"
                        ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-tl-none"
                        : "bg-[#1a365d] text-white rounded-tr-none",
                      message.isError && "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300"
                    )}
                  >
                    <p>{message.content}</p>
                    <span className="text-xs opacity-60 mt-1 block">
                      {formatTime(message.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#1a365d] text-white flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-slate-100 dark:bg-slate-800 rounded-2xl rounded-tl-none px-4 py-3">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Quick Actions */}
          {messages.length < 3 && (
            <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-700">
              <p className="text-xs text-slate-500 mb-2">Quick actions:</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_ACTIONS.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleQuickAction(action.query)}
                    className="text-xs px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="p-4 border-t border-slate-200 dark:border-slate-700">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                className="flex-1"
                disabled={isLoading}
              />
              <Button
                onClick={() => handleSend()}
                disabled={isLoading || !inputValue.trim()}
                size="icon"
                className="bg-[#1a365d] hover:bg-[#102a43]"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
