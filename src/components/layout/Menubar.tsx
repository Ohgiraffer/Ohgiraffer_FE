'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
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
import { useAuth } from '@/components/auth/AuthContext';
import { hasUnsavedChanges } from '@/lib/navigationGuard';
import ConfirmModal from '@/components/ui/ConfirmModal';

type MenuItem = {
   label: string;
   href: string;
   icon: LucideIcon;
};

// 강사·매니저(운영진) 공용 메뉴 - 두 role의 사이드바 구성/라벨은 동일하고, 페이지 안의 화면 내용만 role별로 달라짐
const STAFF_MENU_ITEMS: MenuItem[] = [
   { label: '대시보드', href: '/', icon: Home },
   { label: '공지사항', href: '/notices', icon: Megaphone },
   { label: '훈련생 관리', href: '/tracker', icon: ClipboardList },
   { label: '상담 이력', href: '/counseling', icon: CalendarDays },
   { label: '팀 관리', href: '/team', icon: Users },
   { label: '제출물 관리', href: '/submissions', icon: Upload },
   { label: '공간 예약', href: '/space-reservations', icon: Building },
   { label: '전자결재', href: '/approvals', icon: FileCheck2 },
   { label: '평가 관리', href: '/evaluations', icon: BarChart2 },
];

// 학생 메뉴 - 평가 관리만 제외, "출결 관리"→"훈련 현황" / "상담 이력"→"상담 신청" / "팀 관리"→"팀 현황"
// (조회 전용 화면이라 편집 권한이 있다는 인상을 주지 않도록) 라벨만 다름 (href는 동일, 화면 내용만 role별로 다름)
const STUDENT_MENU_ITEMS: MenuItem[] = [
   { label: '대시보드', href: '/', icon: Home },
   { label: '공지사항', href: '/notices', icon: Megaphone },
   { label: '훈련 현황', href: '/tracker', icon: ClipboardList },
   { label: '상담 신청', href: '/counseling', icon: CalendarDays },
   { label: '팀 현황', href: '/team', icon: Users },
   { label: '제출물 관리', href: '/submissions', icon: Upload },
   { label: '공간 예약', href: '/space-reservations', icon: Building },
   { label: '전자결재', href: '/approvals', icon: FileCheck2 },
];

export default function Menubar() {
   const pathname = usePathname();
   const router = useRouter();
   const { role } = useAuth();
   const menuItems = role === 'STUDENT' ? STUDENT_MENU_ITEMS : STAFF_MENU_ITEMS;
   const [pendingHref, setPendingHref] = useState<string | null>(null);

   const handleNavigate = (e: React.MouseEvent, href: string, isActive: boolean) => {
      if (isActive || !hasUnsavedChanges()) return;
      e.preventDefault();
      setPendingHref(href);
   };

   return (
      <aside className="flex h-full w-22.5 shrink-0 flex-col gap-0.5 overflow-y-auto border-r border-gray-200 bg-white p-2">
         {menuItems.map(({ label, href, icon: Icon }) => {
            const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);

            return (
               <Link
                  key={href}
                  href={href}
                  onClick={(e) => handleNavigate(e, href, isActive)}
                  className={`flex cursor-pointer flex-col items-center gap-1 rounded-sm px-1.5 py-3 text-[11px] font-semibold transition-colors ${
                     isActive ? 'bg-brand-green text-white' : 'text-[#3B4150] hover:bg-[#F7F8FA]'
                  }`}
               >
                  <Icon size={22} />
                  {label}
               </Link>
            );
         })}

         <ConfirmModal
            open={!!pendingHref}
            title="저장하지 않은 변경사항이 있습니다"
            description="지금 나가면 변경사항이 저장되지 않습니다. 그래도 나가시겠습니까?"
            confirmLabel="나가기"
            variant="danger"
            onConfirm={() => {
               if (pendingHref) router.push(pendingHref);
               setPendingHref(null);
            }}
            onClose={() => setPendingHref(null)}
         />
      </aside>
   );
}
