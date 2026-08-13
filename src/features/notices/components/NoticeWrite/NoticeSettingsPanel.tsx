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
import type {
   NoticeAttachment,
   NoticeCategory,
   UploadedNoticeAttachment,
} from '@/services/notice.service';
import type { NoticeVisibility } from '../../types';

type Props = {
   category: number | '';
   onCategoryChange: (value: number) => void;
   categoryOptions: NoticeCategory[];
   isLoadingCategories: boolean;
   isRequired: boolean;
   onRequiredChange: (value: boolean) => void;
   visibility: NoticeVisibility;
   onVisibilityChange: (value: NoticeVisibility) => void;
   // 수정 모드에서는 새 첨부파일을 등록에 연결하는 API가 아직 없어(수정 API에 첨부 필드 자체가
   // 없음) 파일 추가 입력 자체를 숨긴다 - 기존 첨부파일 삭제만 지원
   isEditMode: boolean;
   // 수정 모드에서 이미 서버에 저장돼있는 첨부파일 - 삭제 시 실제 삭제 API가 호출됨
   existingAttachments: NoticeAttachment[];
   onRemoveExisting: (noticeAttachmentId: number) => void;
   // 이번 작성 중에 새로 업로드해서 등록 요청에 실어 보낼 첨부파일(이미 업로드 완료된 상태) -
   // 작성 모드에서만 쓰임
   pendingAttachments: UploadedNoticeAttachment[];
   isUploadingFiles: boolean;
   onFilesAdd: (files: File[]) => void;
   onFileRemove: (index: number) => void;
};

// 오른쪽 영역 - 카테고리 / 고정 여부 / 공개 설정 / 파일 첨부.
// 파일은 선택하는 즉시 업로드되므로(로컬에 들고 있지 않음), 목록엔 업로드 완료된 결과만 표시된다
export default function NoticeSettingsPanel({
   category,
   onCategoryChange,
   categoryOptions,
   isLoadingCategories,
   isRequired,
   onRequiredChange,
   visibility,
   onVisibilityChange,
   isEditMode,
   existingAttachments,
   onRemoveExisting,
   pendingAttachments,
   isUploadingFiles,
   onFilesAdd,
   onFileRemove,
}: Props) {
   return (
      // 왼쪽 제목/본문 편집 패널과 동일한 고정 높이(NoticeContentPanel의 h-[527px]) - align-items:stretch는
      // 자기보다 작은 항목만 늘려줄 뿐 큰 항목을 줄이지 못하므로, 파일이 많아 내용이 넘칠 때도 이 높이로
      // 고정되고 아래 파일 목록 영역만 내부 스크롤되도록 직접 명시함
      <div className="flex h-131.75 min-h-0 w-90 shrink-0 flex-col overflow-hidden rounded-sm border border-[#E5E7EB] bg-white p-6">
         <div className="shrink-0">
            <label className="text-[15px] font-semibold text-gray-900">
               카테고리<span className="font-bold text-[16px] text-brand-gold">*</span>
            </label>
            <Select
               value={category === '' ? '' : String(category)}
               onValueChange={(value) => value && onCategoryChange(Number(value))}
               disabled={isLoadingCategories}
            >
               <SelectTrigger className="data-[size=default]:h-10 mt-2 w-full rounded-xs bg-white">
                  <SelectValue
                     placeholder={isLoadingCategories ? '불러오는 중...' : '카테고리 선택'}
                  >
                     {(value: string | null) =>
                        value
                           ? categoryOptions.find((option) => String(option.categoryId) === value)
                                ?.name
                           : null
                     }
                  </SelectValue>
               </SelectTrigger>
               <SelectContent alignItemWithTrigger={false} align="start" sideOffset={4}>
                  {categoryOptions.map((option) => (
                     <SelectItem
                        key={option.categoryId}
                        value={String(option.categoryId)}
                        className="cursor-pointer"
                     >
                        {option.name}
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
               {isEditMode ? (
                  <p className="mt-2 text-xs text-gray-400">
                     수정 화면에서는 기존 첨부파일 삭제만 가능합니다. 새 파일을 추가하려면 공지를
                     다시 작성해주세요.
                  </p>
               ) : (
                  <>
                     <div className="relative mt-2">
                        <input
                           id="notice-file-input"
                           type="file"
                           multiple
                           disabled={isUploadingFiles}
                           onChange={(event) => {
                              const selected = Array.from(event.target.files ?? []);
                              if (selected.length > 0) onFilesAdd(selected);
                              // 같은 파일을 다시 선택해도 onChange가 또 발생하도록 초기화
                              event.target.value = '';
                           }}
                           className="peer absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                        />
                        <div className="flex h-10 items-center gap-2 rounded-xs border border-[#E5E7EB] px-3 text-sm text-gray-400 peer-hover:bg-gray-50">
                           <Upload size={16} className="shrink-0 text-gray-400" />
                           {isUploadingFiles ? '업로드 중...' : '파일 선택'}
                        </div>
                     </div>
                     <p className="mt-1.5 text-xs text-gray-400">
                        최대 5개 · 파일당 최대 10MB · PDF, DOCX, XLS, HWP, JPG, PNG
                     </p>
                  </>
               )}
            </div>

            {/* 파일이 쌓여 패널 높이를 넘어가면 이 목록만 내부 스크롤되고, 위쪽 필드들은 항상 고정 노출됨 */}
            {(existingAttachments.length > 0 || pendingAttachments.length > 0) && (
               <div className="mt-1.5 min-h-0 flex-1 space-y-2 overflow-y-auto">
                  {existingAttachments.map((attachment) => (
                     <div
                        key={attachment.noticeAttachmentId}
                        className="flex items-center justify-between gap-2 rounded-xs bg-[#F9FAFB] px-3 py-2.5 text-sm text-gray-700"
                     >
                        <div className="flex min-w-0 items-center gap-2">
                           <Paperclip size={14} className="shrink-0 text-gray-400" />
                           <span className="truncate">{attachment.fileName}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                           <span className="text-xs text-gray-400">
                              {formatFileSize(attachment.fileSizeBytes)}
                           </span>
                           <button
                              type="button"
                              onClick={() => onRemoveExisting(attachment.noticeAttachmentId)}
                              aria-label={`${attachment.fileName} 삭제`}
                              className="cursor-pointer rounded-xs p-0.5 text-gray-400 hover:text-gray-700"
                           >
                              <X size={14} />
                           </button>
                        </div>
                     </div>
                  ))}
                  {pendingAttachments.map((attachment, index) => (
                     <div
                        key={attachment.fileKey}
                        className="flex items-center justify-between gap-2 rounded-xs bg-[#F9FAFB] px-3 py-2.5 text-sm text-gray-700"
                     >
                        <div className="flex min-w-0 items-center gap-2">
                           <Paperclip size={14} className="shrink-0 text-gray-400" />
                           <span className="truncate">{attachment.fileName}</span>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                           <span className="text-xs text-gray-400">
                              {formatFileSize(attachment.fileSizeBytes)}
                           </span>
                           <button
                              type="button"
                              onClick={() => onFileRemove(index)}
                              aria-label={`${attachment.fileName} 삭제`}
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
