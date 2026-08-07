'use client';

import { useMemo, useState } from 'react';
import { Building, LayoutGrid, List, TriangleAlert } from 'lucide-react';
import SearchInput from '@/components/ui/SearchInput';
import SpaceGridView from './SpaceGridView';
import SpaceListView from './SpaceListView';
import SpaceManagePanel from './SpaceManagePanel';
import { useSpaceReservation } from '../hooks/useSpaceReservation';

// 공간 예약(자리 현황) 페이지 - 헤더(제목+검색+뷰토글) + 안내 배너 + 그리드/리스트 뷰 조립
export default function SpaceReservationClient() {
   const {
      zones,
      people,
      viewMode,
      setViewMode,
      searchKeyword,
      searchTrigger,
      handleSearch,
      checkIn,
      checkOut,
      addZone,
      removeZone,
   } = useSpaceReservation();
   const [isManagePanelOpen, setIsManagePanelOpen] = useState(false);

   // 구역별 재실 인원 수 - 0명일 때만 삭제 가능
   const manageRows = useMemo(
      () =>
         zones.map((zone) => {
            const occupantCount = people.filter((person) => person.zoneId === zone.id).length;
            return {
               id: zone.id,
               name: zone.name,
               capacity: zone.capacity,
               occupantCount,
               canDelete: occupantCount === 0,
            };
         }),
      [zones, people],
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
               <button
                  type="button"
                  onClick={() => setIsManagePanelOpen(true)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-sm border border-brand-green bg-white px-3 h-9 text-sm font-semibold text-brand-green hover:bg-gray-50"
               >
                  <Building size={16} />
                  공간 관리
               </button>
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
            {viewMode === 'grid' ? (
               <SpaceGridView
                  zones={zones}
                  people={people}
                  searchKeyword={searchKeyword}
                  searchTrigger={searchTrigger}
                  onCheckIn={checkIn}
                  onCheckOut={checkOut}
               />
            ) : (
               <SpaceListView
                  zones={zones}
                  people={people}
                  searchKeyword={searchKeyword}
                  onCheckIn={checkIn}
                  onCheckOut={checkOut}
               />
            )}
         </div>

         <SpaceManagePanel
            open={isManagePanelOpen}
            onClose={() => setIsManagePanelOpen(false)}
            zones={manageRows}
            onAddZone={addZone}
            onRemoveZone={removeZone}
         />
      </div>
   );
}
