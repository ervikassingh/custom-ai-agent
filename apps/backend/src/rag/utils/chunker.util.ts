/**
 * Text chunking utility for RAG
 * Splits long documents into overlapping chunks for better retrieval
 */

export interface Chunk {
  text: string;
  index: number;
  startChar: number;
  endChar: number;
}

export interface ChunkOptions {
  maxChunkSize?: number; // Maximum characters per chunk
  chunkOverlap?: number; // Overlap between chunks
  minChunkSize?: number; // Minimum chunk size (avoid tiny chunks)
}

const DEFAULT_OPTIONS: Required<ChunkOptions> = {
  maxChunkSize: 1000, // ~250 tokens for nomic-embed-text
  chunkOverlap: 200, // 20% overlap
  minChunkSize: 100,
};

/**
 * Split text into overlapping chunks
 */
export function chunkText(text: string, options: ChunkOptions = {}): Chunk[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const { maxChunkSize, chunkOverlap, minChunkSize } = opts;

  // If text is short enough, return as single chunk
  if (text.length <= maxChunkSize) {
    return [
      {
        text: text.trim(),
        index: 0,
        startChar: 0,
        endChar: text.length,
      },
    ];
  }

  const chunks: Chunk[] = [];
  let startChar = 0;
  let chunkIndex = 0;

  while (startChar < text.length) {
    let endChar = startChar + maxChunkSize;

    // Don't exceed text length
    if (endChar >= text.length) {
      endChar = text.length;
    } else {
      // Try to break at a sentence or paragraph boundary
      endChar = findBreakPoint(text, startChar, endChar);
    }

    const chunkText = text.slice(startChar, endChar).trim();

    // Only add non-empty chunks that meet minimum size
    if (chunkText.length >= minChunkSize) {
      chunks.push({
        text: chunkText,
        index: chunkIndex,
        startChar,
        endChar,
      });
      chunkIndex++;
    }

    // Move start position, accounting for overlap
    startChar = endChar - chunkOverlap;

    // Prevent infinite loop
    if (startChar >= text.length - minChunkSize) {
      break;
    }
  }

  return chunks;
}

/**
 * Find a good break point (sentence/paragraph boundary)
 */
function findBreakPoint(text: string, start: number, maxEnd: number): number {
  const searchRange = text.slice(start, maxEnd);
  
  // Priority: paragraph break > sentence end > word boundary
  const breakPatterns = [
    /\n\n/g, // Paragraph break
    /[.!?]\s+/g, // Sentence end
    /[,;:]\s+/g, // Clause break
    /\s+/g, // Word boundary
  ];

  for (const pattern of breakPatterns) {
    let lastMatch: RegExpExecArray | null = null;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(searchRange)) !== null) {
      // Prefer breaks in the last third of the chunk
      if (match.index > searchRange.length * 0.6) {
        lastMatch = match;
      }
    }

    if (lastMatch) {
      return start + lastMatch.index + lastMatch[0].length;
    }
  }

  // No good break point found, use max end
  return maxEnd;
}

/**
 * Estimate token count (rough approximation)
 * ~4 characters per token on average for English text
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Check if text needs chunking based on token estimate
 */
export function needsChunking(text: string, maxTokens = 250): boolean {
  return estimateTokens(text) > maxTokens;
}

/**
 * Combine title and content for embedding
 */
export function prepareTextForEmbedding(title: string, content: string): string {
  return `${title}\n\n${content}`;
}

