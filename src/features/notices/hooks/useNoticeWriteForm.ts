'use client';

import { useState } from 'react';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import {
   addNoticeAttachments,
   deleteNoticeAttachment,
   uploadNoticeAttachments,
   type NoticeAttachment,
   type NoticeDetail,
   type UploadedNoticeAttachment,
} from '@/services/notice.service';
import type { NoticeVisibility } from '../types';

const MAX_ATTACHMENTS = 5;
const MAX_ATTACHMENT_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_ATTACHMENT_EXTENSIONS = [
   '.pdf',
   '.doc',
   '.docx',
   '.xls',
   '.xlsx',
   '.hwp',
   '.hwpx',
   '.jpg',
   '.jpeg',
   '.png',
];

function isAllowedAttachmentFile(file: File) {
   const lowerName = file.name.toLowerCase();
   return ALLOWED_ATTACHMENT_EXTENSIONS.some((ext) => lowerName.endsWith(ext));
}

function findInvalidAttachmentFile(files: File[]) {
   return files.find(
      (file) => !isAllowedAttachmentFile(file) || file.size > MAX_ATTACHMENT_SIZE_BYTES,
   );
}

export function getAttachmentFileError(file: File): string | null {
   if (!isAllowedAttachmentFile(file)) return '지원하지 않는 형식입니다';
   if (file.size > MAX_ATTACHMENT_SIZE_BYTES) return '10MB를 초과합니다';
   return null;
}

