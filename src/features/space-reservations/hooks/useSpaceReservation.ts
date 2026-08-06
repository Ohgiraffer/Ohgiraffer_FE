'use client';

import { useState } from 'react';
import { MOCK_PEOPLE, MOCK_ZONES } from '../mockData';
import type { SpacePerson, SpaceZone } from '../types';

export type SpaceViewMode = 'grid' | 'list';

function createZoneId() {
   return `zone-${crypto.randomUUID()}`;
}

// 공간 예약 페이지 전체 상태 - 사람 목록(체크인으로 위치 변경), 구역 목록(추가/삭제), 뷰모드, 검색어를 관리
export function useSpaceReservation() {
   const [zones, setZones] = useState<SpaceZone[]>(MOCK_ZONES);
   const [people, setPeople] = useState<SpacePerson[]>(MOCK_PEOPLE);
   const [viewMode, setViewMode] = useState<SpaceViewMode>('grid');
   const [searchKeyword, setSearchKeyword] = useState('');
   // 검색을 제출할 때마다 값을 올려서, 같은 사람이 다시 매칭되어도 깜빡임 애니메이션이 재생되도록 함
   const [searchTrigger, setSearchTrigger] = useState(0);

   const handleSearch = (value: string) => {
      setSearchKeyword(value);
      setSearchTrigger((prev) => prev + 1);
   };

   // 본인의 위치를 새 구역으로 옮김 - 기존에 있던 구역에서는 자동으로 빠짐(한 번에 한 곳에만 있을 수 있음)
   const checkIn = (zoneId: string) => {
      setPeople((prev) =>
         prev.map((person) => (person.isCurrentUser ? { ...person, zoneId } : person)),
      );
   };

   // 본인이 있던 구역에서 자기 카드를 다시 클릭하면 퇴실 - 다른 구역으로 옮기지 않고 그냥 자리를 비움
   const checkOut = () => {
      setPeople((prev) =>
         prev.map((person) => (person.isCurrentUser ? { ...person, zoneId: null } : person)),
      );
   };

   const addZone = (name: string, capacity: number) => {
      setZones((prev) => [...prev, { id: createZoneId(), name, capacity }]);
   };

   // 재실 인원이 있는 구역은 삭제하지 않음 - UI에서도 버튼을 비활성화하지만 여기서도 한 번 더 방어함
   const removeZone = (zoneId: string) => {
      const hasOccupant = people.some((person) => person.zoneId === zoneId);
      if (hasOccupant) return;
      setZones((prev) => prev.filter((zone) => zone.id !== zoneId));
   };

   return {
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
   };
}
