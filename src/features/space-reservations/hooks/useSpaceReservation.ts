'use client';

import { useEffect, useRef, useState } from 'react';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import { createSpace, deleteSpace, getSpaces, updateMyLocation } from '@/services/space.service';
import type { Space } from '../types';

export type SpaceViewMode = 'grid' | 'list';

// 공간 예약 페이지 전체 상태
export function useSpaceReservation(initialSpaces?: Space[]) {
   const [spaces, setSpaces] = useState<Space[]>(initialSpaces ?? []);
   const [isLoading, setIsLoading] = useState(!initialSpaces);
   const [hasError, setHasError] = useState(false);
   const [viewMode, setViewMode] = useState<SpaceViewMode>('grid');
   const [searchKeyword, setSearchKeyword] = useState('');
   const [searchTrigger, setSearchTrigger] = useState(0);
   const [isChangingLocation, setIsChangingLocation] = useState(false);
   const isChangingLocationRef = useRef(false);
   // 서버가 이미 initialSpaces를 넘겨줬으면, 마운트 시점의 첫 조회 한 번은 건너뛴다
   const skipInitialFetchRef = useRef(initialSpaces != null);

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
      if (skipInitialFetchRef.current) {
         skipInitialFetchRef.current = false;
         return;
      }
      fetchSpaces().finally(() => setIsLoading(false));
   }, []);

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
         await fetchSpaces();
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
      await fetchSpaces();
   };

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
      isChangingLocation,
      addSpace,
      removeSpace,
   };
}
