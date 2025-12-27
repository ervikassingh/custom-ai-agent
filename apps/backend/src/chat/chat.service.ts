import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatMessage } from './dto/chat.dto';
import { RagService, RetrievedContext } from '../rag/rag.service';

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

export interface ChatResponse {
  response: string;
  ragContexts?: RetrievedContext[];
  ragEnabled: boolean;
}

// Default system prompt for portfolio AI assistant
const DEFAULT_SYSTEM_PROMPT = `You are a personal AI assistant for a website. Your role is to help visitors learn about the website.

Guidelines:
- Be friendly, professional, and helpful
- Answer questions based on the context/information provided to you
- If you don't have specific information about something, politely say so and suggest the visitor check other sections of the website or reach out directly
- Keep responses concise but informative
- You can engage in light conversation but always guide back to relevant website topics
- Never make up information about the website

When no specific context is provided, introduce yourself and offer to help visitors learn more about the website.`;

// RAG-enhanced system prompt
const DEFAULT_RAG_SYSTEM_PROMPT = `You are a personal AI assistant for a website. Your role is to help visitors learn about the website using the provided context.

Guidelines:
- Be friendly, professional, and helpful
- PRIORITIZE answering based on the provided context/documents but do not mention it to the user
- If the context contains relevant information, use it to form your response
- If the context doesn't contain relevant information for the question, say so and provide a general helpful response
- Keep responses concise but informative
- Cite the source when using specific information from the context
- Never make up information - only use what's in the provided context

When context is provided, use it to give accurate, specific answers. When no context is available, offer to help in a general way.`;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly ollamaBaseUrl: string;
  private readonly ollamaUrl: string;
  private readonly model: string;
  private readonly systemPrompt: string;
  private readonly ragSystemPrompt: string;
  private readonly ragEnabled: boolean;

  constructor(
    private readonly configService: ConfigService,
    @Optional() private readonly ragService?: RagService,
  ) {
    this.ollamaBaseUrl = this.configService.get<string>(
      'OLLAMA_BASE_URL',
      'http://localhost:11434',
    );
    this.model = this.configService.get<string>('OLLAMA_MODEL', 'llama3.2:1b');
    this.systemPrompt = this.configService.get<string>(
      'SYSTEM_PROMPT',
      DEFAULT_SYSTEM_PROMPT,
    );
    this.ragSystemPrompt = this.configService.get<string>(
      'RAG_SYSTEM_PROMPT',
      DEFAULT_RAG_SYSTEM_PROMPT,
    );
    this.ollamaUrl = `${this.ollamaBaseUrl}/api/generate`;
    this.ragEnabled = !!this.ragService;

    this.logger.log(`Configured Ollama URL: ${this.ollamaBaseUrl}`);
    this.logger.log(`Configured Model: ${this.model}`);
    this.logger.log(`RAG enabled: ${this.ragEnabled}`);
    this.logger.log(`System prompt configured (${this.systemPrompt.length} chars)`);
    this.logger.log(`RAG system prompt configured (${this.ragSystemPrompt.length} chars)`);
  }

  async generateResponse(
    message: string,
    history: ChatMessage[] = [],
  ): Promise<string> {
    const result = await this.generateResponseWithRAG(message, history);
    return result.response;
  }

  /**
   * Generate response with RAG context
   */
  async generateResponseWithRAG(
    message: string,
    history: ChatMessage[] = [],
  ): Promise<ChatResponse> {
    this.logger.log(
      `Generating response for: "${message.substring(0, 50)}..." (${history.length} history messages)`,
    );

    let prompt: string;
    let systemPrompt: string;
    let ragContexts: RetrievedContext[] = [];

    // Try to get RAG context if available
    if (this.ragService) {
      try {
        const ragResult = await this.ragService.getAugmentedPrompt(message);
        ragContexts = ragResult.contexts;

        if (ragContexts.length > 0) {
          // Use RAG-augmented prompt
          prompt = this.buildPromptWithHistory(ragResult.prompt, history);
          systemPrompt = this.ragSystemPrompt;
          this.logger.log(`RAG found ${ragContexts.length} relevant contexts`);
        } else {
          // No RAG context found, use regular prompt
          prompt = this.buildPromptWithHistory(message, history);
          systemPrompt = this.systemPrompt;
          this.logger.log('No RAG context found, using default prompt');
        }
      } catch (error) {
        this.logger.warn('RAG search failed, falling back to regular response', error);
        prompt = this.buildPromptWithHistory(message, history);
        systemPrompt = this.systemPrompt;
      }
    } else {
      // RAG not available
      prompt = this.buildPromptWithHistory(message, history);
      systemPrompt = this.systemPrompt;
    }

    try {
      const response = await fetch(this.ollamaUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt,
          system: systemPrompt,
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
      
      return {
        response: data.response,
        ragContexts: ragContexts.length > 0 ? ragContexts : undefined,
        ragEnabled: this.ragEnabled,
      };
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

  /**
   * Build a prompt that includes conversation history for context
   */
  private buildPromptWithHistory(
    currentMessage: string,
    history: ChatMessage[],
  ): string {
    if (history.length === 0) {
      return currentMessage;
    }

    // Format history as a conversation
    const historyText = history
      .map((msg) => {
        const role = msg.role === 'user' ? 'User' : 'Assistant';
        return `${role}: ${msg.content}`;
      })
      .join('\n');

    // Combine history with current message
    return `Previous conversation:\n${historyText}\n\nCurrent question/request: ${currentMessage}`;
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
