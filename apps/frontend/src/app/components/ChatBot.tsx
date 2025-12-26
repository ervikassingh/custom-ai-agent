'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import MessageBubble, { Message } from './MessageBubble';
import TypingIndicator from './TypingIndicator';

// API URL configuration - uses environment variable or falls back to localhost
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface HealthStatus {
  status: 'online' | 'offline' | 'model_missing' | 'checking';
  model: string;
  message: string;
}

export default function ChatBot() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [health, setHealth] = useState<HealthStatus>({
    status: 'checking',
    model: '',
    message: 'Checking...',
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const stored = localStorage.getItem('theme');
    if (stored) {
      setIsDark(stored === 'dark');
    } else {
      setIsDark(window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
  }, []);

  // Apply theme class to document
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  // Health check function
  const checkHealth = useCallback(async () => {
    setHealth(prev => ({ ...prev, status: 'checking' }));
    
    // Ensure animation is visible before fetch completes
    const minDelay = new Promise(resolve => setTimeout(resolve, 400));
    
    try {
      const [response] = await Promise.all([
        fetch(`${API_URL}/chat/health`),
        minDelay
      ]);
      if (!response.ok) {
        throw new Error('Health check failed');
      }
      const data = await response.json();
      setHealth(data);
    } catch {
      setHealth({
        status: 'offline',
        model: '',
        message: 'Backend unavailable',
      });
    }
  }, []);

  // Check health on mount and periodically
  useEffect(() => {
    checkHealth();
    const interval = setInterval(checkHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [checkHealth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage.content }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Server error: ${response.status}`);
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).toLowerCase();
  };

  return (
    <div className="chat-container flex flex-col h-screen h-[100dvh] w-full max-w-3xl mx-auto">
      {/* Header */}
      <header className="px-4 sm:px-6 py-4 sm:py-5 safe-area-top">
        <div className="flex items-center justify-between">
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
                  />
                </svg>
              </div>
              {/* Status indicator */}
              <span
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[var(--background)] transition-all duration-500 ${
                  health.status === 'online'
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'
                    : health.status === 'checking'
                    ? 'bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]'
                    : health.status === 'model_missing'
                    ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                    : 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]'
                }`}
                title={health.message}
              ></span>
            </div>
            <div className="min-w-0">
              <h1 className="text-base font-semibold text-[var(--foreground)] tracking-tight">
                AI Assistant
              </h1>
              <button 
                onClick={checkHealth}
                disabled={health.status === 'checking'}
                className="flex items-center gap-1.5 group py-0.5 px-1.5 -ml-1.5 rounded-md hover:bg-[var(--surface)] active:bg-[var(--surface-elevated)] transition-all duration-200"
                title={health.message}
              >
                <span className={`text-xs font-mono truncate max-w-[140px] sm:max-w-none transition-colors duration-200 ${
                  health.status === 'checking' 
                    ? 'text-blue-500' 
                    : 'text-[var(--muted)] group-hover:text-[var(--muted-foreground)]'
                }`}>
                  {health.status === 'checking' ? 'syncing...' : (health.model || 'llama3.2:1b')}
                </span>
                <div className={`relative flex items-center justify-center w-4 h-4 transition-all duration-300 ${
                  health.status === 'checking' ? 'scale-110' : 'group-hover:scale-110'
                }`}>
                  {health.status === 'checking' ? (
                    <svg 
                      className="w-3.5 h-3.5 text-blue-500 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                    >
                      <circle
                        className="opacity-20"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="3"
                      />
                      <path
                        className="opacity-90"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                  ) : (
                    <svg 
                      className="w-3 h-3 text-[var(--muted)] group-hover:text-[var(--muted-foreground)] transition-all duration-200 group-hover:rotate-45"
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                  )}
                </div>
              </button>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="theme-toggle w-10 h-10 rounded-xl flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] hover:ring-1 hover:ring-[var(--border)] hover:scale-110 active:scale-95 active:bg-[var(--surface-elevated)] transition-all duration-200"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <svg className="w-5 h-5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
                  />
                </svg>
              ) : (
                <svg className="w-5 h-5 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 sm:py-8 overscroll-contain">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center animate-[fade-in_0.5s_ease-out] px-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--surface)] flex items-center justify-center mb-4 sm:mb-5">
              <svg
                className="w-6 h-6 text-[var(--muted)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.129.166 2.27.293 3.423.379.35.026.67.21.865.501L12 21l2.755-4.133a1.14 1.14 0 01.865-.501 48.172 48.172 0 003.423-.379c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z"
                />
              </svg>
            </div>
            <h2 className="text-base sm:text-lg font-medium text-[var(--foreground)] mb-2 tracking-tight">
              Start a conversation
            </h2>
            <p className="text-sm text-[var(--muted)] max-w-[280px] sm:max-w-sm leading-relaxed">
              {health.status === 'online'
                ? `Ask anything. Running locally with ${health.model}.`
                : health.status === 'checking'
                ? 'Connecting to backend...'
                : health.message}
            </p>
          </div>
        )}

        <div className="space-y-4 sm:space-y-6">
          {messages.map((message, index) => (
            <div key={message.id} style={{ animationDelay: `${index * 0.05}s` }}>
              <MessageBubble message={message} formatTime={formatTime} />
            </div>
          ))}

          {isLoading && <TypingIndicator />}

          {error && (
            <div className="flex justify-center animate-[fade-in_0.2s_ease-out] px-2">
              <div className="bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-medium text-center">
                {error}
              </div>
            </div>
          )}
        </div>

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="px-3 sm:px-6 pb-4 sm:pb-6 pt-2 safe-area-bottom">
        <form onSubmit={handleSubmit}>
          <div className="glass-input rounded-2xl border border-[var(--border)] focus-within:border-[var(--muted)] transition-all duration-200 relative flex items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message..."
              readOnly={isLoading}
              rows={1}
              className={`flex-1 bg-transparent px-4 py-3 text-[16px] sm:text-[14px] text-[var(--foreground)] placeholder:text-[var(--muted)] focus:outline-none resize-none ${isLoading ? 'opacity-40' : ''}`}
              style={{ minHeight: '48px', maxHeight: '120px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 120) + 'px';
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 m-1.5 w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--accent)] text-[var(--accent-foreground)] disabled:opacity-20 disabled:cursor-not-allowed transition-all duration-200 hover:opacity-80 active:scale-95"
            >
              {isLoading ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="3"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
              ) : (
                <svg 
                  className="w-4 h-4" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 10.5L12 3m0 0l7.5 7.5M12 3v18"
                  />
                </svg>
              )}
            </button>
          </div>
        </form>
        <p className="text-[10px] text-[var(--muted)] mt-2 sm:mt-3 text-center tracking-wide hidden sm:block">
          <span className="opacity-60">↵</span> to send · <span className="opacity-60">⇧↵</span> for new line
        </p>
      </div>
    </div>
  );
}
