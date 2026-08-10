'use client';

import { useRef } from 'react';
import { Check, Download, Upload } from 'lucide-react';
import type { ExtractedUserRow } from '@/services/user.service';

type Props = {
   selectedFile: File | null;
   onFileSelect: (file: File | null) => void;
   // 파일을 고르면 즉시 추출 API가 호출되어 채워짐 - 아직 고르지 않았거나 추출 실패로 리셋되면 null
   extractedRows: ExtractedUserRow[] | null;
   isExtracting: boolean;
   onDownloadTemplate: () => void;
   isDownloadingTemplate: boolean;
   // 오류 없는(valid) 행 중 등록 대상으로 체크된 행 번호
   selectedRowNumbers: Set<number>;
   onToggleRow: (rowNumber: number) => void;
   onToggleAll: () => void;
};

export default function FileUploadTab({
   selectedFile,
   onFileSelect,
   extractedRows,
   isExtracting,
   onDownloadTemplate,
   isDownloadingTemplate,
   selectedRowNumbers,
   onToggleRow,
   onToggleAll,
}: Props) {
   const inputRef = useRef<HTMLInputElement>(null);

   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onFileSelect(event.target.files?.[0] ?? null);
   };

   const handleReselect = () => {
      onFileSelect(null);
      if (inputRef.current) inputRef.current.value = '';
   };

   const validRows = extractedRows?.filter((row) => row.valid) ?? [];
   const invalidCount = extractedRows ? extractedRows.length - validRows.length : 0;
   const isAllSelected = validRows.length > 0 && selectedRowNumbers.size === validRows.length;

   return (
      <div>
         <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
               CSV 파일 형식: <span className="font-medium">이름, 이메일, 연락처, 역할</span>
            </p>
            <button
               type="button"
               onClick={onDownloadTemplate}
               disabled={isDownloadingTemplate}
               className="flex cursor-pointer items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 disabled:cursor-not-allowed disabled:text-gray-400"
            >
               <Download size={14} />
               {isDownloadingTemplate ? '다운로드 중...' : '템플릿 다운로드'}
            </button>
         </div>

         {selectedFile ? (
            <div className="mt-4">
               <div className="flex items-center gap-2 rounded-xs border border-[#E5E7EB] px-4 py-3 text-sm">
                  <span className="font-semibold text-gray-900">{selectedFile.name}</span>
                  <button
                     type="button"
                     onClick={handleReselect}
                     className="cursor-pointer text-gray-500 underline hover:text-gray-700"
                  >
                     다시 선택
                  </button>
               </div>

               {isExtracting ? (
                  <p className="mt-3 py-6 text-center text-sm text-gray-400">
                     파일에서 사용자 정보를 추출하는 중...
                  </p>
               ) : (
                  extractedRows && (
                     <>
                        <div className="mt-3 max-h-64 overflow-y-auto rounded-xs border border-[#E5E7EB]">
                           <table className="w-full table-fixed text-left text-sm">
                              <thead className="sticky top-0 bg-[#F9FAFB] text-[#6B7280]">
                                 <tr className="border-b border-[#E5E7EB]">
                                    <th className="w-[6%] px-4 py-2 font-medium">
                                       <input
                                          type="checkbox"
                                          checked={isAllSelected}
                                          onChange={onToggleAll}
                                          disabled={validRows.length === 0}
                                          aria-label="오류 없는 행 전체 선택"
                                          className="h-4 w-4 cursor-pointer accent-brand-green disabled:cursor-not-allowed"
                                       />
                                    </th>
                                    <th className="w-[17%] px-4 py-2 font-medium">이름</th>
                                    <th className="w-[35%] px-3 py-2 font-medium">이메일</th>
                                    <th className="w-[15%] px-3 py-2 font-medium">역할</th>
                                    <th className="w-[28%] px-3 py-2 font-medium">상태</th>
                                 </tr>
                              </thead>
                              <tbody>
                                 {extractedRows.map((row) => (
                                    <tr
                                       key={row.rowNumber}
                                       className={`border-b border-[#F3F4F6] last:border-b-0 ${
                                          row.valid ? '' : 'bg-[#FDF2F1]'
                                       }`}
                                    >
                                       <td className="px-4 py-2">
                                          <input
                                             type="checkbox"
                                             checked={
                                                row.valid && selectedRowNumbers.has(row.rowNumber)
                                             }
                                             onChange={() => onToggleRow(row.rowNumber)}
                                             disabled={!row.valid}
                                             aria-label={`${row.name || row.rowNumber + '행'} 선택`}
                                             className="h-4 w-4 cursor-pointer accent-brand-green disabled:cursor-not-allowed"
                                          />
                                       </td>
                                       <td
                                          className={`truncate px-4 py-2 ${row.valid ? 'text-gray-900' : 'text-gray-400'}`}
                                       >
                                          {row.name || '—'}
                                       </td>
                                       <td
                                          className={`truncate px-3 py-2 ${row.valid ? 'text-gray-700' : 'text-gray-400'}`}
                                       >
                                          {row.email || '—'}
                                       </td>
                                       <td
                                          className={`truncate px-3 py-2 ${row.valid ? 'text-gray-700' : 'text-gray-400'}`}
                                       >
                                          {row.rawRole || '—'}
                                       </td>
                                       <td className="px-3 py-2">
                                          {row.valid ? (
                                             <span className="flex items-center gap-1 text-[13px] font-semibold text-brand-sage">
                                                <Check size={14} strokeWidth={3} />
                                                정상
                                             </span>
                                          ) : (
                                             <span className="inline-block rounded-xs bg-[#F5DFDC] px-2 py-0.5 text-xs font-semibold text-[#991B1B]">
                                                {row.errors.join(' / ')}
                                             </span>
                                          )}
                                       </td>
                                    </tr>
                                 ))}
                              </tbody>
                           </table>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                           총 {extractedRows.length}행 중{' '}
                           <span className="font-semibold text-brand-green">
                              {selectedRowNumbers.size}명
                           </span>{' '}
                           선택됨
                           {invalidCount > 0 && (
                              <span className="text-brand-maroon">
                                 {' '}
                                 · {invalidCount}행은 오류로 선택할 수 없습니다
                              </span>
                           )}
                        </p>
                     </>
                  )
               )}
            </div>
         ) : (
            <div
               role="button"
               tabIndex={0}
               onClick={() => inputRef.current?.click()}
               onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') inputRef.current?.click();
               }}
               onDragOver={(event) => event.preventDefault()}
               onDrop={(event) => {
                  event.preventDefault();
                  const file = event.dataTransfer.files?.[0];
                  if (file) onFileSelect(file);
               }}
               className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xs border border-dashed border-gray-300 py-16 text-center hover:bg-gray-50"
            >
               <Upload size={24} className="text-gray-400" />
               <span className="text-sm font-medium text-gray-700">
                  CSV / 엑셀 파일을 드래그하거나 클릭해서 업로드
               </span>
               <span className="text-xs text-gray-400">.csv, .xlsx 지원</span>
               <input
                  ref={inputRef}
                  type="file"
                  accept=".csv,.xlsx"
                  onChange={handleFileChange}
                  className="hidden"
               />
            </div>
         )}
      </div>
   );
}
