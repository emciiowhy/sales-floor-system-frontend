import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Send } from 'lucide-react';
import { api } from '../utils/api.js';
import { toast } from 'sonner';

export default function Chat({ agentId, agentName }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const lastFetchTimeRef = useRef(Date.now());
  const pollIntervalRef = useRef(null);

  // Scroll to bottom when messages change
  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 0);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Load initial messages
  useEffect(() => {
    const loadInitialMessages = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.getMessages(100, 0);
        
        if (response && response.messages && Array.isArray(response.messages)) {
          setMessages(response.messages);
          if (response.messages.length > 0) {
            lastFetchTimeRef.current = new Date(response.messages[response.messages.length - 1].createdAt).getTime();
          }
        }
      } catch (err) {
        console.error('Failed to load messages:', err);
        setError('Failed to load messages');
        toast.error('Failed to load chat messages');
      } finally {
        setLoading(false);
      }
    };

    loadInitialMessages();
  }, []);

  // Poll for new messages
  useEffect(() => {
    const pollMessages = async () => {
      try {
        const lastTime = new Date(lastFetchTimeRef.current).toISOString();
        const response = await api.getRecentMessages(lastTime);
        
        if (response && response.messages && Array.isArray(response.messages)) {
          if (response.messages.length > 0) {
            setMessages(prev => {
              const newMessages = [...prev, ...response.messages];
              // Remove duplicates by id
              const uniqueMessages = Array.from(
                new Map(newMessages.map(m => [m.id, m])).values()
              );
              return uniqueMessages;
            });
            lastFetchTimeRef.current = new Date(response.messages[response.messages.length - 1].createdAt).getTime();
            scrollToBottom();
          }
        }
      } catch (err) {
        console.error('Failed to poll messages:', err);
      }
    };

    // Start polling
    pollIntervalRef.current = setInterval(pollMessages, 1500); // Poll every 1.5 seconds

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, [scrollToBottom]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) return;

    const messageContent = input.trim();
    setInput('');
    setSending(true);

    try {
      const response = await api.createMessage(agentId, messageContent);
      
      if (response && response.message) {
        setMessages(prev => [...prev, response.message]);
        lastFetchTimeRef.current = new Date(response.message.createdAt).getTime();
        scrollToBottom();
        setError(null);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
      setInput(messageContent); // Restore input on error
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-xl border border-gray-200 dark:border-slate-700 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-gray-200 dark:border-slate-700 bg-gradient-to-r from-blue-500 to-blue-600 dark:from-blue-700 dark:to-blue-800">
        <h3 className="text-lg font-bold text-white">Team Chat</h3>
        <p className="text-xs text-blue-100">Real-time communication</p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 dark:bg-slate-800">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="inline-block">
                <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-2"></div>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="text-3xl mb-2">💬</div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No messages yet</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Start a conversation!</p>
            </div>
          </div>
        ) : (
          messages.map((message) => {
            const isOwnMessage = message.agent?.id === agentId;
            return (
              <div
                key={message.id}
                className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}
              >
                <div className={`flex gap-2 max-w-xs ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar */}
                  {!isOwnMessage && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {message.agent?.name?.[0]?.toUpperCase() || 'A'}
                      </span>
                    </div>
                  )}

                  {/* Message Bubble */}
                  <div
                    className={`px-3 py-2 rounded-2xl max-w-xs break-words ${
                      isOwnMessage
                        ? 'bg-blue-500 text-white rounded-br-none'
                        : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-gray-200 dark:border-slate-600 rounded-bl-none'
                    }`}
                  >
                    {!isOwnMessage && (
                      <p className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">
                        {message.agent?.name || 'Unknown'}
                      </p>
                    )}
                    <p className="text-sm leading-snug">{message.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        isOwnMessage
                          ? 'text-blue-100'
                          : 'text-gray-500 dark:text-gray-400'
                      }`}
                    >
                      {new Date(message.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>

                  {/* Avatar for own message */}
                  {isOwnMessage && (
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                      <span className="text-xs font-bold text-white">
                        {agentName?.[0]?.toUpperCase() || 'Y'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-medium">
          {error}
        </div>
      )}

      {/* Input Form */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message... 😊"
            disabled={sending}
            maxLength={1000}
            className="flex-1 px-4 py-2.5 text-sm border border-gray-300 dark:border-slate-600 rounded-full bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || sending}
            className="px-4 py-2.5 bg-blue-500 hover:bg-blue-600 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all hover:shadow-lg active:scale-95 flex items-center gap-1 font-medium"
            title="Send message"
          >
            {sending ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Send size={18} />
            )}
          </button>
        </form>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
          {input.length}/1000
        </p>
      </div>
    </div>
  );
}
