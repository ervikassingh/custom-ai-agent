import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { Document, SyncLog, SyncStatus, SyncType } from '../database/entities';
import { QdrantService, VectorPoint } from '../qdrant/qdrant.service';
import { EmbeddingService } from '../embedding/embedding.service';
import {
  chunkText,
  needsChunking,
  prepareTextForEmbedding,
} from './utils/chunker.util';

export interface SyncResult {
  success: boolean;
  type: SyncType;
  documentsSynced: number;
  chunksCreated: number;
  duration: number;
  error?: string;
}

@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);
  private isSyncing = false;

  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(SyncLog)
    private readonly syncLogRepository: Repository<SyncLog>,
    private readonly qdrantService: QdrantService,
    private readonly embeddingService: EmbeddingService,
  ) {}

  /**
   * Full sync - sync all documents from PostgreSQL to Qdrant
   */
  async fullSync(): Promise<SyncResult> {
    if (this.isSyncing) {
      this.logger.warn('Sync already in progress, skipping');
      return {
        success: false,
        type: SyncType.FULL,
        documentsSynced: 0,
        chunksCreated: 0,
        duration: 0,
        error: 'Sync already in progress',
      };
    }

    this.isSyncing = true;
    const startTime = Date.now();

    // Create sync log entry
    const syncLog = this.syncLogRepository.create({
      type: SyncType.FULL,
      status: SyncStatus.STARTED,
    });
    await this.syncLogRepository.save(syncLog);

    try {
      this.logger.log('Starting full sync...');

      // Get all documents
      const documents = await this.documentRepository.find();
      this.logger.log(`Found ${documents.length} documents to sync`);

      let totalChunks = 0;

      // Process each document
      for (const doc of documents) {
        const chunksCreated = await this.syncDocument(doc);
        totalChunks += chunksCreated;
      }

      // Update sync log
      syncLog.status = SyncStatus.COMPLETED;
      syncLog.documentsSynced = documents.length;
      syncLog.chunksCreated = totalChunks;
      syncLog.completedAt = new Date();
      await this.syncLogRepository.save(syncLog);

      const duration = Date.now() - startTime;
      this.logger.log(
        `Full sync completed: ${documents.length} documents, ${totalChunks} chunks in ${duration}ms`,
      );

      return {
        success: true,
        type: SyncType.FULL,
        documentsSynced: documents.length,
        chunksCreated: totalChunks,
        duration,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Full sync failed', error);

      // Update sync log with error
      syncLog.status = SyncStatus.FAILED;
      syncLog.errorMessage = errorMessage;
      syncLog.completedAt = new Date();
      await this.syncLogRepository.save(syncLog);

      return {
        success: false,
        type: SyncType.FULL,
        documentsSynced: 0,
        chunksCreated: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Incremental sync - only sync documents modified since last successful sync
   */
  async incrementalSync(): Promise<SyncResult> {
    if (this.isSyncing) {
      this.logger.warn('Sync already in progress, skipping');
      return {
        success: false,
        type: SyncType.INCREMENTAL,
        documentsSynced: 0,
        chunksCreated: 0,
        duration: 0,
        error: 'Sync already in progress',
      };
    }

    this.isSyncing = true;
    const startTime = Date.now();

    // Create sync log entry
    const syncLog = this.syncLogRepository.create({
      type: SyncType.INCREMENTAL,
      status: SyncStatus.STARTED,
    });
    await this.syncLogRepository.save(syncLog);

    try {
      // Get last successful sync time
      const lastSync = await this.getLastSuccessfulSync();
      const sinceDate = lastSync?.completedAt || new Date(0);

      this.logger.log(`Starting incremental sync since ${sinceDate.toISOString()}`);

      // Get documents modified since last sync
      const documents = await this.documentRepository.find({
        where: { updatedAt: MoreThan(sinceDate) },
      });

      this.logger.log(`Found ${documents.length} documents to sync`);

      let totalChunks = 0;

      // Process each document
      for (const doc of documents) {
        // Delete existing vectors for this document first
        await this.qdrantService.deleteByDocumentId(doc.id);
        const chunksCreated = await this.syncDocument(doc);
        totalChunks += chunksCreated;
      }

      // Update sync log
      syncLog.status = SyncStatus.COMPLETED;
      syncLog.documentsSynced = documents.length;
      syncLog.chunksCreated = totalChunks;
      syncLog.completedAt = new Date();
      await this.syncLogRepository.save(syncLog);

      const duration = Date.now() - startTime;
      this.logger.log(
        `Incremental sync completed: ${documents.length} documents, ${totalChunks} chunks in ${duration}ms`,
      );

      return {
        success: true,
        type: SyncType.INCREMENTAL,
        documentsSynced: documents.length,
        chunksCreated: totalChunks,
        duration,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Incremental sync failed', error);

      // Update sync log with error
      syncLog.status = SyncStatus.FAILED;
      syncLog.errorMessage = errorMessage;
      syncLog.completedAt = new Date();
      await this.syncLogRepository.save(syncLog);

      return {
        success: false,
        type: SyncType.INCREMENTAL,
        documentsSynced: 0,
        chunksCreated: 0,
        duration: Date.now() - startTime,
        error: errorMessage,
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync a single document to Qdrant
   */
  private async syncDocument(doc: Document): Promise<number> {
    const textToEmbed = prepareTextForEmbedding(doc.title, doc.content);
    const points: VectorPoint[] = [];

    if (needsChunking(textToEmbed)) {
      // Split into chunks for long documents
      const chunks = chunkText(textToEmbed);
      this.logger.debug(`Document ${doc.id} split into ${chunks.length} chunks`);

      for (const chunk of chunks) {
        const embedding = await this.embeddingService.generateEmbedding(chunk.text);
        points.push({
          id: `${doc.id}_chunk_${chunk.index}`,
          vector: embedding,
          payload: {
            document_id: doc.id,
            title: doc.title,
            category: doc.category,
            chunk_index: chunk.index,
            chunk_text: chunk.text,
            is_chunk: true,
          },
        });
      }
    } else {
      // Single embedding for short documents
      const embedding = await this.embeddingService.generateEmbedding(textToEmbed);
      points.push({
        id: doc.id,
        vector: embedding,
        payload: {
          document_id: doc.id,
          title: doc.title,
          category: doc.category,
          chunk_index: 0,
          chunk_text: textToEmbed,
          is_chunk: false,
        },
      });
    }

    await this.qdrantService.upsertPoints(points);
    return points.length;
  }

  /**
   * Get the last successful sync
   */
  async getLastSuccessfulSync(): Promise<SyncLog | null> {
    return this.syncLogRepository.findOne({
      where: { status: SyncStatus.COMPLETED },
      order: { completedAt: 'DESC' },
    });
  }

  /**
   * Get sync status
   */
  async getSyncStatus(): Promise<{
    isSyncing: boolean;
    lastSync: SyncLog | null;
    qdrantPointsCount: number;
    documentsCount: number;
  }> {
    const [lastSync, qdrantInfo, documentsCount] = await Promise.all([
      this.getLastSuccessfulSync(),
      this.qdrantService.getCollectionInfo(),
      this.documentRepository.count(),
    ]);

    return {
      isSyncing: this.isSyncing,
      lastSync,
      qdrantPointsCount: qdrantInfo.pointsCount,
      documentsCount,
    };
  }
}

