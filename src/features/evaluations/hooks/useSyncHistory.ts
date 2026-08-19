'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import {
   getEvaluationSyncLogs,
   notifyEvaluationSyncResult,
   runEvaluationSheetSync,
   type EvaluationSyncLogSummary,
   type EvaluationSyncSummaryCard,
} from '@/services/evaluation.service';
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
   summaries: EvaluationSyncSummaryCard[];
   syncedAt: string;
}): SyncHistoryEntry {
   return {
      id: `sync-${log.syncLogId}`,
      syncLogId: log.syncLogId,
      syncedAt: log.syncedAt,
      executedByName: log.executedByName ?? '시스템',
      changedCount: log.changedCount,
      summaries: log.summaries,
   };
}

export function useSyncHistory(initial?: EvaluationSyncLogSummary[]) {
   const { me } = useAuth();
   const [history, setHistory] = useState<SyncHistoryEntry[]>(
      () => initial?.map(toHistoryEntry) ?? [],
   );
   const [isLoadingHistory, setIsLoadingHistory] = useState(!initial);
   const [historyError, setHistoryError] = useState(false);
   const [latestSync, setLatestSync] = useState<SyncHistoryEntry | null>(null);
   const [isSyncing, setIsSyncing] = useState(false);
   const [isNotifying, setIsNotifying] = useState(false);
   const [notifiedSyncLogId, setNotifiedSyncLogId] = useState<number | null>(null);
   const latestHistoryRequestId = useRef(0);
   // isSyncing/isNotifying(state)만으로는 연타를 못 막는다 - state 반영 전(같은 tick)에 두 번째
   // 클릭이 새어나갈 수 있어서, 그 사이에도 항상 최신값인 ref로 동기적으로 먼저 막는다
   const isSyncingRef = useRef(false);
   const isNotifyingRef = useRef(false);

   // initial이 있어도(프리페치 성공) 마운트 시 한 번은 항상 다시 조회한다 - isLoadingHistory를
   // 안 건드리므로(이미 initial 유무로 초기값이 정해짐) 스켈레톤 없이 조용히 갱신된다
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
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;
      setIsSyncing(true);

      try {
         let result;
         try {
            result = await runEvaluationSheetSync();
         } catch (err) {
            toast.error(getSyncErrorMessage(err));
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
            summaries: result.summaries,
            skipped: result.skipped,
         });

         if (result.syncLogId === null) {
            if (result.skipped.length === 0) {
               toast.warning('시트 변경 사항이 없습니다.');
            }
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
         }
      } finally {
         isSyncingRef.current = false;
         setIsSyncing(false);
      }
   };

   const notifyStaff = async () => {
      if (!latestSync || latestSync.syncLogId === null || isNotifyingRef.current) return;
      const { syncLogId } = latestSync;
      if (notifiedSyncLogId === syncLogId) {
         toast.warning('이미 알림 발송이 완료되었습니다.');
         return;
      }
      isNotifyingRef.current = true;
      setIsNotifying(true);
      try {
         await notifyEvaluationSyncResult(syncLogId);
         setNotifiedSyncLogId(syncLogId);
         toast.success('수정 완료 알림 발송이 완료되었습니다.');
      } catch (err) {
         toast.error(
            err instanceof ApiError
               ? err.message
               : '알림 전송 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
         );
      } finally {
         isNotifyingRef.current = false;
         setIsNotifying(false);
      }
   };

   return {
      history,
      isLoadingHistory,
      historyError,
      latestSync,
      isSyncing,
      runSync,
      isNotifying,
      notifyStaff,
   };
}