// 공지 작성/수정 폼 전체 상태와 등록/수정 완료 버튼 활성화 조건 관리 훅
export function useNoticeWriteForm(noticeId?: number, initialNotice?: NoticeDetail) {
   const [title, setTitle] = useState(initialNotice?.title ?? '');
   const [category, setCategory] = useState<number | ''>(initialNotice?.categoryId ?? '');
   const [isRequired, setIsRequired] = useState(initialNotice?.pinned ?? false);
   const [visibility, setVisibility] = useState<NoticeVisibility>(
      initialNotice && !initialNotice.visibleToTrainee ? 'private' : 'public',
   );
   
   const [existingAttachments, setExistingAttachments] = useState<NoticeAttachment[]>(
      initialNotice?.attachments ?? [],
   );
   const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<number>>(new Set());
   const [pendingNewFiles, setPendingNewFiles] = useState<File[]>([]);
   const [pendingAttachments, setPendingAttachments] = useState<UploadedNoticeAttachment[]>([]);
   const [isUploadingFiles, setIsUploadingFiles] = useState(false);
   const [contentHtml, setContentHtml] = useState(initialNotice?.content ?? '');
   const [isContentEmpty, setIsContentEmpty] = useState(!initialNotice?.content);

   // 수정 모드에서 저장 버튼 활성화 여부 판단 기준값
   const [initialSnapshot] = useState({
      title: initialNotice?.title ?? '',
      category: initialNotice?.categoryId ?? ('' as number | ''),
      isRequired: initialNotice?.pinned ?? false,
      visibility: (initialNotice && !initialNotice.visibleToTrainee
         ? 'private'
         : 'public') as NoticeVisibility,
      contentHtml: initialNotice?.content ?? '',
   });

   const hasAttachmentChanges = pendingDeleteIds.size > 0 || pendingNewFiles.length > 0;
   const hasInvalidPendingFile = pendingNewFiles.some(
      (file) => getAttachmentFileError(file) !== null,
   );

   const hasChanges =
      title.trim() !== initialSnapshot.title.trim() ||
      category !== initialSnapshot.category ||
      isRequired !== initialSnapshot.isRequired ||
      visibility !== initialSnapshot.visibility ||
      contentHtml.trim() !== initialSnapshot.contentHtml.trim() ||
      hasAttachmentChanges;

   // Tiptap 에디터의 onUpdate에서 그대로 전달받는 콜백
   const setContent = (html: string, empty: boolean) => {
      setContentHtml(html);
      setIsContentEmpty(empty);
   };

   // 작성 모드 전용
   const uploadPendingAttachments = async (newFiles: File[]) => {
      const currentTotal = existingAttachments.length + pendingAttachments.length;
      if (currentTotal + newFiles.length > MAX_ATTACHMENTS) {
         toast.error(`첨부파일은 공지당 최대 ${MAX_ATTACHMENTS}개까지 등록할 수 있습니다.`);
         return;
      }

      setIsUploadingFiles(true);
      try {
         const uploaded = await uploadNoticeAttachments(newFiles);
         setPendingAttachments((prev) => [...prev, ...uploaded]);
      } catch (err) {
         toast.error(
            err instanceof ApiError
               ? err.message
               : '첨부파일 업로드 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
         );
      } finally {
         setIsUploadingFiles(false);
      }
   };

   const addFiles = (newFiles: File[]) => {
      if (noticeId) {
         const activeExistingCount = existingAttachments.filter(
            (attachment) => !pendingDeleteIds.has(attachment.noticeAttachmentId),
         ).length;
         const currentTotal = activeExistingCount + pendingNewFiles.length;
         if (currentTotal + newFiles.length > MAX_ATTACHMENTS) {
            toast.error(`첨부파일은 공지당 최대 ${MAX_ATTACHMENTS}개까지 등록할 수 있습니다.`);
            return;
         }
         setPendingNewFiles((prev) => [...prev, ...newFiles]);
         return;
      }

      const invalidFile = findInvalidAttachmentFile(newFiles);
      if (invalidFile) {
         toast.error(`${invalidFile.name}: ${getAttachmentFileError(invalidFile)}`);
         return;
      }

      uploadPendingAttachments(newFiles);
   };

   const removeFile = (index: number) => {
      setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
   };

   const removePendingNewFile = (index: number) => {
      setPendingNewFiles((prev) => prev.filter((_, i) => i !== index));
   };

   const removeExistingAttachment = (noticeAttachmentId: number) => {
      if (!noticeId) return;
      setPendingDeleteIds((prev) => new Set(prev).add(noticeAttachmentId));
   };

   const undoRemoveExistingAttachment = (noticeAttachmentId: number) => {
      setPendingDeleteIds((prev) => {
         const next = new Set(prev);
         next.delete(noticeAttachmentId);
         return next;
      });
   };

   const commitAttachmentChanges = async (): Promise<boolean> => {
      if (!noticeId) return true;
      if (pendingDeleteIds.size === 0 && pendingNewFiles.length === 0) return true;

      let allSucceeded = true;

      if (pendingDeleteIds.size > 0) {
         const idsToDelete = Array.from(pendingDeleteIds);
         const results = await Promise.allSettled(
            idsToDelete.map((id) => deleteNoticeAttachment(noticeId, id)),
         );
         const succeededIds = idsToDelete.filter((_, i) => results[i].status === 'fulfilled');

         if (succeededIds.length > 0) {
            const succeededSet = new Set(succeededIds);
            setExistingAttachments((prev) =>
               prev.filter((attachment) => !succeededSet.has(attachment.noticeAttachmentId)),
            );
            setPendingDeleteIds((prev) => {
               const next = new Set(prev);
               succeededIds.forEach((id) => next.delete(id));
               return next;
            });
         }

         if (results.some((result) => result.status === 'rejected')) {
            allSucceeded = false;
            toast.error('일부 첨부파일 삭제에 실패했습니다. 다시 시도해주세요.');
         }
      }

      if (pendingNewFiles.length > 0) {
         try {
            const added = await addNoticeAttachments(noticeId, pendingNewFiles);
            setExistingAttachments((prev) => [...prev, ...added]);
            setPendingNewFiles([]);
         } catch (err) {
            allSucceeded = false;
            toast.error(
               err instanceof ApiError
                  ? err.message
                  : '첨부파일 추가 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            );
         }
      }

      return allSucceeded;
   };

   // 제목/본문/카테고리/공개 설정 모두 값이 있어야 등록 가능
   const isSubmitEnabled =
      title.trim().length > 0 &&
      !isContentEmpty &&
      category !== '' &&
      Boolean(visibility) &&
      !isUploadingFiles &&
      !hasInvalidPendingFile;

   return {
      title,
      setTitle,
      category,
      setCategory,
      isRequired,
      setIsRequired,
      visibility,
      setVisibility,
      existingAttachments,
      pendingDeleteIds,
      removeExistingAttachment,
      undoRemoveExistingAttachment,
      pendingNewFiles,
      removePendingNewFile,
      hasInvalidPendingFile,
      pendingAttachments,
      isUploadingFiles,
      addFiles,
      removeFile,
      commitAttachmentChanges,
      contentHtml,
      setContent,
      isSubmitEnabled,
      hasChanges,
   };
}
