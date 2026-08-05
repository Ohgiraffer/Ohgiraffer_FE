import { Megaphone, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NoticeItem {
   title: string;
   date: string;
   pinned: boolean;
}

// 하드코딩된 더미 데이터 — 추후 API 연동 예정
const NOTICES: NoticeItem[] = [
   { title: '7월 중간 평가 일정 안내', date: '07.30', pinned: true },
   { title: '8월 휴강일 공지', date: '07.28', pinned: true },
   { title: '발표자료 제출 마감 연장', date: '07.29', pinned: false },
   { title: '팀 프로젝트 발표 순서', date: '07.26', pinned: false },
];

export default function NoticeCard() {
   return (
      <div className="h-full rounded-sm border border-gray-200 bg-white p-6 lg:p-6">
         <div className="mb-4 flex items-center justify-between lg:mb-5">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
               <Megaphone size={16} className="text-gray-400" />
               공지사항
            </h2>
            <span className="text-xs text-gray-400">더보기</span>
         </div>

         <ul className="flex flex-col gap-1">
            {NOTICES.map((notice) => (
               <li
                  key={notice.title}
                  className={cn(
                     'flex items-center justify-between gap-3 py-2 text-sm text-gray-600 lg:py-3',
                     notice.pinned && '-ml-2 border-l-2 border-brand-red pl-2 font-medium text-gray-900',
                  )}
               >
                  <span className="flex min-w-0 items-center gap-1.5">
                     {notice.pinned && <Pin size={12} className="shrink-0 text-brand-red" />}
                     <span className="truncate">{notice.title}</span>
                  </span>
                  <span className="shrink-0 text-xs text-gray-400">{notice.date}</span>
               </li>
            ))}
         </ul>
      </div>
   );
}
