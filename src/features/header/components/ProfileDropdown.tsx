'use client';

import { ChevronDown, LogOut, User } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
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
   const menuRef = useRef<HTMLDivElement>(null);
   // 메뉴를 document.body에 포탈로 띄워서(헤더가 position 없는 일반 엘리먼트라 z-index가 알림/채팅
   // 우측 패널의 stacking context에 갇혀 패널 아래로 깔리는 문제 방지) 트리거 버튼의 화면 좌표를
   // 직접 계산해 위치를 맞춘다
   const [menuPosition, setMenuPosition] = useState<{ top: number; right: number } | null>(null);

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

   const handleToggleMenu = () => {
      if (!isMenuOpen && containerRef.current) {
         const rect = containerRef.current.getBoundingClientRect();
         setMenuPosition({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
      }
      setIsMenuOpen((prev) => !prev);
   };

   useEffect(() => {
      if (!isMenuOpen) return;

      // 드롭다운 바깥을 클릭하면 닫히도록 처리 - 메뉴가 포탈이라 containerRef 안이 아니므로 따로 체크
      const handleClickOutside = (event: MouseEvent) => {
         const target = event.target as Node;
         if (containerRef.current?.contains(target)) return;
         if (menuRef.current?.contains(target)) return;
         setIsMenuOpen(false);
      };

      // 메뉴가 열린 채로 뷰포트 폭이 바뀌면 right 값이 이전 뷰포트 기준으로 남아 트리거 버튼과
      // 어긋난다 - 열려있는 동안은 리사이즈마다 트리거 좌표를 다시 읽어 위치를 맞춘다
      const handleResize = () => {
         if (!containerRef.current) return;
         const rect = containerRef.current.getBoundingClientRect();
         setMenuPosition({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
      };

      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('resize', handleResize);
      return () => {
         document.removeEventListener('mousedown', handleClickOutside);
         window.removeEventListener('resize', handleResize);
      };
   }, [isMenuOpen]);

   return (
      <div ref={containerRef} className="relative">
         <button
            type="button"
            onClick={handleToggleMenu}
            className={`flex items-center gap-2 rounded-xs px-2 py-1.5 transition-colors hover:bg-[#4D655A] ${
               isMenuOpen ? 'bg-[#4D655A]' : ''
            }`}
         >
            <span className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white text-gray-600">
               {profileImageUrl ? (
                  <Image src={profileImageUrl} alt="" fill sizes="28px" className="object-cover" />
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

         {isMenuOpen &&
            menuPosition &&
            createPortal(
               <div
                  ref={menuRef}
                  style={{ top: menuPosition.top, right: menuPosition.right }}
                  className="fixed z-70 w-max min-w-40 max-w-xs rounded-xs border border-gray-200 bg-white text-gray-800"
               >
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
               </div>,
               document.body,
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
