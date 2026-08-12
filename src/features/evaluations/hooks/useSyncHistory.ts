'use client';

import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import { getEvaluationSyncLogs, runEvaluationSheetSync } from '@/services/evaluation.service';
import type { SyncHistoryEntry } from '../types';

// 동기화 실행 오류 코드별로 화면에서 안내해야 하는 추가 문구(백엔드 message에 없는 "어디로 가야 하는지")
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

// 동기화 실행 + 이력 상태 - 탭을 옮겨도 목록·최근 결과가 유지되도록 EvaluationsPageClient에서
// 한 번만 호출한다. 이력 목록은 "이력" 탭 렌더링과 무관하게 항상 페이지 진입 시 한 번 불러온다
export function useSyncHistory() {
   const { me } = useAuth();
   const [history, setHistory] = useState<SyncHistoryEntry[]>([]);
   const [isLoadingHistory, setIsLoadingHistory] = useState(true);
   const [historyError, setHistoryError] = useState(false);
   const [latestSync, setLatestSync] = useState<SyncHistoryEntry | null>(null);
   const [isSyncing, setIsSyncing] = useState(false);
   // 마운트 시점의 최초 조회와 runSync()가 동기화 후 다시 부르는 조회가 서로 경쟁할 수 있다(최초
   // 조회가 느려서 나중에 끝나면, 이미 최신인 목록을 그걸로 덮어써버림) - 요청마다 번호를 매겨서
   // 가장 마지막에 "시작한" 요청의 결과만 반영한다
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

      // 동기화 자체와 이력 재조회는 서로 다른 실패 원인이라 따로 처리한다 - 동기화가 성공한 뒤
      // 이력 재조회만 실패해도 "동기화에 실패했습니다"로 잘못 안내하면 안 된다
      let result;
      try {
         result = await runEvaluationSheetSync();
      } catch (err) {
         toast.error(getSyncErrorMessage(err));
         setIsSyncing(false);
         return;
      }

      // 방금 실행한 결과는 addedCount/updatedCount/skipped까지 다 갖고 있어 "방금 동기화" 카드에
      // 그대로 채워 보여준다(목록 API는 이 세부 항목을 안 주므로 이력 목록에는 이 값을 넣지 않음)
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

      // 변경이 없었으면(syncLogId === null) 백엔드도 이력을 안 만드니 목록을 다시 불러올 필요가 없다
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

   // 자신이 구글 시트를 수정했다고 다른 운영진에게 사이트 내 알림을 보내는 기능
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
