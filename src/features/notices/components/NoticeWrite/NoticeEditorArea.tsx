'use client';

import { useEffect } from 'react';
import type { Editor } from '@tiptap/react';
import { useNoticeEditor } from '../../hooks/useNoticeEditor';
import NoticeEditor from './NoticeEditor';

type Props = {
   initialContentHtml: string | undefined;
   onContentChange: (html: string, isEmpty: boolean) => void;
   isImproving: boolean;
   onImproveClick: () => void;
   onEditorReady: (editor: Editor | null) => void;
};

// Tiptap 엔진(@tiptap/*)을 실제로 statically import하는 지점 - NoticeWriteClient에서
// next/dynamic으로 이 컴포넌트 자체를 지연 로딩해서, 공지 작성 화면이 아닌 다른 페이지
// 번들에는 Tiptap이 전혀 포함되지 않게 한다
export default function NoticeEditorArea({
   initialContentHtml,
   onContentChange,
   isImproving,
   onImproveClick,
   onEditorReady,
}: Props) {
   const editor = useNoticeEditor(initialContentHtml, onContentChange);

   useEffect(() => {
      onEditorReady(editor ?? null);
   }, [editor, onEditorReady]);

   if (!editor) return null;

   return <NoticeEditor editor={editor} isImproving={isImproving} onImproveClick={onImproveClick} />;
}
