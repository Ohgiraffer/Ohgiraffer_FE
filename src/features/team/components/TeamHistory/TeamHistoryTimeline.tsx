import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import ChatAvatar from '@/features/chat/components/ChatAvatar';
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

type ChangeType = 'added' | 'moved' | 'removed';

// API가 변경 유형을 따로 안 내려줘서, fromTeamId/toTeamId가 null인지(=미배정)로 직접 구분한다
function getChangeType(entry: TeamChangeHistoryEntry): ChangeType {
   const fromUnassigned = entry.fromTeamId === null;
   const toUnassigned = entry.toTeamId === null;
   if (fromUnassigned && !toUnassigned) return 'added';
   if (!fromUnassigned && toUnassigned) return 'removed';
   return 'moved';
}

const CHANGE_TYPE_META: Record<ChangeType, { label: string; dot: string; badge: string }> = {
   added: { label: '추가', dot: 'bg-brand-green', badge: 'bg-[#EAF3EC] text-brand-green' },
   moved: { label: '이동', dot: 'bg-brand-gold', badge: 'bg-brand-cream/50 text-[#92700E]' },
   removed: { label: '제외', dot: 'bg-brand-maroon', badge: 'bg-[#FDF4F3] text-brand-maroon' },
};

interface TeamHistoryTimelineProps {
   entries: TeamChangeHistoryEntry[];
}

export default function TeamHistoryTimeline({ entries }: TeamHistoryTimelineProps) {
   if (entries.length === 0) {
      return <p className="mt-3 text-sm text-gray-400">조회 기간 내 변경 이력이 없습니다.</p>;
   }

   return (
      <div className="relative mt-3">
         <div className="absolute top-2 bottom-2 left-0.75 w-px bg-gray-200" />
         <div className="flex flex-col gap-3">
            {entries.map((entry, index) => {
               const changeType = getChangeType(entry);
               const meta = CHANGE_TYPE_META[changeType];
               return (
                  <div
                     key={`${entry.userId}-${entry.changedAt}-${index}`}
                     className="relative flex items-start pl-6"
                  >
                     <span className={cn('absolute top-2 left-0 h-1.5 w-1.5 shrink-0 rounded-full', meta.dot)} />
                     <div className="flex-1 rounded-xs border border-[#E5E7EB] bg-white px-4 py-4">
                        <div className="flex items-center justify-between mb-3">
                           <span className="flex items-center gap-1.5">
                              <ChatAvatar name={entry.userName} imageUrl={entry.profileImgUrl} size="sm" />
                              <span className="text-sm font-bold text-gray-900">
                                 {entry.userName || '이름 없음'}
                              </span>
                           </span>
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
               );
            })}
         </div>
      </div>
   );
}
