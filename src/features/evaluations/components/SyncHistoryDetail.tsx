'use client';

import { ChevronLeft } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import AiSyncSummaryCard from './AiSyncSummaryCard';
import type { SyncHistoryEntry } from '../types';

type Props = {
   entry: SyncHistoryEntry;
   onBack: () => void;
};

// 이력 상세 - 목록으로 돌아가는 버튼 + 그 시점의 AI 요약을 그대로 다시 보여줌(알림 버튼은 없음)
export default function SyncHistoryDetail({ entry, onBack }: Props) {
   return (
      <div>
         <button
            type="button"
            onClick={onBack}
            className="flex cursor-pointer items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
         >
            <ChevronLeft size={16} />
            이력 목록으로 돌아가기
         </button>

         <div className="mt-4">
            <AiSyncSummaryCard
               subtitle={`${format(parseISO(entry.syncedAt), 'yyyy.MM.dd HH:mm')} · ${entry.executedByName}`}
               items={entry.summary}
            />
         </div>
      </div>
   );
}
