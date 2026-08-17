'use client';

import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { formatTeamDateDot } from '../formatTeamDate';
import PeriodActionMenu from './PeriodActionMenu';
import type { TeamPeriod } from '../types';

interface TeamPeriodTabsProps {
   periods: TeamPeriod[];
   activePeriodId: number | null;
   onSelect: (periodId: number) => void;
   // 매니저 보드의 "+ 기간 추가" 버튼처럼, 탭 행 끝에 추가로 넣을 내용(훈련생 화면엔 없음)
   trailing?: React.ReactNode;
   // 매니저 보드에서만 전달 - 있을 때만 탭에 수정/삭제 아이콘이 표시된다(훈련생/이력 화면엔 없음)
   onEditPeriod?: (period: TeamPeriod) => void;
   onDeletePeriod?: (period: TeamPeriod) => void;
}

// 팀 관리/팀 변경 이력 페이지가 함께 쓰는 기간 탭 - 다른 관리 페이지 탭(승인 관리, 관리자 설정)과
// 동일한 스타일(밑줄 방식 언더라인 탭)을 그대로 재사용한다
export default function TeamPeriodTabs({
   periods,
   activePeriodId,
   onSelect,
   trailing,
   onEditPeriod,
   onDeletePeriod,
}: TeamPeriodTabsProps) {
   const showActions = !!onEditPeriod || !!onDeletePeriod;
   const scrollRef = useRef<HTMLDivElement>(null);
   const [canScroll, setCanScroll] = useState(false);

   // 실제로 옆으로 넘치는 기간이 있을 때만 그라데이션을 보여준다 - ResizeObserver는 탭 목록 컨테이너
   // 자체 크기 변화(창 크기, 사이드바 토글 등)를, periods 의존성은 기간 추가/삭제로 내용 너비만
   // 바뀌는 경우(컨테이너 크기는 그대로라 ResizeObserver가 못 잡음)를 각각 커버한다
   useEffect(() => {
      const el = scrollRef.current;
      if (!el) return;

      const checkOverflow = () => setCanScroll(el.scrollWidth > el.clientWidth);
      checkOverflow();

      const observer = new ResizeObserver(checkOverflow);
      observer.observe(el);
      return () => observer.disconnect();
   }, [periods]);

   return (
      <div className="mt-5 flex gap-3 border-b border-[#E5E7EB]">
         {/* min-w-0가 없으면 flex-1 아이템이 내용물 너비만큼 늘어나버려 overflow-x-auto가 동작하지 않는다 */}
         <div className="relative min-w-0 flex-1">
            <div
               ref={scrollRef}
               className="flex gap-6 overflow-x-auto scrollbar-none [&::-webkit-scrollbar]:hidden"
            >
               {periods.map((period) => {
                  const isActive = period.teamPeriodId === activePeriodId;
                  return (
                     <div
                        key={period.teamPeriodId}
                        className={cn(
                           'flex shrink-0 items-center gap-1 border-b-2 pb-3 pl-1 transition-colors',
                           isActive ? 'border-brand-green' : 'border-transparent',
                        )}
                     >
                        <button
                           type="button"
                           onClick={() => onSelect(period.teamPeriodId)}
                           className={cn(
                              'cursor-pointer text-sm whitespace-nowrap transition-colors',
                              isActive
                                 ? 'font-bold text-[#111827]'
                                 : 'font-medium text-[#9CA3AF] hover:text-gray-700',
                           )}
                        >
                           {formatTeamDateDot(period.startDate)}~{formatTeamDateDot(period.endDate)}
                        </button>
                        {showActions && (
                           <PeriodActionMenu
                              onEdit={onEditPeriod ? () => onEditPeriod(period) : undefined}
                              onDelete={onDeletePeriod ? () => onDeletePeriod(period) : undefined}
                           />
                        )}
                     </div>
                  );
               })}
            </div>
            {/* 실제로 스크롤 가능할 때(canScroll)만 렌더링 - 넘치는 기간이 있어야 그라데이션이 뜬다 */}
            {canScroll && (
               <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-brand-sage/15 to-transparent" />
            )}
         </div>
         {trailing && <div className="relative top-1.5 pl-2 pr-6 shrink-0">{trailing}</div>}
      </div>
   );
}
