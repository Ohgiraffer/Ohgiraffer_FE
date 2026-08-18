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
