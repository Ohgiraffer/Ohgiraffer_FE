'use client';

import { EditorContent, type Editor } from '@tiptap/react';
import NoticeEditorToolbar from './NoticeEditorToolbar';

type Props = {
   editor: Editor;
   isImproving: boolean;
   onImproveClick: () => void;
};

// 에디터 인스턴스는 상위(NoticeWriteClient)에서 만들어 내려받는다 - useNoticeEditor 참고
export default function NoticeEditor({ editor, isImproving, onImproveClick }: Props) {
   return (
      <div>
         <NoticeEditorToolbar
            editor={editor}
            isImproving={isImproving}
            onImproveClick={onImproveClick}
         />
         <EditorContent editor={editor} />
      </div>
   );
}
