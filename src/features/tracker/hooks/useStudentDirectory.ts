'use client';

import { useCallback, useEffect, useState } from 'react';
import { getUserList, type UserListItem } from '@/services/user.service';

// 훈련생 상세 페이지 헤더의 이름·소속 팀 - 출결 API들은 둘 다 내려주지 않아 /user/list에서 조회한다
export function useStudentDirectory() {
   const [students, setStudents] = useState<UserListItem[] | null>(null);
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
         });
      return () => {
         isMounted = false;
      };
   }, [retryKey]);

   const retry = useCallback(() => {
      setError(false);
      setRetryKey((key) => key + 1);
   }, []);

   return { students, error, retry };
}
