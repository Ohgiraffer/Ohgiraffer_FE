'use client';

import { cn } from '@/lib/utils';
import { formatTeamDateDot } from '../formatTeamDate';
import type { TeamPeriod } from '../types';

interface TeamPeriodTabsProps {
   periods: TeamPeriod[];
   activePeriodId: number | null;
   onSelect: (periodId: number) => void;
   // 매니저 보드의 "+ 기간 추가" 버튼처럼, 탭 행 끝에 추가로 넣을 내용(훈련생 화면엔 없음)
   trailing?: React.ReactNode;
}

// 팀 관리/팀 변경 이력 페이지가 함께 쓰는 기간 탭 - 다른 관리 페이지 탭(승인 관리, 관리자 설정)과
// 동일한 스타일(밑줄 방식 언더라인 탭)을 그대로 재사용한다
export default function TeamPeriodTabs({
   periods,
   activePeriodId,
   onSelect,
   trailing,
}: TeamPeriodTabsProps) {
   return (
      <div className="mt-5 flex gap-6 border-b border-[#E5E7EB]">
         {periods.map((period) => {
            const isActive = period.teamPeriodId === activePeriodId;
            return (
               <button
                  key={period.teamPeriodId}
                  type="button"
                  onClick={() => onSelect(period.teamPeriodId)}
                  className={cn(
                     'cursor-pointer border-b-2 pb-3 text-sm transition-colors',
                     isActive
                        ? 'border-brand-green font-bold text-[#111827]'
                        : 'border-transparent font-medium text-[#9CA3AF] hover:text-gray-700',
                  )}
               >
                  {formatTeamDateDot(period.startDate)}~{formatTeamDateDot(period.endDate)}
               </button>
            );
         })}
         {trailing}
      </div>
   );
}
