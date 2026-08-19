'use client';

import { useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import { createSpace, deleteSpace, getSpaces, updateMyLocation } from '@/services/space.service';
import type { Space } from '../types';

export type SpaceViewMode = 'grid' | 'list';

// 공간 예약 페이지 전체 상태
export function useSpaceReservation(initialSpaces?: Space[]) {
   const {
      data: spaces = [],
      isLoading,
      isError: hasError,
      refetch,
   } = useQuery({
      queryKey: ['spaces'],
      queryFn: getSpaces,
      initialData: initialSpaces,
      // QueryProvider의 기본 staleTime은 5분(자주 안 바뀌는 데이터 기준) - 재실 인원은 다른 사람
      // 행동으로 실시간으로 바뀌는 값이라 여기서 개별적으로 0으로 낮춘다(QueryProvider.tsx 주석의
      // 컨벤션). initialDataUpdatedAt도 0으로 줘서, initialData가 "방금 막 받아온 것"으로 취급되어
      // 마운트 시 재검증이 스킵되는 경우까지 방어한다
      staleTime: 0,
      initialDataUpdatedAt: 0,
   });

   const [viewMode, setViewMode] = useState<SpaceViewMode>('grid');
   const [searchKeyword, setSearchKeyword] = useState('');
   const [searchTrigger, setSearchTrigger] = useState(0);
   const [isChangingLocation, setIsChangingLocation] = useState(false);
   const isChangingLocationRef = useRef(false);

   const handleSearch = (value: string) => {
      setSearchKeyword(value);
      setSearchTrigger((prev) => prev + 1);
   };

   // 위치 등록·이동·해제 공용 처리
   const changeMyLocation = async (spaceId: number | null) => {
      if (isChangingLocationRef.current) return;
      isChangingLocationRef.current = true;
      setIsChangingLocation(true);
      try {
         await updateMyLocation(spaceId);
         await refetch();
      } catch (err) {
         toast.error(
            err instanceof ApiError
               ? err.message
               : '위치 변경에 실패했습니다. 잠시 후 다시 시도해주세요.',
         );
      } finally {
         isChangingLocationRef.current = false;
         setIsChangingLocation(false);
      }
   };

   // 다른 구역으로 이동할 때도 같은 API 호출(백엔드가 기존 위치에서 자동으로 빼줌)
   const checkIn = (spaceId: number) => changeMyLocation(spaceId);

   // 본인이 있던 구역에서 자기 카드를 다시 클릭하면 퇴실
   const checkOut = () => changeMyLocation(null);

   const addSpace = async (name: string, capacity: number) => {
      await createSpace({ spaceName: name, capacity });
      await refetch();
   };

   const removeSpace = async (spaceId: number) => {
      await deleteSpace(spaceId);
      await refetch();
   };

   return {
      spaces,
      isLoading,
      hasError,
      refetch,
      viewMode,
      setViewMode,
      searchKeyword,
      searchTrigger,
      handleSearch,
      checkIn,
      checkOut,
      isChangingLocation,
      addSpace,
      removeSpace,
   };
}
