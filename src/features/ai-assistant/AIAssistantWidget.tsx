'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import { useAuth } from '@/components/auth/AuthContext';
import { cn } from '@/lib/utils';
import { ApiError } from '@/lib/http';
import InlineProgressBar from '@/components/ui/loading/InlineProgressBar';
import { getAiSummary, refreshAiSummary, type AiSummary } from '@/services/aiAssistant.service';
import { useCornerDrag } from './useCornerDrag';
import MarkdownLite from './MarkdownLite';

// 상단은 전역 헤더(h-14, z-50), 좌측은 사이드바(w-22.5 = 90px)에 가려지거나 겹치지 않도록
// 그 바깥으로 여백을 준다 - 드래그로 이동 가능한 모서리는 항상 이 네 곳뿐
const CORNER_WRAPPER_CLASS = {
   'top-left': 'top-20 left-[7.125rem]',
   'top-right': 'top-20 right-6',
   'bottom-left': 'bottom-6 left-[7.125rem]',
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
   // 로그아웃 시점의 세대값 - 그 이전에 시작된 요청이 나중에 응답으로 돌아와도
   // 세대가 바뀌었으면 결과를 버려서 다음 로그인 사용자에게 이전 사용자의 요약이 보이지 않게 한다
   const requestEpochRef = useRef(0);
   // effect 대신 렌더 중 비교로 인증 상태 변화를 감지한다(React의 "prop 변경에 따라 state 조정" 패턴) -
   // useEffect 안에서 setState를 호출하면 불필요한 추가 렌더가 발생하기 때문
   const [prevIsAuthenticated, setPrevIsAuthenticated] = useState(isAuthenticated);
   if (isAuthenticated !== prevIsAuthenticated) {
      setPrevIsAuthenticated(isAuthenticated);
      if (!isAuthenticated) {
         setIsOpen(false);
         setSummary(null);
         setIsLoading(false);
         setErrorMessage(null);
      }
   }

   // ref는 렌더 중에 변경할 수 없으므로, ref 갱신(진행 중 요청 무효화 + 최초 로드 플래그 리셋)은
   // 커밋 이후에 실행되는 effect에서 처리한다
   useEffect(() => {
      if (isAuthenticated) return;
      requestEpochRef.current += 1;
      hasLoadedOnceRef.current = false;
   }, [isAuthenticated]);

   const { corner, dragPosition, handlePointerDown, wasDragged } = useCornerDrag({
      onDragStart: () => setIsOpen(false),
   });

   const runFetch = useCallback(async (fetcher: () => Promise<AiSummary>) => {
      const epoch = requestEpochRef.current;
      setIsLoading(true);
      setErrorMessage(null);
      try {
         const result = await fetcher();
         if (requestEpochRef.current !== epoch) return;
         setSummary(result);
      } catch (err) {
         if (requestEpochRef.current !== epoch) return;
         setErrorMessage(getErrorMessage(err));
      } finally {
         if (requestEpochRef.current === epoch) setIsLoading(false);
      }
   }, []);

   // 열 때/다시 시도할 때는 캐시를 그대로 쓰는 조회 API, "재생성" 버튼만 캐시를 무시하는 API를 쓴다
   const loadSummary = useCallback(() => runFetch(getAiSummary), [runFetch]);
   const handleRegenerate = useCallback(() => runFetch(refreshAiSummary), [runFetch]);

   useEffect(() => {
      if (isOpen && !hasLoadedOnceRef.current) {
         hasLoadedOnceRef.current = true;
         loadSummary();
      }
   }, [isOpen, loadSummary]);

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
                     'absolute z-10 w-80 max-w-[calc(100vw-3rem)] rounded-xs border border-gray-200 bg-white shadow-lg',
                     PANEL_POSITION_CLASS[corner],
                  )}
               >
                  <div className="flex items-center justify-between rounded-t-xs bg-brand-green px-4 py-3">
                     <div className="flex items-center gap-1.5 text-sm font-bold text-white">
                        <Sparkles size={16} className="text-brand-cream" />
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

                  <div className="max-h-[60vh] min-h-[25vh] overflow-y-auto bg-brand-cream/30 p-4">
                     {isLoading && !summary ? (
                        <div className="flex h-full min-h-[calc(25vh-2rem)] flex-col items-center justify-center gap-3">
                           <InlineProgressBar className="bg-white" />
                           <p className="text-xs text-gray-400">요약을 불러오는 중...</p>
                        </div>
                     ) : errorMessage && !summary ? (
                        <div className="flex h-full min-h-[calc(25vh-2rem)] flex-col items-center justify-center gap-3">
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
                        onClick={handleRegenerate}
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
               className="relative z-0 flex h-14 w-14 cursor-grab touch-none items-center justify-center rounded-full bg-brand-green text-white shadow-lg transition-colors hover:bg-[#4D655A] active:cursor-grabbing"
            >
               <Sparkles size={22} className={isOpen ? 'animate-ai-bob' : ''} />
            </button>
         </div>
      </div>
   );
}
