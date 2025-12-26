import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { api } from '../utils/api.js';

export default function Chat({ agentId, agentName }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const lastMessageTimeRef = useRef(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load initial messages
  useEffect(() => {
    const loadMessages = async () => {
      try {
        setLoading(true);
        const data = await api.getMessages(50, 0);
        setMessages(data.messages || []);
        if (data.messages && data.messages.length > 0) {
          lastMessageTimeRef.current = new Date(data.messages[data.messages.length - 1].createdAt).getTime();
        }
        setError(null);
      } catch (err) {
        console.error('Failed to load messages:', err);
        setError('Failed to load messages');
      } finally {
        setLoading(false);
      }
    };

    loadMessages();
  }, []);

  // Poll for new messages every 2 seconds
  useEffect(() => {
    const pollInterval = setInterval(async () => {
      try {
        const since = lastMessageTimeRef.current ? new Date(lastMessageTimeRef.current).toISOString() : null;
        const data = await api.getRecentMessages(since);
        
        if (data.messages && data.messages.length > 0) {
          setMessages(prev => {
            const newMessages = [...prev, ...data.messages];
            // Remove duplicates by id
            const uniqueMessages = Array.from(
              new Map(newMessages.map(m => [m.id, m])).values()
            );
            return uniqueMessages;
          });
          lastMessageTimeRef.current = new Date(data.messages[data.messages.length - 1].createdAt).getTime();
        }
      } catch (err) {
        console.error('Failed to poll messages:', err);
      }
    }, 2000); // Poll every 2 seconds

    return () => clearInterval(pollInterval);
  }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!input.trim()) return;

    try {
      setLoading(true);
      setError(null);
      
      const newMessage = await api.createMessage(agentId, input.trim());
      setMessages(prev => [...prev, newMessage]);
      lastMessageTimeRef.current = new Date(newMessage.createdAt).getTime();
      setInput('');
    } catch (err) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Team Chat</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400">All agents</p>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <div className="text-slate-500 dark:text-slate-400">Loading messages...</div>
          </div>
        )}

        {messages.length === 0 && !loading && (
          <div className="flex items-center justify-center h-full">
            <div className="text-slate-500 dark:text-slate-400 text-center">
              <p>No messages yet</p>
              <p className="text-xs">Start a conversation!</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.agent?.id === agentId ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-3 py-2 rounded-lg ${
                message.agent?.id === agentId
                  ? 'bg-blue-500 text-white'
                  : 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600'
              }`}
            >
              {message.agent?.id !== agentId && (
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">
                  {message.agent?.name || 'Anonymous'}
                </p>
              )}
              <p className="text-sm break-words">{message.content}</p>
              <p
                className={`text-xs mt-1 ${
                  message.agent?.id === agentId
                    ? 'text-blue-100'
                    : 'text-slate-500 dark:text-slate-400'
                }`}
              >
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-4 py-2 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Input Form */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message... 😊"
            disabled={loading}
            className="flex-1 px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
