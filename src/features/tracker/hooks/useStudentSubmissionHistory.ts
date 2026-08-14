'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/http';
import {
   getStudentSubmissionHistory,
   type StudentSubmissionHistoryResponse,
} from '@/services/studentSubmissionHistory.service';

// 제출 탭이 열릴 때만 호출한다
export function useStudentSubmissionHistory(traineeId: number) {
   const [data, setData] = useState<StudentSubmissionHistoryResponse | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState(false);
   // FORM_003(호출 한도 초과)/FORM_004(호출 실패) - Google Forms 쪽 문제라는 걸 구분해서 안내하기 위함
   const [errorCode, setErrorCode] = useState<string | null>(null);
   const [retryKey, setRetryKey] = useState(0);

   // traineeId가 바뀌면 이전 훈련생의 데이터를 먼저 비운다(useTraineeConsultations와 동일한 패턴)
   const [trackedTraineeId, setTrackedTraineeId] = useState(traineeId);
   if (traineeId !== trackedTraineeId) {
      setTrackedTraineeId(traineeId);
      setData(null);
      setIsLoading(true);
      setError(false);
      setErrorCode(null);
   }

   useEffect(() => {
      let isMounted = true;
      getStudentSubmissionHistory(traineeId)
         .then((result) => {
            if (isMounted) setData(result);
         })
         .catch((err) => {
            if (!isMounted) return;
            setError(true);
            setErrorCode(err instanceof ApiError ? err.code : null);
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
      setErrorCode(null);
      setRetryKey((key) => key + 1);
   }, []);

   return { data, isLoading, error, errorCode, retry };
}
