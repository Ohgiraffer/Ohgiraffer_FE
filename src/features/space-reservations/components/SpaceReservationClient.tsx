'use client';

import { useMemo } from 'react';
import { Building, LayoutGrid, List, TriangleAlert } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import SearchInput from '@/components/ui/SearchInput';
import { Skeleton } from '@/components/ui/loading/Skeleton';
import SpaceGridView from './SpaceGridView';
import SpaceListView from './SpaceListView';
import SpaceManagePanel from './SpaceManagePanel';
import { useSpaceReservation } from '../hooks/useSpaceReservation';
import { useSidePanel } from '@/components/layout/SidePanelContext';
import type { Space } from '../types';

interface SpaceReservationClientProps {
   // space-reservations/page.tsx가 서버에서 미리 불러와 넘겨주는 초기 데이터 - 없으면(캐시 히트,
   // 검증 실패 등) 지금처럼 클라이언트에서 직접 불러온다
   initialSpaces?: Space[];
}

// 공간 예약(자리 현황) 페이지
export default function SpaceReservationClient({ initialSpaces }: SpaceReservationClientProps) {
   const { role } = useAuth();
   const canManageSpaces = role === 'INSTRUCTOR' || role === 'MANAGER';
   const {
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
   } = useSpaceReservation(initialSpaces);
   const { isOpen: isManagePanelOpen, open: openManagePanel, close: closeManagePanel } =
      useSidePanel('space-manage');

   const manageRows = useMemo(
      () =>
         spaces.map((space) => ({
            id: space.spaceId,
            name: space.spaceName,
            capacity: space.capacity,
            occupantCount: space.currentCount,
            canDelete: space.currentCount === 0,
         })),
      [spaces],
   );

   return (
      <div className="flex-1 bg-[#F7F8FA] px-10 py-8">
         <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-bold text-gray-900">공간 예약</h1>
            <div className="flex items-center gap-2">
               <SearchInput
                  onSearch={handleSearch}
                  placeholder="이름으로 자리 검색"
                  className="w-full sm:w-72"
               />
               {canManageSpaces && (
                  <button
                     type="button"
                     onClick={openManagePanel}
                     className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xs border border-brand-green bg-white px-3 h-9 text-sm font-semibold text-brand-green hover:bg-gray-50"
                  >
                     <Building size={16} />
                     공간 관리
                  </button>
               )}
               <div className="flex shrink-0 items-center rounded-xs border border-[#E5E7EB] bg-white">
                  <button
                     type="button"
                     onClick={() => setViewMode('grid')}
                     aria-label="그리드 보기"
                     aria-pressed={viewMode === 'grid'}
                     className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-xs ${
                        viewMode === 'grid'
                           ? 'bg-brand-green text-white'
                           : 'text-gray-400 hover:bg-gray-50'
                     }`}
                  >
                     <LayoutGrid size={18} />
                  </button>
                  <button
                     type="button"
                     onClick={() => setViewMode('list')}
                     aria-label="리스트 보기"
                     aria-pressed={viewMode === 'list'}
                     className={`flex h-9 w-9 cursor-pointer items-center justify-center rounded-xs ${
                        viewMode === 'list'
                           ? 'bg-brand-green text-white'
                           : 'text-gray-400 hover:bg-gray-50'
                     }`}
                  >
                     <List size={18} />
                  </button>
               </div>
            </div>
         </div>

         <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2 rounded-sm border border-brand-gold bg-brand-cream px-4 py-3 w-130 text-sm text-[#111827]">
               <TriangleAlert size={16} className="text-[#7A6F1A]" />
               실시간 자동 추적이 아닌 사용자가 입력한 위치 기준입니다.
            </div>
         </div>

         <div className="mt-4">
            {isLoading ? (
               viewMode === 'grid' ? (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                     {[0, 1].map((i) => (
                        <div key={i} className="rounded-sm border border-[#E5E7EB] bg-white p-5">
                           <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                 <Skeleton width={36} height={36} className="rounded-sm" />
                                 <div className="flex flex-col gap-2">
                                    <Skeleton width={100} height={14} className="rounded-md" />
                                    <Skeleton width={64} height={12} className="rounded-md" />
                                 </div>
                              </div>
                              <Skeleton width={80} height={14} className="rounded-md" />
                           </div>

                           <div className="mt-3 grid grid-cols-3 gap-3">
                              {[0, 1, 2].map((j) => (
                                 <Skeleton key={j} width="100%" height={80} className="rounded-xs" />
                              ))}
                           </div>

                           <div className="mt-4">
                              <Skeleton width="100%" height={6} className="rounded-full" />
                           </div>
                        </div>
                     ))}
                  </div>
               ) : (
                  <div className="rounded-sm border border-[#E5E7EB] bg-white">
                     <div className="grid w-full grid-cols-[1fr_1fr_1fr] items-center border-b border-[#E5E7EB] px-6 py-3">
                        <Skeleton width={32} height={12} className="rounded-md" />
                        <Skeleton width={32} height={12} className="rounded-md" />
                        <Skeleton width={32} height={12} className="rounded-md" />
                     </div>

                     {[0, 1].map((i) => (
                        <div key={i} className="border-b border-[#E5E7EB] last:border-b-0">
                           <div className="flex items-center gap-2 border-t border-[#E5E7EB] bg-[#F9FAFB] px-6 py-2.5">
                              <Skeleton width={16} height={16} className="rounded-xs" />
                              <Skeleton width={120} height={14} className="rounded-md" />
                           </div>

                           {[0, 1].map((j) => (
                              <div
                                 key={j}
                                 className="grid w-full grid-cols-[1fr_1fr_1fr] items-center border-t-[0.5px] border-b-[0.5px] border-[#E5E7EB] px-6 py-3"
                              >
                                 <div className="flex items-center gap-2">
                                    <Skeleton width={36} height={36} className="rounded-full" />
                                    <Skeleton width={80} height={14} className="rounded-md" />
                                 </div>
                                 <Skeleton width={80} height={14} className="rounded-md" />
                                 <Skeleton width={60} height={14} className="rounded-md" />
                              </div>
                           ))}
                        </div>
                     ))}
                  </div>
               )
            ) : hasError ? (
               <div className="flex flex-col items-center gap-3 py-16">
                  <p className="text-sm text-gray-400">공간 정보를 불러오지 못했습니다.</p>
                  <button
                     type="button"
                     onClick={refetch}
                     className="cursor-pointer rounded-xs border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                     다시 시도
                  </button>
               </div>
            ) : spaces.length === 0 ? (
               <p className="py-16 text-center text-sm text-gray-400">
                  {canManageSpaces
                     ? '등록된 장소가 없습니다. [공간 관리] 버튼을 통해 장소를 추가해보세요.'
                     : '아직 등록된 공간이 없습니다.'}
               </p>
            ) : viewMode === 'grid' ? (
               <SpaceGridView
                  spaces={spaces}
                  searchKeyword={searchKeyword}
                  searchTrigger={searchTrigger}
                  onCheckIn={checkIn}
                  onCheckOut={checkOut}
                  isChangingLocation={isChangingLocation}
               />
            ) : (
               <SpaceListView
                  spaces={spaces}
                  searchKeyword={searchKeyword}
                  onCheckIn={checkIn}
                  onCheckOut={checkOut}
                  isChangingLocation={isChangingLocation}
               />
            )}
         </div>

         {canManageSpaces && (
            <SpaceManagePanel
               open={isManagePanelOpen}
               onClose={closeManagePanel}
               spaces={manageRows}
               onAddSpace={addSpace}
               onRemoveSpace={removeSpace}
            />
         )}
      </div>
   );
}
