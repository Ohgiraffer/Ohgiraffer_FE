'use client';

import { useMemo } from 'react';
import { Building, LayoutGrid, List, TriangleAlert } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import SearchInput from '@/components/ui/SearchInput';
import SpaceGridView from './SpaceGridView';
import SpaceListView from './SpaceListView';
import SpaceManagePanel from './SpaceManagePanel';
import { useSpaceReservation } from '../hooks/useSpaceReservation';
import { useSidePanel } from '@/components/layout/SidePanelContext';

// 공간 예약(자리 현황) 페이지 - 헤더(제목+검색+뷰토글) + 안내 배너 + 그리드/리스트 뷰 조립
export default function SpaceReservationClient() {
   const { role } = useAuth();
   // 공간 관리(등록/삭제)는 강사·매니저 전용 기능 - 훈련생 화면에는 버튼 자체를 노출하지 않음
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
      addSpace,
      removeSpace,
   } = useSpaceReservation();
   // 알림/채팅 등 다른 우측 패널이 열려 있으면 공간 관리를 열 때 자동으로 닫히도록 공용 상태로 관리
   const { isOpen: isManagePanelOpen, open: openManagePanel, close: closeManagePanel } =
      useSidePanel('space-manage');

   // 공간 관리 패널에 넘길 행 - 재실 인원이 있으면 삭제 불가
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
         <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">공간 예약</h1>
            <div className="flex items-center gap-2">
               <SearchInput
                  onSearch={handleSearch}
                  placeholder="이름으로 자리 검색"
                  className="w-72"
               />
               {canManageSpaces && (
                  <button
                     type="button"
                     onClick={openManagePanel}
                     className="flex cursor-pointer items-center gap-1.5 rounded-xs border border-brand-green bg-white px-3 h-9 text-sm font-semibold text-brand-green hover:bg-gray-50"
                  >
                     <Building size={16} />
                     공간 관리
                  </button>
               )}
               <div className="flex items-center rounded-xs border border-[#E5E7EB] bg-white">
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
               <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>
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
               />
            ) : (
               <SpaceListView
                  spaces={spaces}
                  searchKeyword={searchKeyword}
                  onCheckIn={checkIn}
                  onCheckOut={checkOut}
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
