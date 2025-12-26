import { Body, Controller, Post, Get, HttpException, HttpStatus } from '@nestjs/common';
import { ChatService, HealthStatus } from './chat.service';
import { ChatRequestDto, ChatResponseDto } from './dto/chat.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('health')
  async health(): Promise<HealthStatus> {
    return this.chatService.checkHealth();
  }

  @Post()
  async chat(@Body() chatRequest: ChatRequestDto): Promise<ChatResponseDto> {
    try {
      const response = await this.chatService.generateResponse(chatRequest.message);
      return { response };
    } catch (error) {
      if (error instanceof Error) {
        throw new HttpException(
          `Failed to generate response: ${error.message}`,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
      throw new HttpException(
        'Failed to generate response',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

