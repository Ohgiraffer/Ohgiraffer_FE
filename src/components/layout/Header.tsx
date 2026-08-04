'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, MessageSquare, Settings } from 'lucide-react';
import ProfileDropdown from '@/features/header/components/ProfileDropdown';

export default function Header() {
   const pathname = usePathname();
   const isSettingActive = pathname === '/manager-setting';

   return (
      <header className="sticky top-0 z-50 flex h-14 items-center justify-between bg-brand-green px-4 text-white">
         <Link href="/" className="flex items-center">
            <Image src="/logo/MainLogo.png" alt="CampFlow" width={68} height={24} priority />
         </Link>

         <div className="flex items-center gap-2">
            <Link
               href="/manager-setting"
               aria-label="설정"
               className={`rounded-xs p-2 transition-colors hover:bg-[#4D655A] ${
                  isSettingActive ? 'bg-[#4D655A]' : ''
               }`}
            >
               <Settings size={18} />
            </Link>
            <button
               type="button"
               aria-label="알림"
               className="rounded-xs p-2 transition-colors hover:bg-[#4D655A]"
            >
               <Bell size={18} />
            </button>
            <button
               type="button"
               aria-label="채팅"
               className="rounded-xs p-2 transition-colors hover:bg-[#4D655A]"
            >
               <MessageSquare size={18} />
            </button>

            <ProfileDropdown />
         </div>
      </header>
   );
}
