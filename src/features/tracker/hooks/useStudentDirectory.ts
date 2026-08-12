'use client';

import { useCallback, useEffect, useState } from 'react';
import { getUserList, type UserListItem } from '@/services/user.service';

// 훈련생 상세 페이지 헤더의 이름·소속 팀 - 출결 API들은 둘 다 내려주지 않아 /user/list에서 조회한다
export function useStudentDirectory() {
   const [students, setStudents] = useState<UserListItem[] | null>(null);
   // students===null만으로는 "로딩 중"과 "조회 실패"를 구분할 수 없어 별도 플래그로 관리한다
   const [isLoading, setIsLoading] = useState(true);
   const [error, setError] = useState(false);
   const [retryKey, setRetryKey] = useState(0);

   useEffect(() => {
      let isMounted = true;
      getUserList()
         .then((list) => {
            if (isMounted) setStudents(list.filter((user) => user.role === 'STUDENT'));
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
   }, [retryKey]);

   const retry = useCallback(() => {
      setIsLoading(true);
      setError(false);
      setRetryKey((key) => key + 1);
   }, []);

   return { students, isLoading, error, retry };
}
