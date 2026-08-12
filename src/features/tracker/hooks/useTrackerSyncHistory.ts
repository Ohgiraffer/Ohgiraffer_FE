'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import {
   getAttendanceSheetSyncLogs,
   syncAttendanceSheet,
   type AttendanceSheetSyncLogEntry,
} from '@/services/attendance.service';

export type { AttendanceSheetSyncLogEntry as TrackerSyncHistoryEntry };

// 동기화 실행 + 이력 조회 - isConnected가 true일 때만 이력을 불러온다(연동 전에는 호출할 필요가 없음)
export function useTrackerSyncHistory(isConnected: boolean) {
   const [history, setHistory] = useState<AttendanceSheetSyncLogEntry[]>([]);
   const [isLoadingHistory, setIsLoadingHistory] = useState(true);
   const [historyError, setHistoryError] = useState(false);
   const [isSyncing, setIsSyncing] = useState(false);

   useEffect(() => {
      // 연동 전에는 이 훅을 쓰는 화면에서 이력 섹션 자체를 렌더링하지 않으므로, isLoadingHistory
      // 초기값(true)을 그대로 둬도 문제없다 - 연동되는 순간 이 effect가 다시 돌며 fetch를 시작한다
      if (!isConnected) return;
      let isMounted = true;
      getAttendanceSheetSyncLogs()
         .then((logs) => {
            if (isMounted) setHistory(logs);
         })
         .catch(() => {
            if (isMounted) setHistoryError(true);
         })
         .finally(() => {
            if (isMounted) setIsLoadingHistory(false);
         });
      return () => {
         isMounted = false;
      };
   }, [isConnected]);

   const runSync = useCallback(async () => {
      setIsSyncing(true);
      // 동기화 자체와 이력 재조회는 서로 다른 실패 원인이라 따로 처리한다 - 동기화가 성공한 뒤
      // 이력 재조회만 실패해도 "동기화에 실패했습니다"로 잘못 안내하면 안 된다
      let result;
      try {
         result = await syncAttendanceSheet();
      } catch (err) {
         toast.error(
            err instanceof ApiError ? err.message : '동기화에 실패했습니다. 잠시 후 다시 시도해주세요.',
         );
         setIsSyncing(false);
         return;
      }

      if (result.failedCount > 0) {
         toast.error(`동기화 완료 · 성공 ${result.successCount}건 / 실패 ${result.failedCount}건`);
      } else {
         toast.success(`동기화 완료 · 변동 ${result.successCount}건 반영`);
      }

      try {
         const logs = await getAttendanceSheetSyncLogs();
         setHistory(logs);
         setHistoryError(false);
      } catch {
         setHistoryError(true);
      } finally {
         setIsSyncing(false);
      }
   }, []);

   return { history, isLoadingHistory, historyError, isSyncing, runSync };
}
