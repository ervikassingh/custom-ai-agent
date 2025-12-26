'use client';

import MarkdownRenderer from './MarkdownRenderer';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface MessageBubbleProps {
  message: Message;
  formatTime: (date: Date) => string;
}

export default function MessageBubble({ message, formatTime }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`message-bubble max-w-[92%] sm:max-w-[85%] md:max-w-[80%] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 ${
          isUser
            ? 'bg-[var(--user-bubble)] text-[var(--user-bubble-text)]'
            : 'bg-[var(--assistant-bubble)] text-[var(--assistant-bubble-text)]'
        }`}
      >
        {isUser ? (
          // User messages - plain text
          <p className="text-[15px] sm:text-[14px] leading-[1.6] sm:leading-[1.7] whitespace-pre-wrap break-words">
            {message.content}
          </p>
        ) : (
          // Assistant messages - markdown rendered
          <div className="text-[15px] sm:text-[14px] break-words overflow-hidden">
            <MarkdownRenderer content={message.content} />
          </div>
        )}
        <p
          className={`text-[10px] mt-1.5 sm:mt-2 font-medium tracking-wide ${
            isUser ? 'opacity-60' : 'text-[var(--muted)]'
          }`}
        >
          {formatTime(message.timestamp)}
        </p>
      </div>
    </div>
  );
}

