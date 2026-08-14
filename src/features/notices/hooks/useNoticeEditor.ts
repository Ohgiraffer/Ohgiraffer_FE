'use client';

import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';

// 공지 본문 편집기(Tiptap) 인스턴스
export function useNoticeEditor(
   initialContentHtml: string | undefined,
   onContentChange: (html: string, isEmpty: boolean) => void,
) {
   return useEditor({
      extensions: [
         StarterKit.configure({ heading: { levels: [1, 3] } }),
         Underline,
         Image,
         Placeholder.configure({ placeholder: '본문 내용을 입력해주세요' }),
      ],
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
}
