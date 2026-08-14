'use client';

import { useCallback, useEffect, useState } from 'react';
import { getTraineeTeamHistories, type TraineeTeamHistoryEntry } from '@/services/team.service';

// 팀 탭이 열릴 때만 호출한다
export function useTraineeTeamHistories(traineeId: number) {
   const [histories, setHistories] = useState<TraineeTeamHistoryEntry[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState(false);
   const [retryKey, setRetryKey] = useState(0);

   // traineeId가 바뀌면 이전 훈련생의 목록을 먼저 비운다(useTraineeConsultations와 동일한 패턴)
   const [trackedTraineeId, setTrackedTraineeId] = useState(traineeId);
   if (traineeId !== trackedTraineeId) {
      setTrackedTraineeId(traineeId);
      setHistories([]);
      setIsLoading(true);
      setError(false);
   }

   useEffect(() => {
      let isMounted = true;
      getTraineeTeamHistories(traineeId)
         .then((result) => {
            if (isMounted) setHistories(result);
         })
         .catch(() => {
            if (isMounted) setError(true);
         })
         .finally(() => {
            if (isMounted) setIsLoading(false);
         });
      return () => {
         isMounted = false;
      };
   }, [traineeId, retryKey]);

   const retry = useCallback(() => {
      setIsLoading(true);
      setError(false);
      setRetryKey((key) => key + 1);
   }, []);

   return { histories, isLoading, error, retry };
}
