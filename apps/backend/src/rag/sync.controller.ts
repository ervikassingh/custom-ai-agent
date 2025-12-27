import { Controller, Post, Get, Body, Logger } from '@nestjs/common';
import { SyncService, SyncResult } from './sync.service';
import { RagService } from './rag.service';

interface SearchDto {
  query: string;
  limit?: number;
  category?: string;
}

@Controller('rag')
export class SyncController {
  private readonly logger = new Logger(SyncController.name);

  constructor(
    private readonly syncService: SyncService,
    private readonly ragService: RagService,
  ) {}

  /**
   * Trigger full sync
   */
  @Post('sync')
  async fullSync(): Promise<SyncResult> {
    this.logger.log('Manual full sync triggered');
    return this.syncService.fullSync();
  }

  /**
   * Trigger incremental sync
   */
  @Post('sync/incremental')
  async incrementalSync(): Promise<SyncResult> {
    this.logger.log('Manual incremental sync triggered');
    return this.syncService.incrementalSync();
  }

  /**
   * Get sync status
   */
  @Get('sync/status')
  async getSyncStatus() {
    return this.syncService.getSyncStatus();
  }

  /**
   * Test RAG search (debug endpoint)
   */
  @Post('search')
  async search(@Body() body: SearchDto) {
    const { query, limit = 5, category } = body;
    this.logger.log(`RAG search: "${query.substring(0, 50)}..."`);
    
    const contexts = await this.ragService.searchRelevantContext(
      query,
      limit,
      category,
    );

    return {
      query,
      resultsCount: contexts.length,
      results: contexts,
    };
  }

  /**
   * Debug: Raw vector search
   */
  @Post('search/debug')
  async debugSearch(@Body() body: SearchDto) {
    const { query, limit = 5 } = body;
    return this.ragService.debugSearch(query, limit);
  }
}
