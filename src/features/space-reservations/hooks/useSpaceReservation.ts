'use client';

import { useEffect, useState } from 'react';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import { createSpace, deleteSpace, getSpaces, updateMyLocation } from '@/services/space.service';
import type { Space } from '../types';

export type SpaceViewMode = 'grid' | 'list';

// 공간 예약 페이지 전체 상태 - 공간 목록(재실 인원 포함) 조회, 뷰모드, 검색어를 관리
export function useSpaceReservation() {
   const [spaces, setSpaces] = useState<Space[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [hasError, setHasError] = useState(false);
   const [viewMode, setViewMode] = useState<SpaceViewMode>('grid');
   const [searchKeyword, setSearchKeyword] = useState('');
   // 검색을 제출할 때마다 값을 올려서, 같은 사람이 다시 매칭되어도 깜빡임 애니메이션이 재생되도록 함
   const [searchTrigger, setSearchTrigger] = useState(0);

   const fetchSpaces = () =>
      getSpaces()
         .then((data) => {
            setSpaces(data);
            setHasError(false);
         })
         .catch((err) => {
            setHasError(true);
            toast.error(
               err instanceof ApiError
                  ? err.message
                  : '공간 정보를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
            );
         });

   useEffect(() => {
      fetchSpaces().finally(() => setIsLoading(false));
   }, []);

   const handleSearch = (value: string) => {
      setSearchKeyword(value);
      setSearchTrigger((prev) => prev + 1);
   };

   // 위치 등록·이동·해제 공용 처리 - 성공 후 재실 현황을 다시 조회해서 화면에 반영함
   const changeMyLocation = async (spaceId: number | null) => {
      try {
         await updateMyLocation(spaceId);
         await fetchSpaces();
      } catch (err) {
         toast.error(
            err instanceof ApiError
               ? err.message
               : '위치 변경에 실패했습니다. 잠시 후 다시 시도해주세요.',
         );
      }
   };

   // 다른 구역으로 이동할 때도 같은 API를 호출함(백엔드가 기존 위치에서 자동으로 빼줌)
   const checkIn = (spaceId: number) => changeMyLocation(spaceId);

   // 본인이 있던 구역에서 자기 카드를 다시 클릭하면 퇴실
   const checkOut = () => changeMyLocation(null);

   // 등록/삭제 실패 시 에러를 그대로 던져서 관리 패널이 필드별 에러·안내 메시지를 직접 보여주게 한다
   const addSpace = async (name: string, capacity: number) => {
      await createSpace({ spaceName: name, capacity });
      await fetchSpaces();
   };

   // 재실 인원이 있는 공간은 백엔드가 409(SPACE_003)로 거절함 - UI에서도 버튼을 비활성화하지만
   // 여기서도 한 번 더 실제 API 응답으로 방어됨
   const removeSpace = async (spaceId: number) => {
      await deleteSpace(spaceId);
      await fetchSpaces();
   };

   return {
      spaces,
      isLoading,
      hasError,
      refetch: fetchSpaces,
      viewMode,
      setViewMode,
      searchKeyword,
      searchTrigger,
      handleSearch,
      checkIn,
      checkOut,
      addSpace,
      removeSpace,
   };
}
