'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  WrenchSolidIcon,
  CloseIcon,
  RefreshIcon,
  SpinnerIcon,
  FullSyncIcon,
  IncrementalSyncIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
} from './Icons';
import { API_URL } from '../config';

interface SyncLog {
  id: string;
  type: 'FULL' | 'INCREMENTAL';
  status: 'STARTED' | 'COMPLETED' | 'FAILED';
  documentsSynced: number;
  chunksCreated: number;
  completedAt: string | null;
  errorMessage: string | null;
}

interface SyncStatus {
  isSyncing: boolean;
  lastSync: SyncLog | null;
  qdrantPointsCount: number;
  documentsCount: number;
}

interface SyncResult {
  success: boolean;
  type: 'FULL' | 'INCREMENTAL';
  documentsSynced: number;
  chunksCreated: number;
  duration: number;
  error?: string;
}

interface ToolsPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ToolsPanel({ isOpen, onClose }: ToolsPanelProps) {
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [isSyncing, setIsSyncing] = useState<'full' | 'incremental' | null>(null);
  const [syncResult, setSyncResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSyncStatus = useCallback(async () => {
    setIsLoadingStatus(true);
    setError(null);
    try {
      const response = await fetch(`${API_URL}/rag/sync/status`);
      if (!response.ok) throw new Error('Failed to fetch sync status');
      const data = await response.json();
      setSyncStatus(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch status');
    } finally {
      setIsLoadingStatus(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchSyncStatus();
    }
  }, [isOpen, fetchSyncStatus]);

  const triggerSync = async (type: 'full' | 'incremental') => {
    setIsSyncing(type);
    setSyncResult(null);
    setError(null);

    try {
      const endpoint = type === 'full' ? '/rag/sync' : '/rag/sync/incremental';
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `Sync failed: ${response.status}`);
      }

      const result = await response.json();
      setSyncResult(result);
      
      // Refresh status after sync
      await fetchSyncStatus();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sync failed');
    } finally {
      setIsSyncing(null);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-[fade-in_0.2s_ease-out]"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-[var(--background)] border-l border-[var(--border)] z-50 shadow-2xl animate-[slide-in_0.3s_ease-out] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--border)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/25">
              <WrenchSolidIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[var(--foreground)] tracking-tight">
                Tools
              </h2>
              <p className="text-xs text-[var(--muted)]">RAG sync management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--muted)] hover:text-[var(--foreground)] hover:bg-[var(--surface)] transition-all duration-200"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Status Card */}
          <div className="bg-[var(--surface)] rounded-2xl p-4 border border-[var(--border-subtle)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-[var(--foreground)]">Sync Status</h3>
              <button
                onClick={fetchSyncStatus}
                disabled={isLoadingStatus}
                className="text-xs text-[var(--muted)] hover:text-[var(--foreground)] flex items-center gap-1.5 transition-colors"
              >
                <RefreshIcon className={`w-3.5 h-3.5 ${isLoadingStatus ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {isLoadingStatus && !syncStatus ? (
              <div className="flex items-center justify-center py-8">
                <SpinnerIcon className="w-6 h-6 animate-spin text-[var(--muted)]" />
              </div>
            ) : syncStatus ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[var(--background)] rounded-xl p-3 border border-[var(--border-subtle)]">
                    <div className="text-xs text-[var(--muted)] mb-1">Documents</div>
                    <div className="text-lg font-semibold text-[var(--foreground)] font-mono">
                      {syncStatus.documentsCount}
                    </div>
                  </div>
                  <div className="bg-[var(--background)] rounded-xl p-3 border border-[var(--border-subtle)]">
                    <div className="text-xs text-[var(--muted)] mb-1">Vectors</div>
                    <div className="text-lg font-semibold text-[var(--foreground)] font-mono">
                      {syncStatus.qdrantPointsCount}
                    </div>
                  </div>
                </div>

                <div className="bg-[var(--background)] rounded-xl p-3 border border-[var(--border-subtle)]">
                  <div className="text-xs text-[var(--muted)] mb-2">Last Sync</div>
                  {syncStatus.lastSync ? (
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium ${
                            syncStatus.lastSync.status === 'COMPLETED'
                              ? 'bg-emerald-500/15 text-emerald-500'
                              : syncStatus.lastSync.status === 'FAILED'
                              ? 'bg-red-500/15 text-red-500'
                              : 'bg-blue-500/15 text-blue-500'
                          }`}
                        >
                          {syncStatus.lastSync.status}
                        </span>
                        <span className="text-[10px] text-[var(--muted)] uppercase tracking-wider">
                          {syncStatus.lastSync.type}
                        </span>
                      </div>
                      <div className="text-sm text-[var(--foreground)]">
                        {formatDate(syncStatus.lastSync.completedAt)}
                      </div>
                      <div className="text-xs text-[var(--muted)]">
                        {syncStatus.lastSync.documentsSynced} docs · {syncStatus.lastSync.chunksCreated} chunks
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-[var(--muted)]">No sync history</div>
                  )}
                </div>

                {syncStatus.isSyncing && (
                  <div className="flex items-center gap-2 text-sm text-blue-500 bg-blue-500/10 rounded-xl px-3 py-2">
                    <SpinnerIcon className="w-4 h-4 animate-spin" />
                    Sync in progress...
                  </div>
                )}
              </div>
            ) : error ? (
              <div className="text-sm text-red-500 bg-red-500/10 rounded-xl px-3 py-2">{error}</div>
            ) : null}
          </div>

          {/* Sync Actions */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-[var(--foreground)]">Sync Actions</h3>

            {/* Full Sync */}
            <button
              onClick={() => triggerSync('full')}
              disabled={isSyncing !== null || syncStatus?.isSyncing}
              className="w-full bg-[var(--surface)] hover:bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-xl p-4 text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-purple-500/20 group-hover:shadow-purple-500/30 transition-shadow">
                  {isSyncing === 'full' ? (
                    <SpinnerIcon className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <FullSyncIcon className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[var(--foreground)] text-sm">Full Sync</div>
                  <div className="text-xs text-[var(--muted)] mt-0.5">
                    Re-sync all documents from PostgreSQL to Qdrant. Use for initial setup or rebuilding vectors.
                  </div>
                </div>
              </div>
            </button>

            {/* Incremental Sync */}
            <button
              onClick={() => triggerSync('incremental')}
              disabled={isSyncing !== null || syncStatus?.isSyncing}
              className="w-full bg-[var(--surface)] hover:bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-xl p-4 text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20 group-hover:shadow-blue-500/30 transition-shadow">
                  {isSyncing === 'incremental' ? (
                    <SpinnerIcon className="w-5 h-5 text-white animate-spin" />
                  ) : (
                    <IncrementalSyncIcon className="w-5 h-5 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[var(--foreground)] text-sm">Incremental Sync</div>
                  <div className="text-xs text-[var(--muted)] mt-0.5">
                    Only sync documents modified since last sync. Faster and runs automatically every hour.
                  </div>
                </div>
              </div>
            </button>
          </div>

          {/* Sync Result */}
          {syncResult && (
            <div
              className={`rounded-xl p-4 border animate-[fade-in_0.2s_ease-out] ${
                syncResult.success
                  ? 'bg-emerald-500/10 border-emerald-500/20'
                  : 'bg-red-500/10 border-red-500/20'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {syncResult.success ? (
                  <CheckCircleIcon className="w-5 h-5 text-emerald-500" />
                ) : (
                  <ExclamationCircleIcon className="w-5 h-5 text-red-500" />
                )}
                <span className={`font-medium text-sm ${syncResult.success ? 'text-emerald-500' : 'text-red-500'}`}>
                  {syncResult.success ? 'Sync Completed' : 'Sync Failed'}
                </span>
              </div>
              {syncResult.success ? (
                <div className="text-xs text-[var(--muted)] space-y-1">
                  <div>Type: {syncResult.type}</div>
                  <div>Documents synced: {syncResult.documentsSynced}</div>
                  <div>Chunks created: {syncResult.chunksCreated}</div>
                  <div>Duration: {syncResult.duration}ms</div>
                </div>
              ) : (
                <div className="text-xs text-red-400">{syncResult.error}</div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[var(--border)] bg-[var(--surface)]">
          <p className="text-[10px] text-[var(--muted)] text-center">
            Incremental sync runs automatically every hour via cron
          </p>
        </div>
      </div>
    </>
  );
}
