'use client';

import { useState } from 'react';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import {
   deleteNoticeAttachment,
   uploadNoticeAttachments,
   type NoticeAttachment,
   type NoticeDetail,
   type UploadedNoticeAttachment,
} from '@/services/notice.service';
import type { NoticeVisibility } from '../types';

const MAX_ATTACHMENTS = 5;

// 공지 작성/수정 폼 전체 상태와 "등록"/"수정 완료" 버튼 활성화 조건을 관리하는 훅.
// initialNotice가 주어지면(=실제 상세 조회 API 응답) 수정 모드로 간주하고 해당 값으로 초기 상태를 채움.
// noticeId는 수정 모드에서 기존 첨부파일을 삭제할 때 필요(작성 모드에서는 아직 공지가 없어 사용하지 않음)
export function useNoticeWriteForm(noticeId?: number, initialNotice?: NoticeDetail) {
   const [title, setTitle] = useState(initialNotice?.title ?? '');
   const [category, setCategory] = useState<number | ''>(initialNotice?.categoryId ?? '');
   const [isRequired, setIsRequired] = useState(initialNotice?.pinned ?? false);
   const [visibility, setVisibility] = useState<NoticeVisibility>(
      initialNotice && !initialNotice.visibleToTrainee ? 'private' : 'public',
   );
   // 이미 서버에 저장돼있는 첨부파일 목록
   const [existingAttachments, setExistingAttachments] = useState<NoticeAttachment[]>(
      initialNotice?.attachments ?? [],
   );
   // 작성 중 즉시 업로드해서 등록 요청에 그대로 실어 보낼 첨부파일들 - 실제 File이 아니라 업로드 응답값
   const [pendingAttachments, setPendingAttachments] = useState<UploadedNoticeAttachment[]>([]);
   const [isUploadingFiles, setIsUploadingFiles] = useState(false);
   const [contentHtml, setContentHtml] = useState(initialNotice?.content ?? '');
   const [isContentEmpty, setIsContentEmpty] = useState(!initialNotice?.content);

   // 수정 모드에서 "저장" 활성화 여부를 판단할 기준값(최초 로드 시점 값, 이후 절대 바뀌지 않음) -
   // setter를 안 쓰는 state로 고정해서 리렌더 중에도 안전하게 읽을 수 있게 한다(ref는 렌더 중 접근 금지).
   // PUT 요청에 포함되지 않는 첨부파일은 비교 대상에서 제외한다(추가/삭제가 각자 별도 API로 즉시 반영됨)
   const [initialSnapshot] = useState({
      title: initialNotice?.title ?? '',
      category: initialNotice?.categoryId ?? ('' as number | ''),
      isRequired: initialNotice?.pinned ?? false,
      visibility: (initialNotice && !initialNotice.visibleToTrainee
         ? 'private'
         : 'public') as NoticeVisibility,
      contentHtml: initialNotice?.content ?? '',
   });

   // 여백(공백/줄바꿈)만 바뀐 경우는 실질적인 수정으로 보지 않는다 - 제목/본문 모두 trim 후 비교
   const hasChanges =
      title.trim() !== initialSnapshot.title.trim() ||
      category !== initialSnapshot.category ||
      isRequired !== initialSnapshot.isRequired ||
      visibility !== initialSnapshot.visibility ||
      contentHtml.trim() !== initialSnapshot.contentHtml.trim();

   // Tiptap 에디터의 onUpdate에서 그대로 전달받는 콜백
   const setContent = (html: string, empty: boolean) => {
      setContentHtml(html);
      setIsContentEmpty(empty);
   };

   // 파일 선택창에서 고른 파일들을 등록 버튼을 누를 때가 아니라 고르는 즉시 업로드한다.
   // 서버는 개수 제한(5개)을 이 호출 단위로만 검사하기 때문에, 여러 번에 나눠 올려 누적으로
   // 초과하는 경우는 프론트에서 직접 막아야 한다
   const addFiles = async (newFiles: File[]) => {
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

   // 아직 등록 요청으로 보내지 않은(방금 업로드한) 첨부파일 제거 - 로컬 목록에서만 지우면 된다.
   // 실제 파일은 저장소에 남지만 어느 공지에도 연결되지 않은 채로 남는 게 정상 동작(서버 관리 대상)
   const removeFile = (index: number) => {
      setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
   };

   // 이미 저장돼있던 첨부파일 삭제 - 수정 모드에서만 호출됨(작성 모드에는 noticeId가 없어 아무 것도 안 함)
   const removeExistingAttachment = async (noticeAttachmentId: number) => {
      if (!noticeId) return;

      try {
         await deleteNoticeAttachment(noticeId, noticeAttachmentId);
         setExistingAttachments((prev) =>
            prev.filter((attachment) => attachment.noticeAttachmentId !== noticeAttachmentId),
         );
      } catch (err) {
         toast.error(
            err instanceof ApiError
               ? err.message
               : '첨부파일 삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
         );
      }
   };

   // 제목/본문/카테고리/공개 설정 모두 값이 있어야 등록 가능 (공개 설정은 기본값이 있어 항상 충족됨).
   // 파일 업로드가 진행 중일 때는 그 결과(fileKey)가 아직 준비되지 않았으니 제출을 막는다
   const isSubmitEnabled =
      title.trim().length > 0 &&
      !isContentEmpty &&
      category !== '' &&
      Boolean(visibility) &&
      !isUploadingFiles;

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
      removeExistingAttachment,
      pendingAttachments,
      isUploadingFiles,
      addFiles,
      removeFile,
      contentHtml,
      setContent,
      isSubmitEnabled,
      hasChanges,
   };
}
