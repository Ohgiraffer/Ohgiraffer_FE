'use client';

import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/lib/http';
import { ROLE_LABELS } from '@/services/auth.service';
import { getUserList, type UserListItem, type UserStatus } from '@/services/user.service';
import type { ManagerSettingUser, UserRole } from '../types';

function getApiErrorMessage(err: unknown, fallback: string) {
   return err instanceof ApiError ? err.message : fallback;
}

function toStatusLabel(status: UserStatus): ManagerSettingUser['status'] {
   switch (status) {
      case 'ACTIVE':
         return '활성';
      case 'COMPLETED':
         return '수료';
      case 'WITHDRAWN':
      case 'EXPELLED':
         return '삭제됨';
      default:
         return '삭제됨';
   }
}

function toManagerSettingUser(item: UserListItem): ManagerSettingUser {
   return {
      id: String(item.userId),
      name: item.name,
      email: item.email,
      role: ROLE_LABELS[item.role] as UserRole,
      team: item.teamName,
      status: toStatusLabel(item.status),
   };
}

// 사용자 목록(/user/list)은 useStudentDirectory/useManagerTrackerData/NewChatModal도 같은
// queryKey로 조회한다 - 화면을 오가도 재요청 없이 캐시를 공유한다
export function useUserList() {
   const {
      data,
      isLoading,
      error,
      refetch: refetchQuery,
   } = useQuery({
      queryKey: ['users', 'list'],
      queryFn: getUserList,
   });

   const users = (data ?? []).map(toManagerSettingUser);
   const loadError = error
      ? getApiErrorMessage(error, '사용자 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.')
      : null;

   // 사용자 등록 성공 후 최신 목록 다시 조회
   const refetch = () => {
      refetchQuery();
   };

   return { users, isLoading, loadError, refetch };
}
