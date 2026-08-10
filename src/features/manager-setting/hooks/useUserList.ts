'use client';

import { useEffect, useState } from 'react';
import { ApiError } from '@/lib/http';
import { ROLE_LABELS } from '@/services/auth.service';
import { getUserList, type UserListItem } from '@/services/user.service';
import type { ManagerSettingUser, UserRole } from '../types';

function getApiErrorMessage(err: unknown, fallback: string) {
   return err instanceof ApiError ? err.message : fallback;
}

// 목록 화면은 한국어 라벨(역할/상태) 기준으로 만들어져 있어 API 응답을 그 형태로 변환해서 쓴다.
// status는 ACTIVE만 "활성"으로 보고, 그 외(백엔드 상태값이 늘어나도)엔 안전하게 "삭제됨"으로 묶는다
function toManagerSettingUser(item: UserListItem): ManagerSettingUser {
   return {
      id: String(item.userId),
      name: item.name,
      email: item.email,
      // ROLE_LABELS 값 타입이 string으로 넓혀져 있어(auth.service의 UserRole용) 여기서 좁혀준다
      role: ROLE_LABELS[item.role] as UserRole,
      team: item.teamName,
      status: item.status === 'ACTIVE' ? '활성' : '삭제됨',
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
