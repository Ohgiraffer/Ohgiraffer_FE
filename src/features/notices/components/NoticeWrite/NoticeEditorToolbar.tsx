'use client';

import { useState } from 'react';
import type { Editor } from '@tiptap/react';
import { Bold, ImagePlus, Italic, List, ListOrdered, Underline, Wand2 } from 'lucide-react';
import { API_BASE_URL, ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import { uploadNoticeImage } from '@/services/notice.service';

type Props = {
   editor: Editor;
   isImproving: boolean;
   onImproveClick: () => void;
};

type BlockOption = {
   label: string;
   isActive: (editor: Editor) => boolean;
   onSelect: (editor: Editor) => void;
};

// 본문(문단) / 소제목(h3) / 제목(h1) 전환
const BLOCK_OPTIONS: BlockOption[] = [
   {
      label: '본문',
      isActive: (editor) => editor.isActive('paragraph'),
      onSelect: (editor) => editor.chain().focus().setParagraph().run(),
   },
   {
      label: '소제목',
      isActive: (editor) => editor.isActive('heading', { level: 3 }),
      onSelect: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
   },
   {
      label: '제목',
      isActive: (editor) => editor.isActive('heading', { level: 1 }),
      onSelect: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
   },
];

function ToolbarButton({
   active,
   onClick,
   label,
   disabled = false,
   children,
}: {
   active: boolean;
   onClick: () => void;
   label: string;
   disabled?: boolean;
   children: React.ReactNode;
}) {
   return (
      <button
         type="button"
         onClick={onClick}
         disabled={disabled}
         aria-label={label}
         aria-pressed={active}
         className={`cursor-pointer rounded-xs p-1.5 transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
            active ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:bg-[#E6E7EB]'
         }`}
      >
         {children}
      </button>
   );
}

const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png'];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

export default function NoticeEditorToolbar({ editor, isImproving, onImproveClick }: Props) {
   const [isUploadingImage, setIsUploadingImage] = useState(false);

   const handleImageInsert = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/jpeg,image/png';
      input.onchange = async () => {
         const file = input.files?.[0];
         if (!file) return;

         if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
            toast.error('본문 이미지는 JPG, PNG 형식만 넣을 수 있습니다.');
            return;
         }
         if (file.size > MAX_IMAGE_SIZE_BYTES) {
            toast.error('본문 이미지는 장당 5MB를 넘을 수 없습니다.');
            return;
         }

         setIsUploadingImage(true);
         try {
            const { imageUrl } = await uploadNoticeImage(file);
            editor
               .chain()
               .focus()
               .setImage({ src: `${API_BASE_URL}${imageUrl}` })
               .run();
         } catch (err) {
            toast.error(
               err instanceof ApiError
                  ? err.message
                  : '이미지 업로드 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            );
         } finally {
            setIsUploadingImage(false);
         }
      };
      input.click();
   };

   return (
      <div className="flex items-center justify-between bg-[#F9FAFB] border-b border-[#E5E7EB] px-4 py-1.5">
         <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 border-r border-[#E5E7EB] pr-3">
               <ToolbarButton
                  label="굵게"
                  active={editor.isActive('bold')}
                  onClick={() => editor.chain().focus().toggleBold().run()}
               >
                  <Bold size={16} />
               </ToolbarButton>
               <ToolbarButton
                  label="기울임"
                  active={editor.isActive('italic')}
                  onClick={() => editor.chain().focus().toggleItalic().run()}
               >
                  <Italic size={16} />
               </ToolbarButton>
               <ToolbarButton
                  label="밑줄"
                  active={editor.isActive('underline')}
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
               >
                  <Underline size={16} />
               </ToolbarButton>
            </div>

            <div className="flex items-center gap-1 border-r border-[#E5E7EB] pr-3">
               {BLOCK_OPTIONS.map((option) => (
                  <button
                     key={option.label}
                     type="button"
                     onClick={() => option.onSelect(editor)}
                     className={`cursor-pointer rounded-xs px-2.5 py-1 text-sm font-medium transition-colors ${
                        option.isActive(editor)
                           ? 'bg-brand-green text-white'
                           : 'text-gray-500 hover:bg-[#E6E7EB]'
                     }`}
                  >
                     {option.label}
                  </button>
               ))}
            </div>

            <div className="flex items-center gap-1">
               <ToolbarButton
                  label="이미지 삽입"
                  active={false}
                  disabled={isUploadingImage}
                  onClick={handleImageInsert}
               >
                  <ImagePlus size={16} />
               </ToolbarButton>
               <ToolbarButton
                  label="글머리 기호 목록"
                  active={editor.isActive('bulletList')}
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
               >
                  <List size={16} />
               </ToolbarButton>
               <ToolbarButton
                  label="번호 매기기 목록"
                  active={editor.isActive('orderedList')}
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
               >
                  <ListOrdered size={16} />
               </ToolbarButton>
            </div>
         </div>

         <div className="flex items-center gap-2">
            <button
               type="button"
               disabled={isImproving}
               onClick={onImproveClick}
               className="flex cursor-pointer items-center gap-1.5 rounded-xs border border-brand-green bg-white px-3 py-1.5 text-sm text-brand-green transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
               <Wand2 size={14} />
               {isImproving ? '개선 중...' : 'AI 문장 개선'}
            </button>
         </div>
      </div>
   );
}
