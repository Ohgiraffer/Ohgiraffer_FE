'use client';

import { useQuery } from '@tanstack/react-query';
import { getUserList } from '@/services/user.service';

// 훈련생 상세 페이지 헤더의 이름·소속 팀 - 출결 API들은 둘 다 내려주지 않아 /user/list에서 조회한다.
// useUserList/useManagerTrackerData/NewChatModal과 같은 queryKey를 써서 캐시를 공유한다
export function useStudentDirectory() {
   const {
      data,
      isLoading,
      isError,
      refetch,
   } = useQuery({
      queryKey: ['users', 'list'],
      queryFn: getUserList,
   });

   const students = data ? data.filter((user) => user.role === 'STUDENT') : null;

   return { students, isLoading, error: isError, retry: refetch };
}
