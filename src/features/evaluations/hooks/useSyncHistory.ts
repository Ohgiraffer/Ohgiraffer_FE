'use client';

import { useState } from 'react';
import { useAuth } from '@/components/auth/AuthContext';
import { toast } from '@/lib/toast';
import { MOCK_SYNC_HISTORY, MOCK_SYNC_SUMMARY } from '../mockData';
import type { SyncHistoryEntry } from '../types';

// 동기화 실행 + 이력 상태 - 탭을 옮겨도 목록·최근 결과가 유지되도록 EvaluationsPageClient에서
// 한 번만 호출한다.
// TODO: 실제 동기화 실행/이력 조회/알림 발송 API가 나오면 evaluation.service.ts 호출로 교체
export function useSyncHistory() {
   const { me } = useAuth();
   const [history, setHistory] = useState<SyncHistoryEntry[]>(MOCK_SYNC_HISTORY);
   const [latestSync, setLatestSync] = useState<SyncHistoryEntry | null>(null);
   const [isSyncing, setIsSyncing] = useState(false);

   const runSync = async () => {
      setIsSyncing(true);
      try {
         // 실제로는 여기서 app script 동기화 API를 호출하고 AI 변경 요약을 받아온다
         await new Promise((resolve) => setTimeout(resolve, 600));
         const entry: SyncHistoryEntry = {
            id: `sync-${Date.now()}`,
            syncedAt: new Date().toISOString(),
            executedByName: me?.name ?? '알 수 없음',
            changeCount: MOCK_SYNC_SUMMARY.length,
            summary: MOCK_SYNC_SUMMARY,
         };
         setHistory((prev) => [entry, ...prev]);
         setLatestSync(entry);
      } finally {
         setIsSyncing(false);
      }
   };

   // 자신이 구글 시트를 수정했다고 다른 운영진에게 사이트 내 알림을 보내는 기능
   const notifyStaff = async () => {
      toast.success('다른 운영진에게 수정 완료 알림을 보냈습니다.');
   };

   return { history, latestSync, isSyncing, runSync, notifyStaff };
}
