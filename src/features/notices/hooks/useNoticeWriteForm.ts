'use client';

import { useState } from 'react';
import type { NoticeAttachment, NoticeEntry, NoticeVisibility } from '../types';

// 공지 작성/수정 폼 전체 상태와 "등록"/"수정 완료" 버튼 활성화 조건을 관리하는 훅
// initialNotice가 주어지면 수정 모드로 간주하고 해당 값으로 초기 상태를 채움
export function useNoticeWriteForm(initialNotice?: NoticeEntry) {
   const [title, setTitle] = useState(initialNotice?.title ?? '');
   const [category, setCategory] = useState(initialNotice?.category ?? '');
   const [isRequired, setIsRequired] = useState(initialNotice?.isPinned ?? false);
   const [visibility, setVisibility] = useState<NoticeVisibility>(
      initialNotice?.visibility ?? 'public',
   );
   const [files, setFiles] = useState<File[]>([]);
   const [existingAttachments, setExistingAttachments] = useState<NoticeAttachment[]>(
      initialNotice?.attachments ?? [],
   );
   const [contentHtml, setContentHtml] = useState(initialNotice?.contentHtml ?? '');
   const [isContentEmpty, setIsContentEmpty] = useState(!initialNotice?.contentHtml);

   // Tiptap 에디터의 onUpdate에서 그대로 전달받는 콜백
   const setContent = (html: string, empty: boolean) => {
      setContentHtml(html);
      setIsContentEmpty(empty);
   };

   // 파일 선택창에서 고른 파일들을 기존 목록 뒤에 이어붙임 (여러 번 선택 시 계속 쌓이도록)
   const addFiles = (newFiles: File[]) => {
      setFiles((prev) => [...prev, ...newFiles]);
   };

   const removeFile = (index: number) => {
      setFiles((prev) => prev.filter((_, i) => i !== index));
   };

   // 수정 모드에서 불러온, 이미 등록되어 있던 첨부파일 제거
   const removeExistingAttachment = (index: number) => {
      setExistingAttachments((prev) => prev.filter((_, i) => i !== index));
   };

   // 제목/본문/카테고리/공개 설정 모두 값이 있어야 등록 가능 (공개 설정은 기본값이 있어 항상 충족됨)
   const isSubmitEnabled =
      title.trim().length > 0 &&
      !isContentEmpty &&
      category.trim().length > 0 &&
      Boolean(visibility);

   return {
      title,
      setTitle,
      category,
      setCategory,
      isRequired,
      setIsRequired,
      visibility,
      setVisibility,
      files,
      addFiles,
      removeFile,
      existingAttachments,
      removeExistingAttachment,
      contentHtml,
      setContent,
      isSubmitEnabled,
   };
}
