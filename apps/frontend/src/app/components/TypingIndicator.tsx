'use client';

export default function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="message-bubble bg-[var(--assistant-bubble)] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="flex items-center gap-1.5">
          <span className="typing-dot w-1.5 h-1.5 bg-[var(--muted-foreground)] rounded-full"></span>
          <span className="typing-dot w-1.5 h-1.5 bg-[var(--muted-foreground)] rounded-full"></span>
          <span className="typing-dot w-1.5 h-1.5 bg-[var(--muted-foreground)] rounded-full"></span>
        </div>
      </div>
    </div>
  );
}

