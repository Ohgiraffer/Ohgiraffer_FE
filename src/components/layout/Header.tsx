'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, Settings } from 'lucide-react';
import ProfileDropdown from '@/features/header/components/ProfileDropdown';
import ChatButton from '@/features/chat/components/ChatButton';
import NotificationPanel from '@/features/alarm/components/AlarmPanel';
import { useNotifications } from '@/features/alarm/hooks/useNotifications';
import { useAuth } from '@/components/auth/AuthContext';

export default function Header() {
   const pathname = usePathname();
   const isSettingActive = pathname === '/manager-setting';
   const [isNotificationOpen, setIsNotificationOpen] = useState(false);
   // 관리자 설정은 매니저 role만 접근 가능한 화면이라 헤더에서도 매니저에게만 노출
   const { role } = useAuth();
   const isManager = role === 'MANAGER';
   // 배지 카운트와 알림 패널이 같은 상태를 봐야 하므로 여기서 한 번만 호출해서 아래로 내려줌
   const notifications = useNotifications();

   return (
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between bg-brand-green px-4 text-white">
         <Link href="/" className="flex items-center">
            <Image src="/logo/Main-Logo.png" alt="CampFlow" width={100} height={60} priority />
         </Link>

         <div className="flex items-center gap-2">
            {isManager && (
               <Link
                  href="/manager-setting"
                  aria-label="설정"
                  className={`rounded-xs p-2 transition-colors hover:bg-[#4D655A] ${
                     isSettingActive ? 'bg-[#4D655A]' : ''
                  }`}
               >
                  <Settings size={18} />
               </Link>
            )}
            <button
               type="button"
               aria-label="알림"
               onClick={() => setIsNotificationOpen(true)}
               className="relative rounded-xs p-2 transition-colors hover:bg-[#4D655A]"
            >
               <Bell size={18} />
               {notifications.unreadCount > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FFEEAF] px-1 text-[10px] font-medium leading-none text-black">
                     {notifications.unreadCount}
                  </span>
               )}
            </button>
            <ChatButton />

            <ProfileDropdown />
         </div>

         <NotificationPanel
            open={isNotificationOpen}
            onClose={() => setIsNotificationOpen(false)}
            {...notifications}
         />
      </header>
   );
}
