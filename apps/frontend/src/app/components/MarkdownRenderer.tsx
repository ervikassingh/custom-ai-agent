'use client';

import ReactMarkdown from 'react-markdown';
import { ComponentPropsWithoutRef } from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      className={`markdown-content ${className}`}
      components={{
        // Paragraphs
        p: ({ children }) => (
          <p className="mb-2.5 sm:mb-3 last:mb-0 leading-[1.6] sm:leading-[1.7]">{children}</p>
        ),
        
        // Bold text
        strong: ({ children }) => (
          <strong className="font-semibold">{children}</strong>
        ),
        
        // Italic text
        em: ({ children }) => (
          <em className="italic">{children}</em>
        ),
        
        // Headings
        h1: ({ children }) => (
          <h1 className="text-base sm:text-lg font-semibold mb-2.5 sm:mb-3 mt-3 sm:mt-4 first:mt-0">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="text-[15px] sm:text-base font-semibold mb-2 mt-2.5 sm:mt-3 first:mt-0">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="text-sm font-semibold mb-1.5 sm:mb-2 mt-2.5 sm:mt-3 first:mt-0">{children}</h3>
        ),
        
        // Lists
        ul: ({ children }) => (
          <ul className="list-disc list-outside ml-4 mb-2.5 sm:mb-3 last:mb-0 space-y-0.5 sm:space-y-1">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal list-outside ml-4 mb-2.5 sm:mb-3 last:mb-0 space-y-0.5 sm:space-y-1">{children}</ol>
        ),
        li: ({ children }) => (
          <li className="leading-[1.5] sm:leading-[1.6]">{children}</li>
        ),
        
        // Code blocks
        code: ({ className, children, ...props }: ComponentPropsWithoutRef<'code'> & { inline?: boolean }) => {
          const isInline = !className;
          if (isInline) {
            return (
              <code className="px-1 sm:px-1.5 py-0.5 rounded bg-[var(--surface-elevated)] text-[12px] sm:text-[13px] font-mono break-all" {...props}>
                {children}
              </code>
            );
          }
          return (
            <code className="block p-2.5 sm:p-3 rounded-lg bg-[var(--surface-elevated)] text-[12px] sm:text-[13px] font-mono overflow-x-auto mb-2.5 sm:mb-3 whitespace-pre-wrap break-words sm:whitespace-pre sm:break-normal" {...props}>
              {children}
            </code>
          );
        },
        
        // Pre blocks (code blocks wrapper)
        pre: ({ children }) => (
          <pre className="mb-2.5 sm:mb-3 last:mb-0 overflow-x-auto -mx-1 sm:mx-0">{children}</pre>
        ),
        
        // Blockquotes
        blockquote: ({ children }) => (
          <blockquote className="border-l-2 border-[var(--border)] pl-2.5 sm:pl-3 italic text-[var(--muted-foreground)] mb-2.5 sm:mb-3 last:mb-0 text-[14px] sm:text-inherit">
            {children}
          </blockquote>
        ),
        
        // Links
        a: ({ href, children }) => (
          <a 
            href={href} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline active:opacity-70 break-words"
          >
            {children}
          </a>
        ),
        
        // Horizontal rule
        hr: () => (
          <hr className="border-[var(--border)] my-3 sm:my-4" />
        ),
      }}
    >
      {content}
    </ReactMarkdown>
  );
}

