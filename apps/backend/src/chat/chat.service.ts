import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

interface OllamaModel {
  name: string;
  model: string;
  size: number;
  digest: string;
  modified_at: string;
}

interface OllamaTagsResponse {
  models: OllamaModel[];
}

export interface HealthStatus {
  status: 'online' | 'offline' | 'model_missing';
  model: string;
  message: string;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly ollamaBaseUrl: string;
  private readonly ollamaUrl: string;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.ollamaBaseUrl = this.configService.get<string>(
      'OLLAMA_BASE_URL',
      'http://localhost:11434',
    );
    this.model = this.configService.get<string>('OLLAMA_MODEL', 'llama3.2:1b');
    this.ollamaUrl = `${this.ollamaBaseUrl}/api/generate`;

    this.logger.log(`Configured Ollama URL: ${this.ollamaBaseUrl}`);
    this.logger.log(`Configured Model: ${this.model}`);
  }

  async generateResponse(message: string): Promise<string> {
    this.logger.log(`Generating response for: "${message.substring(0, 50)}..."`);

    try {
      const response = await fetch(this.ollamaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: message,
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error(`Ollama API error: ${response.status} - ${errorText}`);
        throw new Error(`Ollama API returned ${response.status}: ${errorText}`);
      }

      const data = (await response.json()) as OllamaResponse;
      this.logger.log('Response generated successfully');
      return data.response;
    } catch (error) {
      if (error instanceof TypeError && error.message.includes('fetch')) {
        this.logger.error('Cannot connect to Ollama. Is it running?');
        throw new Error(
          'Cannot connect to Ollama. Please ensure Ollama is running with: ollama serve',
        );
      }
      throw error;
    }
  }

  async checkHealth(): Promise<HealthStatus> {
    this.logger.log('Checking Ollama health status');

    try {
      // First check if Ollama is running
      const tagsResponse = await fetch(`${this.ollamaBaseUrl}/api/tags`);

      if (!tagsResponse.ok) {
        this.logger.warn('Ollama is not responding properly');
        return {
          status: 'offline',
          model: this.model,
          message: 'Ollama server is not responding',
        };
      }

      const tagsData = (await tagsResponse.json()) as OllamaTagsResponse;
      const models = tagsData.models || [];

      // Check if our model is available
      const modelExists = models.some(
        (m) => m.name === this.model || m.model === this.model,
      );

      if (!modelExists) {
        this.logger.warn(`Model ${this.model} is not available`);
        return {
          status: 'model_missing',
          model: this.model,
          message: `Model ${this.model} is not installed. Run: ollama pull ${this.model}`,
        };
      }

      this.logger.log('Ollama and model are ready');
      return {
        status: 'online',
        model: this.model,
        message: 'Ready',
      };
    } catch (error) {
      this.logger.error('Cannot connect to Ollama:', error);
      return {
        status: 'offline',
        model: this.model,
        message: 'Cannot connect to Ollama. Is it running?',
      };
    }
  }
}

