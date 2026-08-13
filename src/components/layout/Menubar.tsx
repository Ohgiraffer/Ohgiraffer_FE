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
   Phone,
   X,
   type LucideIcon,
} from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { hasUnsavedChanges } from '@/lib/navigationGuard';
import ConfirmModal from '@/components/ui/ConfirmModal';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/shadcn/popover';

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

// 시설 관리팀 연락처 - 하드코딩(별도 API 없음)
const FACILITY_CONTACTS = [
   { name: '김시설', role: '냉난방·전기', phone: '010-1234-5678' },
   { name: '이관리', role: '청소·비품', phone: '010-9876-5432' },
];

export default function Menubar() {
   const pathname = usePathname();
   const router = useRouter();
   const { role } = useAuth();
   const menuItems = role === 'STUDENT' ? STUDENT_MENU_ITEMS : STAFF_MENU_ITEMS;
   const [pendingHref, setPendingHref] = useState<string | null>(null);
   const [isFacilityOpen, setIsFacilityOpen] = useState(false);

   const handleNavigate = (e: React.MouseEvent, href: string, isActive: boolean) => {
      if (isActive || !hasUnsavedChanges()) return;
      e.preventDefault();
      setPendingHref(href);
   };

   return (
      <aside className="flex h-full w-22.5 shrink-0 flex-col overflow-hidden border-r border-gray-200 bg-white p-2">
         <div className="flex flex-1 flex-col gap-[clamp(0px,0.4vh,2px)] overflow-hidden">
            {menuItems.map(({ label, href, icon: Icon }) => {
               const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);

               return (
                  <Link
                     key={href}
                     href={href}
                     onClick={(e) => handleNavigate(e, href, isActive)}
                     className={`flex min-h-0 cursor-pointer flex-col items-center justify-center gap-[clamp(0px,0.3vh,4px)] rounded-sm px-1.5 py-[clamp(4px,1.5vh,12px)] text-[11px] font-semibold transition-colors ${
                        isActive ? 'bg-brand-green text-white' : 'text-[#3B4150] hover:bg-[#F7F8FA]'
                     }`}
                  >
                     <Icon className="h-[clamp(14px,2.6vh,22px)] w-[clamp(14px,2.6vh,22px)] shrink-0" />
                     <span className="truncate">{label}</span>
                  </Link>
               );
            })}
         </div>

         <div className="shrink-0 border-t border-gray-200 pt-2">
            <Popover open={isFacilityOpen} onOpenChange={setIsFacilityOpen}>
               <PopoverTrigger className="w-full cursor-pointer rounded-xs py-[clamp(6px,1.5vh,10px)] text-[11px] font-semibold text-[#3B4150] transition-colors hover:bg-[#F7F8FA] hover:underline">
                  시설문의
               </PopoverTrigger>
               <PopoverContent side="right" align="end" sideOffset={16} className="relative gap-0 rounded-xs p-0">
                  <span className="absolute -left-1.5 bottom-4 h-3 w-3 rotate-45 border-b border-l border-gray-300 bg-popover" />
                  <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                     <p className="flex items-center gap-2 text-[13px] font-bold text-gray-900">
                        <Phone size={15} className="text-brand-green" />
                        시설관리팀 문의
                     </p>
                     <button
                        type="button"
                        onClick={() => setIsFacilityOpen(false)}
                        aria-label="닫기"
                        className="cursor-pointer rounded-xs p-1 text-gray-400 hover:bg-gray-100"
                     >
                        <X size={18} />
                     </button>
                  </div>

                  <div className="flex flex-col gap-3 p-5">
                     {FACILITY_CONTACTS.map((contact) => (
                        <div
                           key={contact.name}
                           className="rounded-xs border border-gray-100 bg-[#F9FAFB] px-3 py-2.5"
                        >
                           <p className="text-xs font-bold text-gray-900">
                              {contact.name}
                              <span className="ml-1 text-[11.5px] font-normal text-gray-400">
                                 ({contact.role})
                              </span>
                           </p>
                           <p className="mt-1 text-xs font-medium text-brand-green">{contact.phone}</p>
                        </div>
                     ))}
                  </div>
               </PopoverContent>
            </Popover>
         </div>

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
