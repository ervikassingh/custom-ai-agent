'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import MessageBubble, { Message } from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import ToolsPanel from './ToolsPanel';
import {
  SparklesIcon,
  SpinnerIcon,
  RefreshIcon,
  WrenchIcon,
  SunIcon,
  MoonIcon,
  ChatBubbleIcon,
  ArrowUpIcon,
} from './Icons';
import { API_URL, MAX_HISTORY_PAIRS } from '../config';

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
  const [isToolsOpen, setIsToolsOpen] = useState(false);
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
      // Get conversation history (limit to last N message pairs)
      // We use the current messages state which includes all messages up to now
      const history = messages
        .slice(-MAX_HISTORY_PAIRS * 2) // Get last N pairs (each pair = 2 messages)
        .map((msg) => ({
          role: msg.role,
          content: msg.content,
        }));

      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          history,
        }),
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
                <SparklesIcon className="w-5 h-5 text-white" />
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
                    <SpinnerIcon className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                  ) : (
                    <RefreshIcon className="w-3 h-3 text-[var(--muted)] group-hover:text-[var(--muted-foreground)] transition-all duration-200 group-hover:rotate-45" />
                  )}
                </div>
              </button>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-1">
            {/* Tools Button */}
            <button
              onClick={() => setIsToolsOpen(true)}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] hover:ring-1 hover:ring-[var(--border)] hover:scale-110 active:scale-95 active:bg-[var(--surface-elevated)] transition-all duration-200"
              aria-label="Open tools panel"
            >
              <WrenchIcon className="w-5 h-5" />
            </button>
            
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="theme-toggle w-10 h-10 rounded-xl flex items-center justify-center text-[var(--muted-foreground)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] hover:ring-1 hover:ring-[var(--border)] hover:scale-110 active:scale-95 active:bg-[var(--surface-elevated)] transition-all duration-200"
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? (
                <SunIcon className="w-5 h-5 transition-transform duration-200" />
              ) : (
                <MoonIcon className="w-5 h-5 transition-transform duration-200" />
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
              <ChatBubbleIcon className="w-6 h-6 text-[var(--muted)]" />
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
                <SpinnerIcon className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowUpIcon className="w-4 h-4" />
              )}
            </button>
          </div>
        </form>
        <p className="text-[10px] text-[var(--muted)] mt-2 sm:mt-3 text-center tracking-wide hidden sm:block">
          <span className="opacity-60">↵</span> to send · <span className="opacity-60">⇧↵</span> for new line
        </p>
      </div>

      {/* Tools Panel */}
      <ToolsPanel isOpen={isToolsOpen} onClose={() => setIsToolsOpen(false)} />
    </div>
  );
}
