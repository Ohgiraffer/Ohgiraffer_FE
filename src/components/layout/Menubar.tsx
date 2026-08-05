'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
   Home,
   Megaphone,
   ClipboardList,
   CalendarDays,
   Users,
   Upload,
   Building,
   FileCheck2,
   BarChart2,
   type LucideIcon,
} from 'lucide-react';

type MenuItem = {
   label: string;
   href: string;
   icon: LucideIcon;
};

// 운영진(강사/매니저) 메뉴. role enum이 백엔드에서 준비되면 학생 메뉴(상담 신청 라벨, 팀 관리/평가 관리 제외)와 분기 처리 예정
const MANAGER_MENU_ITEMS: MenuItem[] = [
   { label: '대시보드', href: '/', icon: Home },
   { label: '공지사항', href: '/notices', icon: Megaphone },
   { label: '훈련생 관리', href: '/attendance', icon: ClipboardList },
   { label: '상담 이력', href: '/counseling', icon: CalendarDays },
   { label: '팀 관리', href: '/team', icon: Users },
   { label: '제출물 관리', href: '/submissions', icon: Upload },
   { label: '공간 예약', href: '/space-reservations', icon: Building },
   { label: '전자결재', href: '/approvals', icon: FileCheck2 },
   { label: '평가 관리', href: '/evaluations', icon: BarChart2 },
];

export default function Menubar() {
   const pathname = usePathname();

   return (
      <aside className="sticky top-14 flex h-[calc(100vh-3rem)] w-22.5 shrink-0 flex-col gap-0.5 border-r border-gray-200 bg-white p-2">
         {MANAGER_MENU_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);

            return (
               <Link
                  key={href}
                  href={href}
                  className={`flex cursor-pointer flex-col items-center gap-1 rounded-sm px-1.5 py-3 text-[11px] font-semibold transition-colors ${
                     isActive ? 'bg-brand-green text-white' : 'text-[#3B4150] hover:bg-[#F7F8FA]'
                  }`}
               >
                  <Icon size={22} />
                  {label}
               </Link>
            );
         })}
      </aside>
   );
}
