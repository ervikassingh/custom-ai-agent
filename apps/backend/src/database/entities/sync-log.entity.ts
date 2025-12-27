import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

export enum SyncStatus {
  STARTED = 'started',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export enum SyncType {
  FULL = 'full',
  INCREMENTAL = 'incremental',
}

@Entity('sync_logs')
export class SyncLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'enum', enum: SyncType })
  type!: SyncType;

  @Column({ type: 'enum', enum: SyncStatus })
  status!: SyncStatus;

  @Column({ name: 'documents_synced', type: 'int', default: 0 })
  documentsSynced!: number;

  @Column({ name: 'chunks_created', type: 'int', default: 0 })
  chunksCreated!: number;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage!: string;

  @CreateDateColumn({ name: 'started_at' })
  startedAt!: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt!: Date;
}
