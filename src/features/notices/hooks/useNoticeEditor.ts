'use client';

import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';

// 공지 본문 편집기(Tiptap) 인스턴스를 만든다. NoticeEditor(실제로 렌더링되는 곳)가 아니라 상위
// (NoticeWriteClient)에서 이 훅을 호출하는 이유는, [AI 문장 개선] 제안 패널이 고정 높이인
// NoticeContentPanel 카드 밖(전체 너비)에 그려져야 해서 editor.getText()/setContent()에
// 상위에서도 접근할 수 있어야 하기 때문
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
}
