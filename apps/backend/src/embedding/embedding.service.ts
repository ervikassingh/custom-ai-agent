import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface OllamaEmbeddingResponse {
  embedding: number[];
}

@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private readonly ollamaBaseUrl: string;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.ollamaBaseUrl = this.configService.get<string>(
      'OLLAMA_BASE_URL',
      'http://localhost:11434',
    );
    this.model = this.configService.get<string>(
      'EMBEDDING_MODEL',
      'nomic-embed-text',
    );
    this.logger.log(`Embedding service configured with model: ${this.model}`);
  }

  /**
   * Generate embedding for a single text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await fetch(`${this.ollamaBaseUrl}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: this.model,
          prompt: text,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama embedding API error: ${response.status} - ${errorText}`);
      }

      const data = (await response.json()) as OllamaEmbeddingResponse;
      return data.embedding;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        this.logger.error('Cannot connect to Ollama for embeddings');
        throw new Error('Cannot connect to Ollama. Please ensure Ollama is running.');
      }
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts (batch)
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const embeddings: number[][] = [];
    
    for (const text of texts) {
      const embedding = await this.generateEmbedding(text);
      embeddings.push(embedding);
    }
    
    return embeddings;
  }

  /**
   * Check if the embedding model is available
   */
  async checkHealth(): Promise<{ available: boolean; model: string; message: string }> {
    try {
      const response = await fetch(`${this.ollamaBaseUrl}/api/tags`);
      
      if (!response.ok) {
        return {
          available: false,
          model: this.model,
          message: 'Ollama is not responding',
        };
      }

      const data = await response.json() as { models: Array<{ name: string }> };
      const models = data.models || [];
      const modelExists = models.some((m) => m.name === this.model);

      if (!modelExists) {
        return {
          available: false,
          model: this.model,
          message: `Embedding model ${this.model} not installed. Run: ollama pull ${this.model}`,
        };
      }

      return {
        available: true,
        model: this.model,
        message: 'Ready',
      };
    } catch {
      return {
        available: false,
        model: this.model,
        message: 'Cannot connect to Ollama',
      };
    }
  }
}

