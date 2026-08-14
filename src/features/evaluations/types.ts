import type { EvaluationSyncSkippedRow } from '@/services/evaluation.service';

export type SyncHistoryEntry = {
   id: string;
   syncLogId: number | null;
   syncedAt: string; // ISO
   executedByName: string;
   changedCount: number;
   diffSummary: string;
   addedCount?: number;
   updatedCount?: number;
   skipped?: EvaluationSyncSkippedRow[];
};
