'use client';

import { format, parseISO } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import GoogleSheetSync from '@/components/ui/googlesheet/GoogleSheetSync';
import StatusBadge from '@/features/submissions/components/StatusBadge';
import { ATTENDANCE_SHEET_COLUMNS, useTrackerSheetSync } from '../hooks/useTrackerSheetSync';
import { useTrackerSyncHistory } from '../hooks/useTrackerSyncHistory';

export default function SheetSyncTab() {
   const { isConnected, handleSaveMapping } = useTrackerSheetSync();
   const { history, isSyncing, runSync } = useTrackerSyncHistory();

   return (
      <div className="flex flex-col gap-6">
         <GoogleSheetSync columns={ATTENDANCE_SHEET_COLUMNS} onSave={handleSaveMapping} />

         {isConnected && (
            <>
               <div className="rounded-sm border border-[#E5E7EB] bg-white p-6">
                  <h3 className="text-sm font-bold text-gray-900">동기화 실행</h3>
                  <p className="mt-1 text-sm text-gray-500">
                     연결된 Google Sheet에서 출결 데이터를 가져와 시스템에 반영합니다.
                  </p>
                  <button
                     type="button"
                     onClick={runSync}
                     disabled={isSyncing}
                     className="mt-4 flex cursor-pointer items-center gap-1.5 rounded-sm bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-[#4D655A] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                  >
                     <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                     {isSyncing ? '동기화 중...' : '동기화 실행'}
                  </button>
               </div>

               <div>
                  <p className="text-sm font-bold text-gray-900">동기화 이력</p>
                  <div className="mt-3 overflow-hidden rounded-sm border border-[#E5E7EB] bg-white">
                     <table className="w-full table-fixed text-left text-sm">
                        <thead>
                           <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                              <th className="w-[30%] px-6 py-3 font-medium">일시</th>
                              <th className="w-[25%] px-6 py-3 font-medium">실행자</th>
                              <th className="w-[25%] px-6 py-3 font-medium">처리 건수</th>
                              <th className="w-[20%] px-6 py-3 font-medium">결과</th>
                           </tr>
                        </thead>
                        <tbody>
                           {history.length === 0 ? (
                              <tr>
                                 <td colSpan={4} className="px-6 py-10 text-center text-gray-400">
                                    동기화 이력이 없습니다.
                                 </td>
                              </tr>
                           ) : (
                              history.map((entry) => (
                                 <tr
                                    key={entry.id}
                                    className="border-b border-[#F3F4F6] last:border-b-0"
                                 >
                                    <td className="px-6 py-4 text-gray-700">
                                       {format(parseISO(entry.syncedAt), 'yyyy.MM.dd HH:mm')}
                                    </td>
                                    <td className="px-6 py-4 text-gray-900">{entry.executedByName}</td>
                                    <td className="px-6 py-4 text-gray-700">{entry.processedCount}건</td>
                                    <td className="px-6 py-4">
                                       <StatusBadge tone={entry.result === 'SUCCESS' ? 'success' : 'danger'}>
                                          {entry.result === 'SUCCESS' ? '성공' : '실패'}
                                       </StatusBadge>
                                    </td>
                                 </tr>
                              ))
                           )}
                        </tbody>
                     </table>
                  </div>
               </div>
            </>
         )}
      </div>
   );
}
