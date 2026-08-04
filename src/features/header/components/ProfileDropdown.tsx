'use client';

import { ChevronDown, LogOut, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

// 로그인 기능이 붙기 전까지 쓰는 더미 사용자 정보
const dummyUser = {
   name: '이매니저',
   role: '매니저',
};

export default function ProfileDropdown() {
   const [isMenuOpen, setIsMenuOpen] = useState(false);
   const containerRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      if (!isMenuOpen) return;

      // 드롭다운 바깥을 클릭하면 닫히도록 처리
      const handleClickOutside = (event: MouseEvent) => {
         if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
            setIsMenuOpen(false);
         }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
   }, [isMenuOpen]);

   return (
      <div ref={containerRef} className="relative">
         <button
            type="button"
            onClick={() => setIsMenuOpen((prev) => !prev)}
            className={`flex items-center gap-2 rounded-xs px-2 py-1.5 transition-colors hover:bg-[#4D655A] ${
               isMenuOpen ? 'bg-[#4D655A]' : ''
            }`}
         >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-gray-600">
               <User size={16} />
            </span>
            <span className="text-left text-xs leading-tight">
               <span className="block font-semibold">{dummyUser.name}</span>
               <span className="block text-[11px] text-white/80">{dummyUser.role}</span>
            </span>
            <ChevronDown size={14} />
         </button>

         {isMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-40 rounded-xs border border-gray-200 bg-white text-gray-800">
               <div className="flex items-center p-3 gap-2">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-600">
                     <User size={18} />
                  </span>
                  <div>
                     <p className="text-sm font-semibold">{dummyUser.name}</p>
                     <p className="text-xs text-gray-500">{dummyUser.role}</p>
                  </div>
               </div>

               <div className="border-t border-gray-200" />

               <button
                  type="button"
                  className="flex w-full items-center gap-2 whitespace-nowrap rounded-xs p-3 text-sm font-medium hover:bg-gray-50"
               >
                  <User size={16} />
                  프로필 사진 등록
               </button>

               <button
                  type="button"
                  className="flex w-full items-center gap-2 whitespace-nowrap rounded-xs p-3 text-sm font-medium text-brand-red hover:bg-gray-50"
               >
                  <LogOut size={16} />
                  로그아웃
               </button>
            </div>
         )}
      </div>
   );
}
