'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Building, Plus, Trash2, X } from 'lucide-react';

export type SpaceManageRow = {
   id: string;
   name: string;
   capacity: number;
   occupantCount: number;
   canDelete: boolean;
};

type Props = {
   open: boolean;
   onClose: () => void;
   zones: SpaceManageRow[];
   onAddZone: (name: string, capacity: number) => void;
   onRemoveZone: (zoneId: string) => void;
};

// CSS transition-duration과 맞춰야 함 - 닫힌 뒤 이 시간만큼은 슬라이드아웃이 끝나길 기다렸다가 언마운트함
const EXIT_DURATION_MS = 300;

// 공간 예약 우측 관리 패널 - 새 공간 추가 + 기존 공간 삭제(재실 인원 있으면 삭제 불가)
export default function SpaceManagePanel({ open, onClose, zones, onAddZone, onRemoveZone }: Props) {
   const [name, setName] = useState('');
   const [capacity, setCapacity] = useState('');
   // open이 꺼져도 곧바로 언마운트하지 않고 퇴장 애니메이션이 끝날 때까지 렌더를 유지함
   const [isMounted, setIsMounted] = useState(open);
   // 마운트 직후 "화면 밖" 상태가 실제로 반영된 뒤에 true로 바뀌면서 들어오는 transition이 재생되고,
   // open이 꺼지면 바로 false로 바뀌면서 같은 transition이 반대로(나가는 방향으로) 재생됨
   const [isVisible, setIsVisible] = useState(false);
   const panelRef = useRef<HTMLDivElement>(null);

   // open → true: 먼저 마운트만 하고(아직 화면 밖), open → false: 즉시 화면 밖으로 트랜지션 시작 + 지연 언마운트
   useEffect(() => {
      if (open) {
         // eslint-disable-next-line react-hooks/set-state-in-effect -- 슬라이드인 전에 먼저 마운트 상태로 전환해야 함
         setIsMounted(true);
         return;
      }

      setIsVisible(false);
      const timeout = setTimeout(() => setIsMounted(false), EXIT_DURATION_MS);
      return () => clearTimeout(timeout);
   }, [open]);

   // 마운트된 직후("화면 밖" 상태) 레이아웃을 한 번 강제로 읽어서 브라우저가 그 값을 확정하도록 만든
   // 다음에 "화면 안" 상태로 바꿔야 트랜지션이 반드시 재생됨. 이 강제 계산 없이 바로 값을 바꾸면
   // 브라우저가 두 상태를 하나로 합쳐버려서 트랜지션 없이 그냥 나타나 버림
   useLayoutEffect(() => {
      if (!open || !isMounted) return;
      if (panelRef.current) {
         void panelRef.current.offsetHeight;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect -- 위 강제 레이아웃 계산 직후에 상태를 바꿔야 트랜지션이 재생됨
      setIsVisible(true);
   }, [open, isMounted]);

   useEffect(() => {
      if (!isMounted) return;

      const handleKeyDown = (event: KeyboardEvent) => {
         if (event.key === 'Escape') onClose();
      };

      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      return () => {
         document.removeEventListener('keydown', handleKeyDown);
         document.body.style.overflow = '';
      };
   }, [isMounted, onClose]);

   if (!isMounted) return null;

   const trimmedName = name.trim();
   const parsedCapacity = Number(capacity);
   // 공간 이름과 수용 인원 둘 다 입력해야 추가 가능
   const isAddEnabled = trimmedName.length > 0 && capacity.trim().length > 0 && parsedCapacity > 0;

   const handleAdd = () => {
      if (!isAddEnabled) return;
      onAddZone(trimmedName, parsedCapacity);
      setName('');
      setCapacity('');
   };

   return createPortal(
      // 헤더(h-14) 아래부터 시작 - 배경 오버레이도 패널도 헤더는 가리지 않음
      <div
         className={`fixed inset-x-0 top-14 bottom-0 z-40 flex justify-end bg-black/40 transition-opacity duration-300 ease-out ${
            isVisible ? 'opacity-100' : 'opacity-0'
         }`}
         onClick={onClose}
      >
         <div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="space-manage-panel-title"
            onClick={(event) => event.stopPropagation()}
            className={`flex h-full w-105 flex-col bg-white shadow-lg transition-transform duration-300 ease-out ${
               isVisible ? 'translate-x-0' : 'translate-x-full'
            }`}
         >
            <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
               <h2
                  id="space-manage-panel-title"
                  className="flex items-center gap-2 text-lg font-bold text-gray-900"
               >
                  <Building size={18} />
                  공간 관리
               </h2>
               <button
                  type="button"
                  onClick={onClose}
                  aria-label="닫기"
                  className="cursor-pointer rounded-sm p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-700"
               >
                  <X size={20} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto">
               <div className="bg-[#F9FAFB] border-b border-[#E5E7EB] px-6 py-4">
                  <div>
                     <label
                        htmlFor="space-manage-name"
                        className="text-[15px] font-semibold text-gray-900"
                     >
                        새 공간 추가<span className="font-bold text-[16px] text-brand-gold">*</span>
                     </label>
                     <input
                        id="space-manage-name"
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="공간 이름을 입력하세요"
                        className="mt-1.5 w-full rounded-xs border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-green"
                     />
                  </div>

                  <div className="mt-2.5 flex items-center gap-2">
                     <span className="shrink-0 text-sm font-medium text-gray-700">수용 인원</span>
                     <input
                        type="number"
                        min={1}
                        value={capacity}
                        onChange={(event) => setCapacity(event.target.value)}
                        className="w-30 rounded-xs border border-[#E5E7EB] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-brand-green"
                     />
                     <span className="shrink-0 text-sm text-gray-500">명</span>
                     <button
                        type="button"
                        onClick={handleAdd}
                        disabled={!isAddEnabled}
                        className={`ml-auto flex shrink-0 items-center gap-1 rounded-sm px-3 py-2 text-sm font-semibold ${
                           isAddEnabled
                              ? 'cursor-pointer bg-brand-green text-white hover:bg-[#4D655A]'
                              : 'bg-[#E5E7EB] text-gray-400'
                        }`}
                     >
                        <Plus size={14} />
                        추가
                     </button>
                  </div>
               </div>

               <div className="flex flex-col gap-2 px-6 py-4">
                  {zones.map((zone) => (
                     <div
                        key={zone.id}
                        className="flex items-center justify-between gap-2 rounded-sm border border-[#E5E7EB] px-4 py-3"
                     >
                        <div className="flex items-center gap-3">
                           <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-gray-100 text-gray-500">
                              <Building size={16} />
                           </span>
                           <div>
                              <p className="text-sm font-semibold text-gray-900">{zone.name}</p>
                              <p className="text-xs text-gray-400">
                                 수용 {zone.capacity}명 · {zone.occupantCount}명 재실
                              </p>
                           </div>
                        </div>
                        <button
                           type="button"
                           disabled={!zone.canDelete}
                           onClick={() => onRemoveZone(zone.id)}
                           aria-label={`${zone.name} 삭제`}
                           className={`shrink-0 rounded-sm p-2 ${
                              zone.canDelete
                                 ? 'cursor-pointer text-brand-maroon hover:bg-gray-50'
                                 : 'cursor-not-allowed text-gray-300'
                           }`}
                        >
                           <Trash2 size={16} />
                        </button>
                     </div>
                  ))}
               </div>
            </div>
         </div>
      </div>,
      document.body,
   );
}
