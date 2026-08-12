'use client';

import { format, isValid, parseISO } from 'date-fns';
import { RefreshCw } from 'lucide-react';
import GoogleSheetSync from '@/components/ui/googlesheet/GoogleSheetSync';
import StatusBadge from '@/features/submissions/components/StatusBadge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/shadcn/popover';
import { ATTENDANCE_SHEET_COLUMNS, useTrackerSheetSync } from '../hooks/useTrackerSheetSync';
import { useTrackerSyncHistory, type TrackerSyncHistoryEntry } from '../hooks/useTrackerSyncHistory';

const RESULT_BADGE: Record<TrackerSyncHistoryEntry['result'], { tone: 'success' | 'gold'; label: string }> = {
   SUCCESS: { tone: 'success', label: '성공' },
   PARTIAL: { tone: 'gold', label: '부분 성공' },
};

// apiFetch 응답은 런타임 날짜 검증이 없어, 잘못된 문자열이 오면 parseISO가 Invalid Date를
// 반환하고 format이 RangeError를 던져 전체 이력 테이블 렌더링이 중단될 수 있다
function formatSyncedAt(value: string) {
   const date = parseISO(value);
   return isValid(date) ? format(date, 'yyyy.MM.dd HH:mm') : '—';
}

export default function SheetSyncTab() {
   const { isConnected, spreadsheetUrl, isLoading, loadError, handleSaveMapping } = useTrackerSheetSync();
   const { history, isLoadingHistory, historyError, isSyncing, runSync } = useTrackerSyncHistory(isConnected);

   if (isLoading) {
      return <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>;
   }

   if (loadError) {
      return (
         <div className="flex flex-col items-center gap-3 py-16">
            <p className="text-sm text-gray-400">연동 설정을 불러오지 못했습니다.</p>
            <button
               type="button"
               onClick={() => window.location.reload()}
               className="cursor-pointer rounded-xs border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
               다시 시도
            </button>
         </div>
      );
   }

   return (
      <div className="flex flex-col gap-6">
         <GoogleSheetSync
            columns={ATTENDANCE_SHEET_COLUMNS}
            onSave={handleSaveMapping}
            initialConnection={isConnected ? { spreadsheetUrl } : undefined}
         />

         {isConnected && (
            <>
               <div className="flex items-center justify-between gap-4 rounded-xs border border-[#E5E7EB] bg-white p-6">
                  <div>
                     <h3 className="text-sm font-bold text-gray-900">동기화 실행</h3>
                     <p className="mt-1 text-sm text-gray-500">
                        연결된 Google Sheet에서 출결 데이터를 가져와 시스템에 반영합니다.
                     </p>
                  </div>
                  <button
                     type="button"
                     onClick={runSync}
                     disabled={isSyncing}
                     className="flex shrink-0 cursor-pointer items-center gap-1.5 rounded-xs bg-brand-green px-3 py-2 text-sm font-semibold text-white hover:bg-[#4D655A] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                  >
                     <RefreshCw size={14} className={isSyncing ? 'animate-spin' : ''} />
                     {isSyncing ? '동기화 중...' : '동기화 실행'}
                  </button>
               </div>

               <div>
                  <p className="text-sm font-bold text-gray-900">동기화 이력</p>
                  <p className="mt-1 text-xs text-gray-400">
                     &quot;부분 성공&quot; 라벨을 클릭하면 실패한 행을 확인할 수 있습니다.
                  </p>
                  <div className="mt-3 overflow-hidden rounded-sm border border-[#E5E7EB] bg-white">
                     <table className="w-full table-fixed text-left text-sm">
                        <thead>
                           <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                              <th className="w-[30%] px-6 py-3 font-medium">일시</th>
                              <th className="w-[25%] px-6 py-3 font-medium">실행자</th>
                              <th className="w-[25%] px-6 py-3 font-medium text-center">변동 행 수</th>
                              <th className="w-[20%] px-6 py-3 font-medium text-center">결과</th>
                           </tr>
                        </thead>
                        <tbody>
                           {isLoadingHistory ? (
                              <tr>
                                 <td colSpan={4} className="px-6 py-10 text-center text-gray-400">
                                    불러오는 중...
                                 </td>
                              </tr>
                           ) : historyError ? (
                              <tr>
                                 <td colSpan={4} className="px-6 py-10 text-center text-gray-400">
                                    동기화 이력을 불러오지 못했습니다.
                                 </td>
                              </tr>
                           ) : history.length === 0 ? (
                              <tr>
                                 <td colSpan={4} className="px-6 py-10 text-center text-gray-400">
                                    동기화 이력이 없습니다.
                                 </td>
                              </tr>
                           ) : (
                              history.map((entry) => (
                                 <tr
                                    key={entry.syncLogId}
                                    className="border-b border-[#F3F4F6] last:border-b-0"
                                 >
                                    <td className="px-6 py-4 text-gray-700">{formatSyncedAt(entry.syncedAt)}</td>
                                    <td className="px-6 py-4 text-gray-900">{entry.executorName}</td>
                                    <td className="px-6 py-4 text-gray-700 text-center">{entry.successCount}건</td>
                                    <td className="px-6 py-4">
                                       <div className="flex items-center justify-center">
                                          {entry.result === 'PARTIAL' ? (
                                             <Popover>
                                                <PopoverTrigger className="cursor-pointer">
                                                   <StatusBadge tone={RESULT_BADGE.PARTIAL.tone}>
                                                      {RESULT_BADGE.PARTIAL.label} · {entry.failedRows.length}건
                                                   </StatusBadge>
                                                </PopoverTrigger>
                                                <PopoverContent align="end" className="w-fit min-w-0 max-w-64 rounded-xs!">
                                                   <p className="text-xs font-semibold text-gray-700">
                                                      실패한 행
                                                   </p>
                                                   <ul className="mt-1 flex flex-col gap-1">
                                                      {entry.failedRows.map((row) => (
                                                         <li key={row.rowNumber} className="text-xs text-gray-500">
                                                            <span className="font-medium text-gray-700">
                                                               {row.rowNumber}행
                                                            </span>{' '}
                                                            · {row.reason}
                                                         </li>
                                                      ))}
                                                   </ul>
                                                </PopoverContent>
                                             </Popover>
                                          ) : (
                                             <StatusBadge tone={RESULT_BADGE[entry.result].tone}>
                                                {RESULT_BADGE[entry.result].label}
                                             </StatusBadge>
                                          )}
                                       </div>
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
