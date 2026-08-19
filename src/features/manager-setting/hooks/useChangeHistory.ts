'use client';

import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/lib/http';
import { getBootcampSettingsLogs } from '@/services/bootcampSettings.service';
import type { ChangeHistoryEntry } from '../types';

export type ChangeHistoryEntryWithId = ChangeHistoryEntry & { id: string };

function getApiErrorMessage(err: unknown, fallback: string) {
   return err instanceof ApiError ? err.message : fallback;
}

async function fetchChangeHistory(): Promise<ChangeHistoryEntryWithId[]> {
   const data = await getBootcampSettingsLogs();
   return data.logs.map((log) => ({ ...log, id: crypto.randomUUID() }));
}

// TanStack Query 캐시를 쓰는 이유 - 관리자 설정 탭(조직·출결/사용자 권한/변경 이력)은 각 탭 컴포넌트를
// activeTab === 'history' && ... 식으로 조건부 렌더링해서, 탭을 벗어나면 언마운트되고 상태가 사라진다.
// 일반 useState/useEffect였으면 이 탭에 돌아올 때마다 처음부터 다시 스켈레톤 -> 재조회를 반복해
// 깜빡거려 보이는데, 쿼리 캐시에 있으면 재마운트 시 캐시된 데이터를 즉시 보여주고 백그라운드에서만
// 조용히 재검증한다
export function useChangeHistory() {
   const {
      data: logs = [],
      isLoading,
      error,
   } = useQuery({
      queryKey: ['changeHistory'],
      queryFn: fetchChangeHistory,
   });

   const loadError = error
      ? getApiErrorMessage(error, '변경 이력을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
      : null;

   return { logs, isLoading, loadError };
}
