'use client';

import { useEffect, useRef, useState } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import { useAuth } from '@/components/auth/AuthContext';
import { cn } from '@/lib/utils';
import { ApiError } from '@/lib/http';
import { refreshAiSummary, type AiSummary } from '@/services/aiAssistant.service';
import { useCornerDrag } from './useCornerDrag';
import MarkdownLite from './MarkdownLite';

// 상단 모서리는 전역 헤더(h-14, z-50)에 가려지지 않도록 그 아래로 여백을 준다
const CORNER_WRAPPER_CLASS = {
   'top-left': 'top-[4.5rem] left-6',
   'top-right': 'top-[4.5rem] right-6',
   'bottom-left': 'bottom-6 left-6',
   'bottom-right': 'bottom-6 right-6',
} as const;

// 버튼이 위쪽 모서리에 있으면 패널은 아래로, 아래쪽 모서리에 있으면 위로 펼쳐진다.
// 좌/우는 버튼이 붙은 쪽에 맞춰 패널도 같은 쪽으로 정렬해 화면 밖으로 잘리지 않게 한다
const PANEL_POSITION_CLASS = {
   'top-left': 'top-full left-0 mt-2',
   'top-right': 'top-full right-0 mt-2',
   'bottom-left': 'bottom-full left-0 mb-2',
   'bottom-right': 'bottom-full right-0 mb-2',
} as const;

function getErrorMessage(err: unknown) {
   if (err instanceof ApiError) {
      if (err.code === 'AUTH_001') return '인증이 필요합니다. 다시 로그인해주세요.';
      if (err.code === 'AI_001') return 'AI 요약 생성 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
      if (err.code === 'USER_001') return '사용자 정보를 찾을 수 없습니다.';
      return err.message;
   }
   return '요약을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
}

function formatGeneratedAt(iso: string) {
   const date = parseISO(iso);
   return isValid(date) ? format(date, 'yyyy-MM-dd HH:mm') : '';
}

export default function AIAssistantWidget() {
   const { isAuthenticated, isInitializing } = useAuth();

   const [isOpen, setIsOpen] = useState(false);
   const [summary, setSummary] = useState<AiSummary | null>(null);
   const [isLoading, setIsLoading] = useState(false);
   const [errorMessage, setErrorMessage] = useState<string | null>(null);
   const hasLoadedOnceRef = useRef(false);

   const { corner, dragPosition, handlePointerDown, wasDragged } = useCornerDrag({
      onDragStart: () => setIsOpen(false),
   });

   const loadSummary = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
         const result = await refreshAiSummary();
         setSummary(result);
      } catch (err) {
         setErrorMessage(getErrorMessage(err));
      } finally {
         setIsLoading(false);
      }
   };

   useEffect(() => {
      if (isOpen && !hasLoadedOnceRef.current) {
         hasLoadedOnceRef.current = true;
         loadSummary();
      }
   }, [isOpen]);

   if (!isAuthenticated || isInitializing) return null;

   return (
      <div
         className={cn('fixed z-40', !dragPosition && CORNER_WRAPPER_CLASS[corner])}
         style={dragPosition ? { left: dragPosition.x, top: dragPosition.y } : undefined}
      >
         <div className="relative">
            {isOpen && (
               <div
                  className={cn(
                     'absolute w-80 max-w-[calc(100vw-3rem)] rounded-sm border border-gray-200 bg-white shadow-lg',
                     PANEL_POSITION_CLASS[corner],
                  )}
               >
                  <div className="flex items-center justify-between rounded-t-sm bg-brand-green px-4 py-3">
                     <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                        <Sparkles size={16} />
                        AI 개인 비서
                     </div>
                     <button
                        type="button"
                        onClick={() => setIsOpen(false)}
                        aria-label="닫기"
                        className="cursor-pointer rounded-xs p-1 text-white/80 hover:bg-white/10 hover:text-white"
                     >
                        <X size={16} />
                     </button>
                  </div>

                  <div className="max-h-[60vh] overflow-y-auto p-4">
                     {isLoading && !summary ? (
                        <p className="py-6 text-center text-sm text-gray-400">요약을 불러오는 중...</p>
                     ) : errorMessage && !summary ? (
                        <div className="flex flex-col items-center gap-3 py-6">
                           <p className="text-center text-sm text-gray-400">{errorMessage}</p>
                           <button
                              type="button"
                              onClick={loadSummary}
                              className="cursor-pointer rounded-xs border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                           >
                              다시 시도
                           </button>
                        </div>
                     ) : summary ? (
                        <div className="space-y-2 text-sm leading-relaxed text-gray-700 [&_p]:mb-2 [&_p:last-child]:mb-0">
                           <MarkdownLite text={summary.summaryText} />
                        </div>
                     ) : null}
                     {errorMessage && summary && (
                        <p className="mt-3 text-xs text-brand-maroon">{errorMessage}</p>
                     )}
                  </div>

                  <div className="flex items-center justify-between border-t border-gray-100 px-4 py-2.5">
                     <span className="text-xs text-gray-400">
                        {summary ? `${formatGeneratedAt(summary.generatedAt)} 생성` : ''}
                     </span>
                     <button
                        type="button"
                        onClick={loadSummary}
                        disabled={isLoading}
                        aria-label="요약 재생성"
                        className="flex cursor-pointer items-center gap-1 rounded-xs px-2 py-1 text-xs font-medium text-brand-green hover:bg-[#EAF3EC] disabled:cursor-not-allowed disabled:opacity-50"
                     >
                        <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
                        재생성
                     </button>
                  </div>
               </div>
            )}

            <button
               type="button"
               onPointerDown={handlePointerDown}
               onClick={() => {
                  if (wasDragged()) return;
                  setIsOpen((prev) => !prev);
               }}
               aria-label="AI 개인 비서"
               className="flex h-14 w-14 cursor-grab touch-none items-center justify-center rounded-full bg-brand-green text-white shadow-lg transition-colors hover:bg-[#4D655A] active:cursor-grabbing"
            >
               <Sparkles size={22} />
            </button>
         </div>
      </div>
   );
}
