import type { EvaluationSyncSkippedRow, EvaluationSyncSummaryCard } from '@/services/evaluation.service';

export type SyncHistoryEntry = {
   id: string;
   syncLogId: number | null;
   syncedAt: string; // ISO
   executedByName: string;
   changedCount: number;
   summaries: EvaluationSyncSummaryCard[];
   addedCount?: number;
   updatedCount?: number;
   skipped?: EvaluationSyncSkippedRow[];
};
