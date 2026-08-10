'use client';

import { useEffect, useState } from 'react';
import { ApiError } from '@/lib/http';
import { ROLE_LABELS } from '@/services/auth.service';
import { getUserList, type UserListItem, type UserStatus } from '@/services/user.service';
import type { ManagerSettingUser, UserRole } from '../types';

function getApiErrorMessage(err: unknown, fallback: string) {
   return err instanceof ApiError ? err.message : fallback;
}

// ACTIVE/COMPLETED는 각각 활성/수료로 구분해서 보여주고, WITHDRAWN·EXPELLED(자퇴·제적)는
// 둘 다 "삭제됨"으로 묶는다. 백엔드 상태값이 늘어나는 등 알 수 없는 값이 오면 안전한 쪽(삭제됨)으로 처리한다
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

// 목록 화면은 한국어 라벨(역할/상태) 기준으로 만들어져 있어 API 응답을 그 형태로 변환해서 쓴다.
function toManagerSettingUser(item: UserListItem): ManagerSettingUser {
   return {
      id: String(item.userId),
      name: item.name,
      email: item.email,
      // ROLE_LABELS 값 타입이 string으로 넓혀져 있어(auth.service의 UserRole용) 여기서 좁혀준다
      role: ROLE_LABELS[item.role] as UserRole,
      team: item.teamName,
      status: toStatusLabel(item.status),
   };
}

export function useUserList() {
   const [users, setUsers] = useState<ManagerSettingUser[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [loadError, setLoadError] = useState<string | null>(null);
   // 조회를 다시 트리거하는 용도 - 값 자체는 안 쓰고 바뀔 때마다 아래 effect가 재실행됨
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

   // 사용자 등록 성공 후(직접 입력/파일 업로드 공통) 최신 목록을 다시 조회한다
   const refetch = () => {
      setIsLoading(true);
      setLoadError(null);
      setReloadKey((key) => key + 1);
   };

   return { users, isLoading, loadError, refetch };
}
