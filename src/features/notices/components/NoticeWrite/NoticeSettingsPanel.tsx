'use client';

import { Paperclip, Upload, X } from 'lucide-react';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/shadcn/select';
import { formatFileSize } from '@/lib/formatFileSize';
import type { NoticeAttachment, NoticeVisibility } from '../../types';

type Props = {
   category: string;
   onCategoryChange: (value: string) => void;
   categoryOptions: string[];
   isRequired: boolean;
   onRequiredChange: (value: boolean) => void;
   visibility: NoticeVisibility;
   onVisibilityChange: (value: NoticeVisibility) => void;
   // 수정 모드에서 불러온, 이미 등록되어 있던 첨부파일 (실제 File 객체가 아니라 이름/용량만 존재)
   existingAttachments: NoticeAttachment[];
   onRemoveExisting: (index: number) => void;
   files: File[];
   onFilesAdd: (files: File[]) => void;
   onFileRemove: (index: number) => void;
};

// 오른쪽 영역 - 카테고리 / 고정 여부 / 공개 설정 / 파일 첨부
export default function NoticeSettingsPanel({
   category,
   onCategoryChange,
   categoryOptions,
   isRequired,
   onRequiredChange,
   visibility,
   onVisibilityChange,
   existingAttachments,
   onRemoveExisting,
   files,
   onFilesAdd,
   onFileRemove,
}: Props) {
   return (
      // 왼쪽 제목/본문 편집 패널과 동일한 고정 높이(NoticeContentPanel의 h-[527px]) - align-items:stretch는
      // 자기보다 작은 항목만 늘려줄 뿐 큰 항목을 줄이지 못하므로, 파일이 많아 내용이 넘칠 때도 이 높이로
      // 고정되고 아래 파일 목록 영역만 내부 스크롤되도록 직접 명시함
      <div className="flex h-[527px] min-h-0 w-90 shrink-0 flex-col overflow-hidden rounded-sm border border-[#E5E7EB] bg-white p-6">
         <div className="shrink-0">
            <label className="text-[15px] font-semibold text-gray-900">
               카테고리<span className="font-bold text-[16px] text-brand-gold">*</span>
            </label>
            <Select value={category} onValueChange={(value) => value && onCategoryChange(value)}>
               <SelectTrigger className="data-[size=default]:h-10 mt-2 w-full rounded-xs bg-white">
                  <SelectValue placeholder="카테고리 선택" />
               </SelectTrigger>
               <SelectContent alignItemWithTrigger={false} align="start" sideOffset={4}>
                  {categoryOptions.map((name) => (
                     <SelectItem key={name} value={name} className="cursor-pointer">
                        {name}
                     </SelectItem>
                  ))}
               </SelectContent>
            </Select>
         </div>

         <label className="mt-4 flex shrink-0 cursor-pointer items-center gap-2 text-sm text-gray-900">
            <input
               type="checkbox"
               checked={isRequired}
               onChange={(event) => onRequiredChange(event.target.checked)}
               className="h-4 w-4 cursor-pointer rounded-xs accent-brand-green"
            />
            고정 여부
         </label>

         <div className="mt-4 shrink-0">
            <span className="text-[15px] font-semibold text-gray-900">
               훈련생 공개 설정<span className="font-bold text-[16px] text-brand-gold">*</span>
            </span>
            <div className="mt-2 flex items-center gap-4">
               <label className="flex cursor-pointer items-center gap-1.5 text-sm text-gray-900">
                  <input
                     type="radio"
                     name="notice-visibility"
                     checked={visibility === 'public'}
                     onChange={() => onVisibilityChange('public')}
                     className="h-4 w-4 cursor-pointer accent-brand-green"
                  />
                  공개
               </label>
               <label className="flex cursor-pointer items-center gap-1.5 text-sm text-gray-900">
                  <input
                     type="radio"
                     name="notice-visibility"
                     checked={visibility === 'private'}
                     onChange={() => onVisibilityChange('private')}
                     className="h-4 w-4 cursor-pointer accent-brand-green"
                  />
                  비공개
               </label>
            </div>
         </div>

         <div className="mt-4 flex min-h-0 flex-1 flex-col">
            <div className="shrink-0">
               <span className="text-[15px] font-semibold text-gray-900">파일 첨부</span>
               <div className="relative mt-2">
                  <input
                     id="notice-file-input"
                     type="file"
                     multiple
                     onChange={(event) => {
                        const selected = Array.from(event.target.files ?? []);
                        if (selected.length > 0) onFilesAdd(selected);
                        // 같은 파일을 다시 선택해도 onChange가 또 발생하도록 초기화
                        event.target.value = '';
                     }}
                     className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  />
                  <div className="flex h-10 items-center gap-2 rounded-xs border border-[#E5E7EB] px-3 text-sm text-gray-400 peer-hover:bg-gray-50">
                     <Upload size={16} className="shrink-0 text-gray-400" />
                     파일 선택
                  </div>
               </div>
               <p className="mt-1.5 text-xs text-gray-400">
                  파일당 최대 500MB · PDF, DOCX, XLS, HWP, JPG, PNG
               </p>
            </div>

            {/* 파일이 쌓여 패널 높이를 넘어가면 이 목록만 내부 스크롤되고, 위쪽 필드들은 항상 고정 노출됨 */}
            {(existingAttachments.length > 0 || files.length > 0) && (
               <div className="mt-1.5 min-h-0 flex-1 space-y-2 overflow-y-auto">
                  {existingAttachments.map((attachment, index) => (
                     <div
                        key={`existing-${attachment.name}-${index}`}
                        className="flex items-center justify-between gap-2 rounded-xs bg-[#F9FAFB] px-3 py-2.5 text-sm text-gray-700"
                     >
                        <div className="flex min-w-0 items-center gap-2">
                           <Paperclip size={14} className="shrink-0 text-gray-400" />
                           <span className="truncate">{attachment.name}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                           <span className="text-xs text-gray-400">
                              {formatFileSize(attachment.sizeBytes)}
                           </span>
                           <button
                              type="button"
                              onClick={() => onRemoveExisting(index)}
                              aria-label={`${attachment.name} 삭제`}
                              className="cursor-pointer rounded-xs p-0.5 text-gray-400 hover:text-gray-700"
                           >
                              <X size={14} />
                           </button>
                        </div>
                     </div>
                  ))}
                  {files.map((file, index) => (
                     <div
                        key={`new-${file.name}-${index}`}
                        className="flex items-center justify-between gap-2 rounded-xs bg-[#F9FAFB] px-3 py-2.5 text-sm text-gray-700"
                     >
                        <div className="flex min-w-0 items-center gap-2">
                           <Paperclip size={14} className="shrink-0 text-gray-400" />
                           <span className="truncate">{file.name}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                           <span className="text-xs text-gray-400">
                              {formatFileSize(file.size)}
                           </span>
                           <button
                              type="button"
                              onClick={() => onFileRemove(index)}
                              aria-label={`${file.name} 삭제`}
                              className="cursor-pointer rounded-xs p-0.5 text-gray-400 hover:text-gray-700"
                           >
                              <X size={14} />
                           </button>
                        </div>
                     </div>
                  ))}
               </div>
            )}
         </div>
      </div>
   );
}
