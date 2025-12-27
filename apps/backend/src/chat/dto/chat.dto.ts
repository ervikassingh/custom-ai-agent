export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export class ChatRequestDto {
  message!: string;
  history?: ChatMessage[];
}

export class ChatResponseDto {
  response!: string;
}
