'use client';

import { useEffect, useState } from 'react';
import { ApiError } from '@/lib/http';
import { getBootcampSettingsLogs } from '@/services/bootcampSettings.service';
import type { ChangeHistoryEntry } from '../types';

// 백엔드 응답에 고유 id가 없어 - 목록이 필터링/페이지네이션되며 리렌더될 때 key로 쓸 값을 조회 시점에 붙여둔다
export type ChangeHistoryEntryWithId = ChangeHistoryEntry & { id: string };

function getApiErrorMessage(err: unknown, fallback: string) {
   return err instanceof ApiError ? err.message : fallback;
}

export function useChangeHistory() {
   const [logs, setLogs] = useState<ChangeHistoryEntryWithId[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [loadError, setLoadError] = useState<string | null>(null);

   useEffect(() => {
      let isMounted = true;

      getBootcampSettingsLogs()
         .then((data) => {
            if (!isMounted) return;
            setLogs(data.logs.map((log) => ({ ...log, id: crypto.randomUUID() })));
         })
         .catch((err) => {
            if (!isMounted) return;
            setLoadError(
               getApiErrorMessage(
                  err,
                  '변경 이력을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
               ),
            );
         })
         .finally(() => {
            if (isMounted) setIsLoading(false);
         });

      return () => {
         isMounted = false;
      };
   }, []);

   return { logs, isLoading, loadError };
}
