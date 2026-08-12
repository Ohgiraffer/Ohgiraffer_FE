'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';

export interface TrackerSyncHistoryEntry {
   id: string;
   syncedAt: string; // ISO
   executedByName: string;
   processedCount: number;
   result: 'SUCCESS' | 'FAILURE';
}

const MOCK_HISTORY: TrackerSyncHistoryEntry[] = [
   { id: 'sync-1', syncedAt: '2025-07-30T09:00:00', executedByName: '이매니저', processedCount: 24, result: 'SUCCESS' },
   { id: 'sync-2', syncedAt: '2025-07-29T09:00:00', executedByName: '이매니저', processedCount: 22, result: 'SUCCESS' },
   { id: 'sync-3', syncedAt: '2025-07-28T09:00:00', executedByName: '이매니저', processedCount: 23, result: 'SUCCESS' },
   { id: 'sync-4', syncedAt: '2025-07-25T09:01:00', executedByName: '이매니저', processedCount: 0, result: 'FAILURE' },
];

// 동기화 실행 + 이력 상태 - 탭을 옮겨도 목록이 유지되도록 ManagerTrackerBoard에서 한 번만 호출한다
// TODO: 실제 동기화 실행/이력 조회 API가 나오면 tracker.service.ts 호출로 교체
export function useTrackerSyncHistory() {
   const { me } = useAuth();
   const [history, setHistory] = useState<TrackerSyncHistoryEntry[]>(MOCK_HISTORY);
   const [isSyncing, setIsSyncing] = useState(false);

   const runSync = async () => {
      setIsSyncing(true);
      try {
         await new Promise((resolve) => setTimeout(resolve, 600));
         const entry: TrackerSyncHistoryEntry = {
            id: `sync-${Date.now()}`,
            syncedAt: new Date().toISOString(),
            executedByName: me?.name ?? '알 수 없음',
            processedCount: 24,
            result: 'SUCCESS',
         };
         setHistory((prev) => [entry, ...prev]);
      } finally {
         setIsSyncing(false);
      }
   };

   return { history, isSyncing, runSync };
}
