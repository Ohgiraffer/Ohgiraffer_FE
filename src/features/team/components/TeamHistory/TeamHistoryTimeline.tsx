import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatTeamDateDot } from '../../formatTeamDate';
import type { TeamChangeHistoryEntry } from '../../types';

function TeamPill({ name }: { name: string }) {
   const isUnassigned = name === '미배정';
   return (
      <span
         className={cn(
            'rounded-xs px-2 py-0.5 text-xs font-medium whitespace-nowrap',
            isUnassigned ? 'bg-gray-100 text-gray-500' : 'bg-[#EAF3EC] text-brand-green',
         )}
      >
         {name}
      </span>
   );
}

interface TeamHistoryTimelineProps {
   entries: TeamChangeHistoryEntry[];
}

export default function TeamHistoryTimeline({ entries }: TeamHistoryTimelineProps) {
   if (entries.length === 0) {
      return <p className="mt-3 text-sm text-gray-400">조회 기간 내 변경 이력이 없습니다.</p>;
   }

   return (
      <div className="relative mt-3">
         <div className="absolute top-2 bottom-2 left-[3px] w-px bg-gray-200" />
         <div className="flex flex-col gap-3">
            {entries.map((entry, index) => (
               <div
                  key={`${entry.userId}-${entry.changedAt}-${index}`}
                  className="relative flex items-start pl-6"
               >
                  <span className="absolute top-2 left-0 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-green" />
                  <div className="flex-1 rounded-sm border border-[#E5E7EB] bg-white px-4 py-3">
                     <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-gray-900">{entry.userName}</span>
                        <span className="text-xs text-gray-400">
                           {formatTeamDateDot(entry.changedAt)}
                        </span>
                     </div>
                     <div className="mt-1.5 flex items-center gap-1.5">
                        <TeamPill name={entry.fromTeamName} />
                        <ArrowRight size={12} className="shrink-0 text-gray-300" />
                        <TeamPill name={entry.toTeamName} />
                     </div>
                  </div>
               </div>
            ))}
         </div>
      </div>
   );
}
