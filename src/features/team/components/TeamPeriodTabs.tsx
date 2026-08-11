'use client';

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

   return (
      <div className="mt-5 flex gap-6 border-b border-[#E5E7EB]">
         {periods.map((period) => {
            const isActive = period.teamPeriodId === activePeriodId;
            return (
               <div
                  key={period.teamPeriodId}
                  className={cn(
                     'flex items-center gap-1 border-b-2 pb-3 pl-1 transition-colors',
                     isActive ? 'border-brand-green' : 'border-transparent',
                  )}
               >
                  <button
                     type="button"
                     onClick={() => onSelect(period.teamPeriodId)}
                     className={cn(
                        'cursor-pointer text-sm transition-colors',
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
         {trailing}
      </div>
   );
}
