'use client';

import { useCallback, useEffect, useState } from 'react';
import {
   getTraineeConsultationHistory,
   type TraineeConsultationHistoryEntry,
} from '@/services/consultation.service';

// 상담 탭이 열릴 때만 호출한다(다른 탭에 있을 때는 이 컴포넌트가 마운트되지 않으므로 자연히 지연 로딩됨)
export function useTraineeConsultations(traineeId: number) {
   const [consultations, setConsultations] = useState<TraineeConsultationHistoryEntry[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState(false);
   const [retryKey, setRetryKey] = useState(0);

   useEffect(() => {
      let isMounted = true;
      getTraineeConsultationHistory(traineeId)
         .then((result) => {
            if (isMounted) setConsultations(result);
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

   return { consultations, isLoading, error, retry };
}
