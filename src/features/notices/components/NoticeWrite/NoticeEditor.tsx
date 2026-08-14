'use client';

import { EditorContent, type Editor } from '@tiptap/react';
import NoticeEditorToolbar from './NoticeEditorToolbar';

type Props = {
   editor: Editor;
   isImproving: boolean;
   onImproveClick: () => void;
};

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
