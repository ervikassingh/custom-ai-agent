import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '../database/database.module';
import { QdrantModule } from '../qdrant/qdrant.module';
import { EmbeddingModule } from '../embedding/embedding.module';
import { RagService } from './rag.service';
import { SyncService } from './sync.service';
import { SyncController } from './sync.controller';
import { SyncScheduler } from './sync.scheduler';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DatabaseModule,
    QdrantModule,
    EmbeddingModule,
  ],
  controllers: [SyncController],
  providers: [RagService, SyncService, SyncScheduler],
  exports: [RagService, SyncService],
})
export class RagModule {}

