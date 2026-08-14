'use client';

import { useEffect, useState } from 'react';
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

export function useUserList() {
   const [users, setUsers] = useState<ManagerSettingUser[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [loadError, setLoadError] = useState<string | null>(null);
   const [reloadKey, setReloadKey] = useState(0);

   useEffect(() => {
      let isMounted = true;

      getUserList()
         .then((data) => {
            if (!isMounted) return;
            setUsers(data.map(toManagerSettingUser));
         })
         .catch((err) => {
            if (!isMounted) return;
            setLoadError(
               getApiErrorMessage(
                  err,
                  '사용자 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
               ),
            );
         })
         .finally(() => {
            if (isMounted) setIsLoading(false);
         });

      return () => {
         isMounted = false;
      };
   }, [reloadKey]);

   // 사용자 등록 성공 후 최신 목록 다시 조회
   const refetch = () => {
      setIsLoading(true);
      setLoadError(null);
      setReloadKey((key) => key + 1);
   };

   return { users, isLoading, loadError, refetch };
}
