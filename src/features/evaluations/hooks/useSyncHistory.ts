'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import { getEvaluationSyncLogs, runEvaluationSheetSync } from '@/services/evaluation.service';
import type { SyncHistoryEntry } from '../types';

// 동기화 실행 오류 코드별 추가 문구
const SYNC_ERROR_HINTS: Record<string, string> = {
   EVALUATION_001: ' [연동 설정] 탭에서 시트를 먼저 연동해주세요.',
   EVALUATION_002: ' [연동 설정] 탭에서 컬럼 매핑을 다시 확인해주세요.',
   SHEET_002: ' 서비스 계정에 시트가 공유되어 있는지 확인해주세요.',
   SHEET_004: ' 잠시 후 다시 시도해주세요.',
};

function getSyncErrorMessage(err: unknown) {
   if (err instanceof ApiError) {
      return err.message + (SYNC_ERROR_HINTS[err.code] ?? '');
   }
   return '동기화 실행 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
}

function toHistoryEntry(log: {
   syncLogId: number;
   executedByName: string | null;
   changedCount: number;
   diffSummary: string;
   syncedAt: string;
}): SyncHistoryEntry {
   return {
      id: `sync-${log.syncLogId}`,
      syncLogId: log.syncLogId,
      syncedAt: log.syncedAt,
      executedByName: log.executedByName ?? '알 수 없음',
      changedCount: log.changedCount,
      diffSummary: log.diffSummary,
   };
}

export function useSyncHistory() {
   const { me } = useAuth();
   const [history, setHistory] = useState<SyncHistoryEntry[]>([]);
   const [isLoadingHistory, setIsLoadingHistory] = useState(true);
   const [historyError, setHistoryError] = useState(false);
   const [latestSync, setLatestSync] = useState<SyncHistoryEntry | null>(null);
   const [isSyncing, setIsSyncing] = useState(false);
   const latestHistoryRequestId = useRef(0);

   useEffect(() => {
      let isMounted = true;
      const requestId = ++latestHistoryRequestId.current;
      getEvaluationSyncLogs()
         .then((logs) => {
            if (isMounted && requestId === latestHistoryRequestId.current) {
               setHistory(logs.map(toHistoryEntry));
            }
         })
         .catch(() => {
            if (isMounted && requestId === latestHistoryRequestId.current) setHistoryError(true);
         })
         .finally(() => {
            if (isMounted) setIsLoadingHistory(false);
         });
      return () => {
         isMounted = false;
      };
   }, []);

   const runSync = async () => {
      if (isSyncing) return;
      setIsSyncing(true);

      let result;
      try {
         result = await runEvaluationSheetSync();
      } catch (err) {
         toast.error(getSyncErrorMessage(err));
         setIsSyncing(false);
         return;
      }

      setLatestSync({
         id: result.syncLogId !== null ? `sync-${result.syncLogId}` : `sync-empty`,
         syncLogId: result.syncLogId,
         syncedAt: new Date().toISOString(),
         executedByName: me?.name ?? '알 수 없음',
         addedCount: result.addedCount,
         updatedCount: result.updatedCount,
         changedCount: result.changedCount,
         diffSummary: result.diffSummary,
         skipped: result.skipped,
      });

      if (result.syncLogId === null) {
         setIsSyncing(false);
         return;
      }

      const requestId = ++latestHistoryRequestId.current;
      try {
         const logs = await getEvaluationSyncLogs();
         if (requestId === latestHistoryRequestId.current) {
            setHistory(logs.map(toHistoryEntry));
            setHistoryError(false);
         }
      } catch {
         if (requestId === latestHistoryRequestId.current) setHistoryError(true);
      } finally {
         setIsSyncing(false);
      }
   };

   // 자신이 구글 시트를 수정했다고 알림을 보내는 기능
   const notifyStaff = async () => {
      toast.success('다른 운영진에게 수정 완료 알림을 보냈습니다.');
   };

   return {
      history,
      isLoadingHistory,
      historyError,
      latestSync,
      isSyncing,
      runSync,
      notifyStaff,
   };
}
