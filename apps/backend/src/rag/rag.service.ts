import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Document } from '../database/entities';
import { QdrantService, SearchResult } from '../qdrant/qdrant.service';
import { EmbeddingService } from '../embedding/embedding.service';

export interface RetrievedContext {
  documentId: string;
  title: string;
  content: string;
  category: string | null;
  score: number;
  chunkIndex?: number;
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    private readonly qdrantService: QdrantService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  /**
   * Search for relevant context based on user query
   */
  async searchRelevantContext(
    query: string,
    limit = 3,
    category?: string,
  ): Promise<RetrievedContext[]> {
    this.logger.debug(`Searching for context: "${query.substring(0, 50)}..."`);

    try {
      // Generate embedding for the query
      const queryEmbedding = await this.embeddingService.generateEmbedding(query);

      // Build filter if category is provided
      const filter = category
        ? {
            must: [{ key: 'category', match: { value: category } }],
          }
        : undefined;

      // Search Qdrant for similar vectors
      const searchResults = await this.qdrantService.search(
        queryEmbedding,
        limit,
        filter,
      );

      if (searchResults.length === 0) {
        this.logger.debug('No relevant context found');
        return [];
      }

      // Get unique document IDs
      const documentIds = [...new Set(
        searchResults.map((r) => r.payload.document_id as string),
      )];

      // Fetch full documents from PostgreSQL
      const documents = await this.documentRepository.find({
        where: { id: In(documentIds) },
      });

      const documentMap = new Map(documents.map((d) => [d.id, d]));

      // Build context with relevance scores
      const contexts: RetrievedContext[] = [];
      
      for (const result of searchResults) {
        const doc = documentMap.get(result.payload.document_id as string);
        if (!doc) continue;

        contexts.push({
          documentId: doc.id,
          title: doc.title,
          content: (result.payload.chunk_text as string) || doc.content,
          category: doc.category || null,
          score: result.score,
          chunkIndex: result.payload.chunk_index as number | undefined,
        });
      }

      this.logger.debug(`Found ${contexts.length} relevant contexts`);
      return contexts;
    } catch (error) {
      this.logger.error('Failed to search for context', error);
      return [];
    }
  }

  /**
   * Format retrieved contexts into a prompt-friendly string
   */
  formatContextForPrompt(contexts: RetrievedContext[]): string {
    if (contexts.length === 0) {
      return '';
    }

    const formattedContexts = contexts.map((ctx, index) => {
      const header = ctx.category 
        ? `[${index + 1}] ${ctx.title} (${ctx.category})`
        : `[${index + 1}] ${ctx.title}`;
      return `${header}\n${ctx.content}`;
    });

    return formattedContexts.join('\n\n---\n\n');
  }

  /**
   * Get RAG-augmented prompt with context
   */
  async getAugmentedPrompt(
    userMessage: string,
    category?: string,
  ): Promise<{ prompt: string; contexts: RetrievedContext[] }> {
    const contexts = await this.searchRelevantContext(userMessage, 3, category);
    const contextText = this.formatContextForPrompt(contexts);

    if (!contextText) {
      return {
        prompt: userMessage,
        contexts: [],
      };
    }

    const augmentedPrompt = `<context>
${contextText}
</context>

Question: ${userMessage}`;

    return {
      prompt: augmentedPrompt,
      contexts,
    };
  }

  /**
   * Debug: Direct search in Qdrant (for testing)
   */
  async debugSearch(
    query: string,
    limit = 5,
  ): Promise<{ query: string; results: SearchResult[] }> {
    const queryEmbedding = await this.embeddingService.generateEmbedding(query);
    const results = await this.qdrantService.search(queryEmbedding, limit);
    return { query, results };
  }
}
