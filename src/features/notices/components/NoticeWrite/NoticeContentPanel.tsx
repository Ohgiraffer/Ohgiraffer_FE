'use client';

import type { ReactNode } from 'react';

type Props = {
   title: string;
   onTitleChange: (title: string) => void;
   children: ReactNode;
};

// 왼쪽 영역 - 제목 입력 + 본문 편집기(툴바 포함)
export default function NoticeContentPanel({ title, onTitleChange, children }: Props) {
   return (
      <div className="h-131.75 min-w-0 flex-1 rounded-t-sm border border-[#E5E7EB] bg-white">
         <div className="border-b border-[#E5E7EB] px-4 py-3">
            <label htmlFor="notice-title" className="text-[15px] font-semibold text-gray-900">
               제목<span className="font-bold text-[16px] text-brand-gold">*</span>
            </label>
            <input
               id="notice-title"
               type="text"
               value={title}
               onChange={(event) => onTitleChange(event.target.value)}
               placeholder="공지 제목을 입력해주세요"
               className="mt-2 w-full rounded-xs border border-[#E5E7EB] px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-brand-green"
            />
         </div>

         {children}
      </div>
   );
}
