'use client';

import { ChevronDown, LogOut, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthContext';
import { ROLE_LABELS } from '@/services/auth.service';
import ProfileImageModal from './ProfileImageModal';

export default function ProfileDropdown() {
   const router = useRouter();
   const { me, role, updateProfileImageUrl, logout } = useAuth();
   const [isMenuOpen, setIsMenuOpen] = useState(false);
   const [isLoggingOut, setIsLoggingOut] = useState(false);
   const [isImageModalOpen, setIsImageModalOpen] = useState(false);
   const containerRef = useRef<HTMLDivElement>(null);

   const displayName = me?.name ?? '사용자';
   const displayRole = role ? ROLE_LABELS[role] : '';
   const profileImageUrl = me?.profileImgUrl ?? null;

   const handleLogout = async () => {
      if (isLoggingOut) return;
      setIsLoggingOut(true);
      try {
         await logout();
      } catch {
         // 이미 로그아웃되었거나(401) 토큰 문제여도 클라이언트 상태는 정리 후 로그인 페이지로
      } finally {
         setIsLoggingOut(false);
         setIsMenuOpen(false);
         router.push('/login');
      }
   };

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
            <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-gray-600">
               {profileImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- 동적 S3 URL이라 next/image 설정 없이 바로 사용
                  <img src={profileImageUrl} alt="" className="h-full w-full object-cover" />
               ) : (
                  <User size={16} />
               )}
            </span>
            <span className="text-left text-xs leading-tight">
               <span className="block truncate font-semibold">{displayName}</span>
               <span className="block text-[11px] text-white/80">{displayRole}</span>
            </span>
            <ChevronDown size={14} />
         </button>

         {isMenuOpen && (
            <div className="absolute right-0 top-full z-70 mt-2 w-max min-w-40 max-w-xs rounded-xs border border-gray-200 bg-white text-gray-800">
               <div className="flex items-center p-3 gap-2">
                  <div className="min-w-0">
                     {me?.email && <p className="truncate text-sm text-gray-600">{me.email}</p>}
                  </div>
               </div>

               <div className="border-t border-gray-200" />

               <button
                  type="button"
                  onClick={() => {
                     setIsMenuOpen(false);
                     setIsImageModalOpen(true);
                  }}
                  className="flex w-full items-center gap-2 whitespace-nowrap rounded-xs p-3 text-sm font-medium hover:bg-gray-50"
               >
                  <User size={16} />
                  프로필 사진 등록
               </button>

               <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex w-full items-center gap-2 whitespace-nowrap rounded-xs p-3 text-sm font-medium text-brand-red hover:bg-gray-50 disabled:opacity-60"
               >
                  <LogOut size={16} />
                  {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
               </button>
            </div>
         )}

         {isImageModalOpen && (
            <ProfileImageModal
               currentImageUrl={profileImageUrl}
               onClose={() => setIsImageModalOpen(false)}
               onUploaded={updateProfileImageUrl}
            />
         )}
      </div>
   );
}
