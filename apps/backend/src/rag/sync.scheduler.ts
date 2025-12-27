import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SyncService } from './sync.service';

@Injectable()
export class SyncScheduler {
  private readonly logger = new Logger(SyncScheduler.name);

  constructor(private readonly syncService: SyncService) {}

  /**
   * Run incremental sync every hour
   */
  @Cron(CronExpression.EVERY_HOUR)
  async handleHourlySync(): Promise<void> {
    this.logger.log('Running scheduled hourly incremental sync...');
    
    const result = await this.syncService.incrementalSync();
    
    if (result.success) {
      this.logger.log(
        `Scheduled sync completed: ${result.documentsSynced} documents, ${result.chunksCreated} chunks`,
      );
    } else {
      this.logger.error(`Scheduled sync failed: ${result.error}`);
    }
  }
}

