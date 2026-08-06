'use client';

import { EditorContent, useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import NoticeEditorToolbar from './NoticeEditorToolbar';

type Props = {
   initialContentHtml?: string;
   onContentChange: (html: string, isEmpty: boolean) => void;
};

export default function NoticeEditor({ initialContentHtml, onContentChange }: Props) {
   const editor = useEditor({
      extensions: [
         StarterKit.configure({ heading: { levels: [1, 3] } }),
         Underline,
         Image,
         Placeholder.configure({ placeholder: '본문 내용을 입력해주세요' }),
      ],
      // 수정 모드일 때 기존 본문으로 초기화 - content는 마운트 시점에만 적용됨
      content: initialContentHtml,
      immediatelyRender: false,
      editorProps: {
         attributes: {
            class: 'notice-editor-content h-[375px] overflow-y-auto px-6 py-5 text-sm focus:outline-none',
         },
      },
      onUpdate: ({ editor }) => {
         onContentChange(editor.getHTML(), editor.isEmpty);
      },
   });

   if (!editor) return null;

   return (
      <div>
         <NoticeEditorToolbar editor={editor} />
         <EditorContent editor={editor} />
      </div>
   );
}
