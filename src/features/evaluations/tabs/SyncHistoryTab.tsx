'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import Pagination from '@/components/ui/Pagination';
import SyncHistoryDetail from '../components/SyncHistoryDetail';
import type { SyncHistoryEntry } from '../types';

const PAGE_SIZE = 6;

type Props = {
   history: SyncHistoryEntry[];
};

// "이력" 탭 - 처음엔 항상 목록이 먼저 보이고(탭 재진입 시에도 목록으로 리셋됨),
// 목록에서 항목을 고르면 그 시점의 AI 요약 상세로 전환된다
export default function SyncHistoryTab({ history }: Props) {
   const [selectedId, setSelectedId] = useState<string | null>(null);
   const [currentPage, setCurrentPage] = useState(1);

   const selectedEntry = history.find((entry) => entry.id === selectedId) ?? null;
   if (selectedEntry) {
      return <SyncHistoryDetail entry={selectedEntry} onBack={() => setSelectedId(null)} />;
   }

   const totalPages = Math.max(1, Math.ceil(history.length / PAGE_SIZE));
   const pagedHistory = history.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

   return (
      <div>
         <div className="overflow-hidden rounded-sm border border-[#E5E7EB] bg-white">
            <table className="w-full table-fixed text-left text-sm">
               <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                     <th className="w-[10%] px-6 py-3 text-center font-medium">#</th>
                     <th className="w-[25%] px-15 py-3 text-center font-medium">실행자</th>
                     <th className="w-[30%] px-15 py-3 font-medium">동기화 일시</th>
                     <th className="w-[35%] px-6 py-3 font-medium">변경 건수</th>
                  </tr>
               </thead>
               <tbody>
                  {pagedHistory.length === 0 ? (
                     <tr>
                        <td colSpan={4} className="px-6 py-10 text-center text-gray-400">
                           동기화 이력이 없습니다.
                        </td>
                     </tr>
                  ) : (
                     pagedHistory.map((entry, index) => {
                        const rowNumber = (currentPage - 1) * PAGE_SIZE + index + 1;

                        return (
                           <tr
                              key={entry.id}
                              onClick={() => setSelectedId(entry.id)}
                              className="cursor-pointer border-b border-[#F3F4F6] last:border-b-0 hover:bg-[#F9FAFB]"
                           >
                              <td className="px-6 py-4 text-center text-gray-500">{rowNumber}</td>
                              <td className="px-15 py-4 text-center text-gray-900">{entry.executedByName}</td>
                              <td className="px-15 py-4 text-gray-700">
                                 {format(parseISO(entry.syncedAt), 'yyyy.MM.dd HH:mm')}
                              </td>
                              <td className="px-6 py-4 text-gray-700">{entry.changeCount}건</td>
                           </tr>
                        );
                     })
                  )}
               </tbody>
            </table>
         </div>

         <div className="mt-6">
            <Pagination
               currentPage={currentPage}
               totalPages={totalPages}
               onPageChange={setCurrentPage}
            />
         </div>
      </div>
   );
}
