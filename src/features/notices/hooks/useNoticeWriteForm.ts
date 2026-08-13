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

// 작성 모드는 고르는 즉시 업로드하므로, 형식/용량이 안 맞으면 네트워크를 타기 전에 통째로 막는다
// (서버의 "한 건이라도 걸리면 전부 실패" 방식과 동일)
function findInvalidAttachmentFile(files: File[]) {
   return files.find(
      (file) => !isAllowedAttachmentFile(file) || file.size > MAX_ATTACHMENT_SIZE_BYTES,
   );
}

// 수정 모드는 저장을 눌러야 실제로 업로드되므로, 그 전엔 형식/용량이 안 맞는 파일도 일단 목록에는
// 올려서 사용자가 뭘 골랐는지 보여주고, 이 함수로 계산한 오류 문구를 빨간 글씨로 붙여 보여준다.
// null이면 문제 없는 파일
export function getAttachmentFileError(file: File): string | null {
   if (!isAllowedAttachmentFile(file)) return '지원하지 않는 형식입니다';
   if (file.size > MAX_ATTACHMENT_SIZE_BYTES) return '10MB를 초과합니다';
   return null;
}

// 공지 작성/수정 폼 전체 상태와 "등록"/"수정 완료" 버튼 활성화 조건을 관리하는 훅.
// initialNotice가 주어지면(=실제 상세 조회 API 응답) 수정 모드로 간주하고 해당 값으로 초기 상태를 채움.
// noticeId는 수정 모드에서만 쓰임(작성 모드에서는 아직 공지가 없어 사용하지 않음)
export function useNoticeWriteForm(noticeId?: number, initialNotice?: NoticeDetail) {
   const [title, setTitle] = useState(initialNotice?.title ?? '');
   const [category, setCategory] = useState<number | ''>(initialNotice?.categoryId ?? '');
   const [isRequired, setIsRequired] = useState(initialNotice?.pinned ?? false);
   const [visibility, setVisibility] = useState<NoticeVisibility>(
      initialNotice && !initialNotice.visibleToTrainee ? 'private' : 'public',
   );
   // 이미 서버에 저장돼있는 첨부파일 목록 - 저장을 눌러 commitAttachmentChanges가 실제로 성공하기
   // 전까지는 여기서 지우거나 더하지 않는다(그 전엔 화면에만 "삭제/추가 예정"으로 표시)
   const [existingAttachments, setExistingAttachments] = useState<NoticeAttachment[]>(
      initialNotice?.attachments ?? [],
   );
   // 수정 모드 - 삭제 예정으로 표시만 해둔(아직 DELETE 호출 안 한) 기존 첨부파일 id
   const [pendingDeleteIds, setPendingDeleteIds] = useState<Set<number>>(new Set());
   // 수정 모드 - 추가 예정으로 골라둔(아직 업로드 API 호출 안 한) 새 파일. 작성 모드의
   // pendingAttachments와 달리 실제 File 그대로 들고 있다가 저장 시점에야 업로드한다
   const [pendingNewFiles, setPendingNewFiles] = useState<File[]>([]);
   // 작성 중 즉시 업로드해서 등록 요청에 그대로 실어 보낼 첨부파일들 - 실제 File이 아니라 업로드 응답값.
   // 작성 모드는 등록 API 자체가 첨부를 함께 받기 때문에 지연 반영이 필요 없다(원래도 등록 버튼을
   // 눌러야만 공지에 실제로 연결됨)
   const [pendingAttachments, setPendingAttachments] = useState<UploadedNoticeAttachment[]>([]);
   const [isUploadingFiles, setIsUploadingFiles] = useState(false);
   const [contentHtml, setContentHtml] = useState(initialNotice?.content ?? '');
   const [isContentEmpty, setIsContentEmpty] = useState(!initialNotice?.content);

   // 수정 모드에서 "저장" 활성화 여부를 판단할 기준값(최초 로드 시점 값, 이후 절대 바뀌지 않음) -
   // setter를 안 쓰는 state로 고정해서 리렌더 중에도 안전하게 읽을 수 있게 한다(ref는 렌더 중 접근 금지).
   const [initialSnapshot] = useState({
      title: initialNotice?.title ?? '',
      category: initialNotice?.categoryId ?? ('' as number | ''),
      isRequired: initialNotice?.pinned ?? false,
      visibility: (initialNotice && !initialNotice.visibleToTrainee
         ? 'private'
         : 'public') as NoticeVisibility,
      contentHtml: initialNotice?.content ?? '',
   });

   // 첨부파일 변경은 저장을 눌러야 반영되므로, "바뀐 게 있다"는 아직 스테이징된 삭제/추가가
   // 있는지만 보면 된다(existingAttachments 자체는 저장 전까지 그대로임)
   const hasAttachmentChanges = pendingDeleteIds.size > 0 || pendingNewFiles.length > 0;
   // 추가 예정 파일 중 형식/용량이 안 맞는 게 하나라도 있으면 저장 자체를 막는다 - 그대로 저장을
   // 누르면 저장 시점에야 실패를 알게 되는데, 그때는 이미 본문 PUT은 성공한 뒤라 되돌리기 애매해진다
   const hasInvalidPendingFile = pendingNewFiles.some(
      (file) => getAttachmentFileError(file) !== null,
   );

   // 여백(공백/줄바꿈)만 바뀐 경우는 실질적인 수정으로 보지 않는다 - 제목/본문 모두 trim 후 비교
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

   // 작성 모드 전용 - 고르는 즉시 업로드한다(등록 API가 첨부를 함께 받으므로 어차피 공지 등록
   // 전까지는 서버에도 "미연결" 상태로만 존재)
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

   // 파일 선택 - 작성 모드는 위 uploadPendingAttachments로 즉시 업로드하고, 수정 모드는 저장을
   // 누를 때까지 실제 File을 로컬에만 쌓아둔다(서버에 아무 것도 보내지 않음).
   // 개수 제한(구조적 제약)은 두 모드 모두 선택 즉시 막지만, 형식/용량(파일 각각의 문제)은 모드별로
   // 다르게 처리한다 - 작성 모드는 바로 업로드하니 네트워크를 타기 전에 통째로 막고, 수정 모드는
   // 일단 목록에 올려서 보여주고 저장 버튼을 잠가 사용자가 직접 빼거나 다른 파일로 바꾸게 한다
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

   // 작성 모드 - 아직 등록 요청으로 보내지 않은(방금 업로드한) 첨부파일 제거. 실제 파일은 저장소에
   // 남지만 어느 공지에도 연결되지 않은 채로 남는 게 정상 동작(서버 관리 대상)
   const removeFile = (index: number) => {
      setPendingAttachments((prev) => prev.filter((_, i) => i !== index));
   };

   // 수정 모드 - 아직 업로드하지 않은(저장 전) 새 파일을 목록에서 뺀다. 로컬에서만 지우면 되고
   // 서버에 아무 것도 보낸 적이 없으니 되돌릴 것도 없다
   const removePendingNewFile = (index: number) => {
      setPendingNewFiles((prev) => prev.filter((_, i) => i !== index));
   };

   // 수정 모드 - 기존 첨부파일을 "삭제 예정"으로 표시만 해둔다(실제 삭제 API는 저장 시점에 호출).
   // 작성 모드에는 noticeId가 없어 아무 것도 안 함
   const removeExistingAttachment = (noticeAttachmentId: number) => {
      if (!noticeId) return;
      setPendingDeleteIds((prev) => new Set(prev).add(noticeAttachmentId));
   };

   // 수정 모드 - "삭제 예정" 표시를 취소(실제로 지운 적이 없으니 그냥 표시만 되돌리면 됨)
   const undoRemoveExistingAttachment = (noticeAttachmentId: number) => {
      setPendingDeleteIds((prev) => {
         const next = new Set(prev);
         next.delete(noticeAttachmentId);
         return next;
      });
   };

   // 저장 확정 시점에 스테이징해둔 첨부파일 변경사항(삭제/추가)을 실제로 반영한다 - 작성 모드는
   // 등록 API가 첨부를 함께 받으므로 여기서 할 일이 없다.
   // 삭제·추가는 각각 별도 API라 부분 실패가 가능하다(예: 삭제하려던 파일이 이미 없어졌거나 네트워크
   // 오류) - best-effort로 처리하고, 성공한 항목만 반영해서 실패한 항목은 스테이징된 채로 남겨
   // 다음 저장 시도에서 자동으로 재시도되게 한다. 반환값은 전부 성공했는지 여부
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

   // 제목/본문/카테고리/공개 설정 모두 값이 있어야 등록 가능 (공개 설정은 기본값이 있어 항상 충족됨).
   // 작성 모드에서 파일 업로드가 진행 중일 때는 그 결과(fileKey)가 아직 준비되지 않았으니 제출을 막고,
   // 수정 모드에서 형식/용량이 안 맞는 추가 예정 파일이 남아있을 때도 저장을 막는다
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
