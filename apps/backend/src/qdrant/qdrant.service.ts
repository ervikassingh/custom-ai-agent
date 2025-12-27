import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';

export interface VectorPoint {
  id: string;
  vector: number[];
  payload: Record<string, unknown>;
}

export interface SearchResult {
  id: string;
  score: number;
  payload: Record<string, unknown>;
}

@Injectable()
export class QdrantService implements OnModuleInit {
  private readonly logger = new Logger(QdrantService.name);
  private readonly client: QdrantClient;
  private readonly collectionName: string;
  private readonly vectorSize = 768; // nomic-embed-text dimension

  constructor(private readonly configService: ConfigService) {
    const url = this.configService.get<string>('QDRANT_URL', 'http://localhost:6333');
    this.collectionName = this.configService.get<string>('QDRANT_COLLECTION', 'documents');
    
    this.client = new QdrantClient({ url });
    this.logger.log(`Qdrant client configured for ${url}`);
  }

  async onModuleInit(): Promise<void> {
    await this.ensureCollection();
  }

  /**
   * Create collection if it doesn't exist
   */
  async ensureCollection(): Promise<void> {
    try {
      const collections = await this.client.getCollections();
      const exists = collections.collections.some(
        (c) => c.name === this.collectionName,
      );

      if (!exists) {
        await this.client.createCollection(this.collectionName, {
          vectors: {
            size: this.vectorSize,
            distance: 'Cosine',
          },
        });
        this.logger.log(`Created collection: ${this.collectionName}`);
      } else {
        this.logger.log(`Collection ${this.collectionName} already exists`);
      }
    } catch (error) {
      this.logger.error('Failed to ensure collection exists', error);
      throw error;
    }
  }

  /**
   * Upsert vectors with payloads
   */
  async upsertPoints(points: VectorPoint[]): Promise<void> {
    if (points.length === 0) return;

    try {
      await this.client.upsert(this.collectionName, {
        points: points.map((p) => ({
          id: p.id,
          vector: p.vector,
          payload: p.payload,
        })),
      });
      this.logger.debug(`Upserted ${points.length} points to Qdrant`);
    } catch (error) {
      this.logger.error('Failed to upsert points', error);
      throw error;
    }
  }

  /**
   * Search for similar vectors
   */
  async search(
    vector: number[],
    limit = 5,
    filter?: Record<string, unknown>,
  ): Promise<SearchResult[]> {
    try {
      const results = await this.client.search(this.collectionName, {
        vector,
        limit,
        with_payload: true,
        filter: filter as never,
      });

      return results.map((r) => ({
        id: r.id as string,
        score: r.score,
        payload: r.payload as Record<string, unknown>,
      }));
    } catch (error) {
      this.logger.error('Failed to search vectors', error);
      throw error;
    }
  }

  /**
   * Delete points by IDs
   */
  async deletePoints(ids: string[]): Promise<void> {
    if (ids.length === 0) return;

    try {
      await this.client.delete(this.collectionName, {
        points: ids,
      });
      this.logger.debug(`Deleted ${ids.length} points from Qdrant`);
    } catch (error) {
      this.logger.error('Failed to delete points', error);
      throw error;
    }
  }

  /**
   * Delete points by document ID (removes all chunks of a document)
   */
  async deleteByDocumentId(documentId: string): Promise<void> {
    try {
      await this.client.delete(this.collectionName, {
        filter: {
          must: [
            {
              key: 'document_id',
              match: { value: documentId },
            },
          ],
        },
      });
      this.logger.debug(`Deleted all points for document ${documentId}`);
    } catch (error) {
      this.logger.error(`Failed to delete points for document ${documentId}`, error);
      throw error;
    }
  }

  /**
   * Get collection info
   */
  async getCollectionInfo(): Promise<{ pointsCount: number }> {
    try {
      const info = await this.client.getCollection(this.collectionName);
      return {
        pointsCount: info.points_count ?? 0,
      };
    } catch (error) {
      this.logger.error('Failed to get collection info', error);
      throw error;
    }
  }
}

