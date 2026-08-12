'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface SidePanelShellProps {
   open: boolean;
   onClose: () => void;
   // 패널 제목 요소(children 안)의 id - role="dialog"의 aria-labelledby가 가리킴
   labelledBy: string;
   widthClassName?: string;
   // 슬라이드 패널 박스 밖, 같은 z축 레이어에 렌더할 보조 요소
   // (예: 채팅의 스레드 패널처럼 패널 옆에 별도로 펼쳐지는 영역) - transform 애니메이션의 영향을 받지 않아야 하는 요소용
   overlayExtra?: React.ReactNode;
   children: React.ReactNode;
}

// 알림/채팅/공간관리 우측 슬라이드 패널 공용 셸 - 배경 오버레이, 슬라이드 애니메이션,
// Esc/배경 클릭 닫기, 퇴장 애니메이션이 끝난 뒤 언마운트까지 여기서 한 번만 처리한다
export default function SidePanelShell({
   open,
   onClose,
   labelledBy,
   widthClassName = 'w-105',
   overlayExtra,
   children,
}: SidePanelShellProps) {
   // open이 꺼져도 곧바로 언마운트하지 않고 퇴장 애니메이션이 끝날 때까지 렌더를 유지함
   const [isMounted, setIsMounted] = useState(open);
   const isClosing = isMounted && !open;

   useEffect(() => {
      if (open) {
         // eslint-disable-next-line react-hooks/set-state-in-effect -- open이 다시 켜지면 즉시 마운트해야 슬라이드인 애니메이션이 재생됨
         setIsMounted(true);
      }
   }, [open]);

   useEffect(() => {
      if (!isMounted) return;

      const handleKeyDown = (event: KeyboardEvent) => {
         if (event.key === 'Escape') onClose();
      };
      // 배경이 백드롭에 덮여 있어도 이미 포커스가 배경 요소에 가 있었다면 키보드(방향키/Space 등)로
      // <main>을 스크롤할 수 있으므로, 패널이 열려 있는 동안은 배경 스크롤 자체를 잠근다
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      return () => {
         document.removeEventListener('keydown', handleKeyDown);
         document.body.style.overflow = '';
      };
   }, [isMounted, onClose]);

   if (!isMounted) return null;

   return createPortal(
      // 헤더(h-14) 아래부터 시작 - 배경 오버레이도 패널도 헤더는 가리지 않음
      <div className="fixed inset-x-0 top-14 bottom-0 z-60">
         <div
            className={`absolute inset-0 bg-black/40 ${isClosing ? 'animate-fade-out' : 'animate-fade-in'}`}
            onClick={onClose}
         />
         <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            onClick={(event) => event.stopPropagation()}
            onAnimationEnd={(event) => {
               // animationend는 버블링된다 - children 안의 다른 요소(예: 새 채팅 시트의
               // slide-up 애니메이션)가 끝났을 때도 이 핸들러가 불려서 패널이 아직 닫히는
               // 중도 아닌데 조기에 언마운트되지 않도록, 이 요소 자신의 애니메이션일 때만 처리한다
               if (event.target !== event.currentTarget) return;
               if (isClosing) setIsMounted(false);
            }}
            className={`absolute top-0 right-0 bottom-0 flex ${widthClassName} flex-col bg-white shadow-lg ${
               isClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'
            }`}
         >
            {children}
         </div>
         {overlayExtra}
      </div>,
      document.body,
   );
}

// 알림/공간관리가 공유하는 "제목 + 닫기(X) 버튼" 헤더 행 - 채팅은 헤더 오른쪽에 다른 액션(새 채팅 버튼)이
// 들어가고 X 버튼도 없어서 이 컴포넌트를 쓰지 않고 직접 헤더를 그림
export function PanelHeaderBar({
   titleId,
   onClose,
   children,
}: {
   titleId: string;
   onClose: () => void;
   children: React.ReactNode;
}) {
   return (
      <div className="flex items-center justify-between border-b border-[#E5E7EB] px-6 py-4">
         <h2 id={titleId} className="flex items-center gap-2 text-lg font-bold text-gray-900">
            {children}
         </h2>
         <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="cursor-pointer rounded-sm p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-700"
         >
            <X size={20} />
         </button>
      </div>
   );
}
