'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Pagination from '@/components/ui/Pagination';
import { Skeleton } from '@/components/ui/loading/Skeleton';
import { formatSyncedAt } from '../formatSyncedAt';
import type { SyncHistoryEntry } from '../types';

const PAGE_SIZE = 6;

type Props = {
   history: SyncHistoryEntry[];
   isLoadingHistory: boolean;
   historyError: boolean;
};

// "이력" 탭
export default function SyncHistoryTab({ history, isLoadingHistory, historyError }: Props) {
   const router = useRouter();
   const [currentPage, setCurrentPage] = useState(1);

   const totalPages = Math.max(1, Math.ceil(history.length / PAGE_SIZE));
   const pagedHistory = history.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

   return (
      <div>
         <div className="overflow-hidden rounded-sm border border-[#E5E7EB] bg-white">
            {isLoadingHistory ? (
               <table className="w-full table-fixed text-left text-sm">
                  <thead>
                     <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                        <th className="w-[8%] px-6 py-3 text-center font-medium">#</th>
                        <th className="w-[25%] px-15 py-3 text-center font-medium">실행자</th>
                        <th className="w-[37%] px-15 py-3 font-medium">동기화 일시</th>
                        <th className="w-[30%] px-6 py-3 font-medium">변경 건수</th>
                     </tr>
                  </thead>
                  <tbody>
                     {[0, 1, 2, 3, 4].map((i) => (
                        <tr key={i} className="border-b border-[#F3F4F6] last:border-b-0">
                           <td className="px-6 py-4"><Skeleton width={16} height={14} className="mx-auto rounded-md" /></td>
                           <td className="px-15 py-4"><Skeleton width="50%" height={14} className="mx-auto rounded-md" /></td>
                           <td className="px-15 py-4"><Skeleton width="60%" height={14} className="rounded-md" /></td>
                           <td className="px-6 py-4"><Skeleton width="40%" height={14} className="rounded-md" /></td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            ) : historyError ? (
               <p className="px-6 py-10 text-center text-gray-400">
                  동기화 이력을 불러오지 못했습니다.
               </p>
            ) : pagedHistory.length === 0 ? (
               <p className="px-6 py-10 text-center text-gray-400">아직 동기화 이력이 없습니다.</p>
            ) : (
               <>
                  {/* 좁은 화면 - 카드형 목록 */}
                  <div className="divide-y divide-[#F3F4F6] md:hidden">
                     {pagedHistory.map((entry, index) => {
                        const rowNumber = (currentPage - 1) * PAGE_SIZE + index + 1;

                        return (
                           <div
                              key={entry.id}
                              onClick={() => router.push(`/evaluations/sync-logs/${entry.syncLogId}`)}
                              className="cursor-pointer p-4 hover:bg-[#F9FAFB]"
                           >
                              <div className="flex items-center justify-between gap-2">
                                 <span className="text-sm font-medium text-gray-900">
                                    {entry.executedByName}
                                 </span>
                                 <span className="text-xs text-gray-400">#{rowNumber}</span>
                              </div>
                              <p className="mt-1 text-xs text-gray-500">
                                 {formatSyncedAt(entry.syncedAt)}
                              </p>
                              <p className="mt-1.5 text-sm text-gray-700">
                                 변경 {entry.changedCount}건
                              </p>
                           </div>
                        );
                     })}
                  </div>

                  {/* 넓은 화면 - 테이블 */}
                  <table className="hidden w-full table-fixed text-left text-sm md:table">
                     <thead>
                        <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                           <th className="w-[8%] px-6 py-3 text-center font-medium">#</th>
                           <th className="w-[25%] px-15 py-3 text-center font-medium">실행자</th>
                           <th className="w-[37%] px-15 py-3 font-medium">동기화 일시</th>
                           <th className="w-[30%] px-6 py-3 font-medium">변경 건수</th>
                        </tr>
                     </thead>
                     <tbody>
                        {pagedHistory.map((entry, index) => {
                           const rowNumber = (currentPage - 1) * PAGE_SIZE + index + 1;

                           return (
                              <tr
                                 key={entry.id}
                                 onClick={() => router.push(`/evaluations/sync-logs/${entry.syncLogId}`)}
                                 className="cursor-pointer border-b border-[#F3F4F6] last:border-b-0 hover:bg-[#F9FAFB]"
                              >
                                 <td className="px-6 py-4 text-center text-gray-500">{rowNumber}</td>
                                 <td className="px-15 py-4 text-center text-gray-900">{entry.executedByName}</td>
                                 <td className="px-15 py-4 text-gray-700">
                                    {formatSyncedAt(entry.syncedAt)}
                                 </td>
                                 <td className="px-6 py-4 text-gray-700">{entry.changedCount}건</td>
                              </tr>
                           );
                        })}
                     </tbody>
                  </table>
               </>
            )}
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
