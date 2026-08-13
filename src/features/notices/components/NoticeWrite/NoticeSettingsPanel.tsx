'use client';

import { Paperclip, RotateCcw, Upload, X } from 'lucide-react';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/shadcn/select';
import { formatFileSize } from '@/lib/formatFileSize';
import { getAttachmentFileError } from '../../hooks/useNoticeWriteForm';
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
   // 수정 모드에서는 첨부파일 추가/삭제도 다른 필드들과 마찬가지로 저장을 눌러야 실제로 반영된다 -
   // 그 전까지는 화면에만 "추가/삭제 예정"으로 표시됨(안내 문구 분기에만 씀)
   isEditMode: boolean;
   // 수정 모드에서 이미 서버에 저장돼있는 첨부파일 - 저장 전까지는 그대로 유지되고, pendingDeleteIds에
   // 있는 항목만 "삭제 예정"으로 표시됨
   existingAttachments: NoticeAttachment[];
   pendingDeleteIds: Set<number>;
   onRemoveExisting: (noticeAttachmentId: number) => void;
   onUndoRemoveExisting: (noticeAttachmentId: number) => void;
   // 수정 모드에서 저장 전까지 로컬에만 쌓아둔 "추가 예정" 새 파일(아직 서버에 업로드 안 함)
   pendingNewFiles: File[];
   onPendingNewFileRemove: (index: number) => void;
   // 이번 작성 중에 이미 업로드 완료돼 등록 요청에 그대로 실어 보낼 첨부파일 - 작성 모드에서만 쓰임
   pendingAttachments: UploadedNoticeAttachment[];
   isUploadingFiles: boolean;
   onFilesAdd: (files: File[]) => void;
   onFileRemove: (index: number) => void;
};

// 오른쪽 영역 - 카테고리 / 고정 여부 / 공개 설정 / 파일 첨부.
// 작성 모드는 파일이 선택 즉시 업로드되고, 수정 모드는 저장을 누르기 전까지 로컬 상태로만 존재한다
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
   pendingDeleteIds,
   onRemoveExisting,
   onUndoRemoveExisting,
   pendingNewFiles,
   onPendingNewFileRemove,
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
                  최대 5개(기존 첨부 포함) · 파일당 최대 10MB · PDF, DOCX, XLS, HWP, JPG, PNG
               </p>
               {pendingNewFiles.some((file) => getAttachmentFileError(file) !== null) && (
                  <p className="mt-1.5 text-xs text-brand-red">
                     ⚠ 파일 당 용량이 초과되었거나 지원하지 않는 파일 형식이 포함되어있습니다.
                  </p>
               )}
            </div>

            {/* 파일이 쌓여 패널 높이를 넘어가면 이 목록만 내부 스크롤되고, 위쪽 필드들은 항상 고정 노출됨 */}
            {(existingAttachments.length > 0 ||
               pendingAttachments.length > 0 ||
               pendingNewFiles.length > 0) && (
               <div className="mt-1.5 min-h-0 flex-1 space-y-2 overflow-y-auto">
                  {existingAttachments.map((attachment) => {
                     const isPendingDelete = pendingDeleteIds.has(attachment.noticeAttachmentId);
                     return (
                        <div
                           key={attachment.noticeAttachmentId}
                           className={`flex items-center justify-between gap-2 rounded-xs px-3 py-2.5 text-sm ${
                              isPendingDelete
                                 ? 'bg-[#FEF2F2] text-gray-400'
                                 : 'bg-[#F9FAFB] text-gray-700'
                           }`}
                        >
                           <div className="flex min-w-0 items-center gap-2">
                              <Paperclip size={14} className="shrink-0 text-gray-400" />
                              <span className={`truncate ${isPendingDelete ? 'line-through' : ''}`}>
                                 {attachment.fileName}
                              </span>
                              {isPendingDelete && (
                                 <span className="shrink-0 text-xs text-brand-red">삭제 예정</span>
                              )}
                           </div>
                           <div className="flex shrink-0 items-center gap-2">
                              <span className="text-xs text-gray-400">
                                 {formatFileSize(attachment.fileSizeBytes)}
                              </span>
                              {isPendingDelete ? (
                                 <button
                                    type="button"
                                    onClick={() =>
                                       onUndoRemoveExisting(attachment.noticeAttachmentId)
                                    }
                                    aria-label={`${attachment.fileName} 삭제 취소`}
                                    className="cursor-pointer rounded-xs p-0.5 text-gray-400 hover:text-gray-700"
                                 >
                                    <RotateCcw size={14} />
                                 </button>
                              ) : (
                                 <button
                                    type="button"
                                    onClick={() => onRemoveExisting(attachment.noticeAttachmentId)}
                                    aria-label={`${attachment.fileName} 삭제`}
                                    className="cursor-pointer rounded-xs p-0.5 text-gray-400 hover:text-gray-700"
                                 >
                                    <X size={14} />
                                 </button>
                              )}
                           </div>
                        </div>
                     );
                  })}
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
                  {pendingNewFiles.map((file, index) => {
                     const fileError = getAttachmentFileError(file);
                     return (
                        <div
                           key={`${file.name}-${file.size}-${index}`}
                           className={`flex items-center justify-between gap-2 rounded-xs px-3 py-2.5 text-sm text-gray-700 ${
                              fileError ? 'bg-[#FEF2F2]' : 'bg-[#ECF6EF]'
                           }`}
                        >
                           <div className="flex min-w-0 items-center gap-2">
                              <Paperclip size={14} className="shrink-0 text-gray-400" />
                              <span className="truncate">{file.name}</span>
                              {fileError ? (
                                 <span className="shrink-0 text-xs text-brand-red">
                                    {fileError}
                                 </span>
                              ) : (
                                 <span className="shrink-0 text-xs text-brand-green">
                                    추가 예정
                                 </span>
                              )}
                           </div>
                           <div className="flex shrink-0 items-center gap-2">
                              <span className="text-xs text-gray-400">
                                 {formatFileSize(file.size)}
                              </span>
                              <button
                                 type="button"
                                 onClick={() => onPendingNewFileRemove(index)}
                                 aria-label={`${file.name} 삭제`}
                                 className="cursor-pointer rounded-xs p-0.5 text-gray-400 hover:text-gray-700"
                              >
                                 <X size={14} />
                              </button>
                           </div>
                        </div>
                     );
                  })}
               </div>
            )}
         </div>
      </div>
   );
}
