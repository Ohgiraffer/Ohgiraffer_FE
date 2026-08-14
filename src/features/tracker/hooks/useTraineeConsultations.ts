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

   // traineeId가 바뀌면 이전 훈련생의 목록을 먼저 비운다 - 안 그러면 새 요청이 끝날 때까지 이전
   // 훈련생의 상담 이력이 새 상세 화면에 그대로 남는다. 이펙트 안에서 동기 setState를 하면 안 되므로,
   // React가 권장하는 "prop 변경에 맞춰 렌더 중 상태 조정" 패턴을 쓴다(TeamWorkspaceLink와 동일)
   const [trackedTraineeId, setTrackedTraineeId] = useState(traineeId);
   if (traineeId !== trackedTraineeId) {
      setTrackedTraineeId(traineeId);
      setConsultations([]);
      setIsLoading(true);
      setError(false);
   }

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
