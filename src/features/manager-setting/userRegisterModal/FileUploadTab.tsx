'use client';

import { useRef } from 'react';
import { Download, Upload } from 'lucide-react';

type Props = {
   selectedFile: File | null;
   onFileSelect: (file: File | null) => void;
};

export default function FileUploadTab({ selectedFile, onFileSelect }: Props) {
   const inputRef = useRef<HTMLInputElement>(null);

   const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
      onFileSelect(event.target.files?.[0] ?? null);
   };

   const handleReselect = () => {
      onFileSelect(null);
      if (inputRef.current) inputRef.current.value = '';
   };

   return (
      <div>
         <div className="flex items-center justify-between">
            <p className="text-sm text-gray-700">
               CSV 파일 형식: <span className="font-medium">이름, 이메일, 연락처, 역할</span>
            </p>
            <button
               type="button"
               // TODO: 템플릿 파일 준비되면 실제 다운로드 연결
               className="flex cursor-pointer items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
               <Download size={14} />
               템플릿 다운로드
            </button>
         </div>

         {selectedFile ? (
            <div className="mt-4 flex items-center gap-2 rounded-xs border border-[#E5E7EB] px-4 py-3 text-sm">
               <span className="font-semibold text-gray-900">{selectedFile.name}</span>
               <button
                  type="button"
                  onClick={handleReselect}
                  className="cursor-pointer text-gray-500 underline hover:text-gray-700"
               >
                  다시 선택
               </button>
               {/* TODO: 실제 CSV/엑셀 파싱 + 이메일 중복 등 검증 미리보기는 백엔드 연동 시 구현 */}
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
