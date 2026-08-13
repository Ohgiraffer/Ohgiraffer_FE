'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format, isToday } from 'date-fns';
import { ChevronRight, ListChecks } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import type { UserRole } from '@/services/auth.service';
import { getTodoSummary, type TodoItem, type TodoSourceDomain } from '@/services/todo.service';

const DOMAIN_META: Record<TodoSourceDomain, { href: string; badgeClassName: string }> = {
   APPROVAL: { href: '/approvals', badgeClassName: 'bg-brand-maroon' },
   NOTICE: { href: '/notices', badgeClassName: 'bg-brand-red' },
   CONSULTATION: { href: '/counseling', badgeClassName: 'bg-brand-green' },
   ATTENDANCE: { href: '/tracker', badgeClassName: 'bg-brand-red/60' },
   SUBMISSION: { href: '/submissions', badgeClassName: 'bg-brand-sage' },
};
// 문서에 없는 sourceDomain이 내려올 때(훈련생/강사에서 확인됨) 링크가 깨지지 않도록 두는 기본값
const DEFAULT_DOMAIN_META = { href: '/', badgeClassName: 'bg-gray-400' };

// 서버가 내려주는 문구 대신 화면에서 더 명확하게 바꿔 보여주는 라벨 - APPROVAL은 role마다
// 실제로 처리하는 결재 종류가 달라서(훈련생: 휴가, 강사: 예산, 매니저: 결재 처리 전반) role별로 다르게 둔다
const LABEL_OVERRIDES: Partial<Record<UserRole, Partial<Record<TodoSourceDomain, string>>>> = {
   STUDENT: {
      APPROVAL: '휴가 처리 대기',
      SUBMISSION: '미제출 제출물',
   },
   INSTRUCTOR: {
      APPROVAL: '예산 결재 대기',
   },
   MANAGER: {
      APPROVAL: '결재 처리 대기',
   },
};

// 오늘이면 시각(HH:mm), 오늘이 아니면 날짜(M/d)로 표시한다
function formatDueLabel(dueTimeIso: string) {
   const due = new Date(dueTimeIso);
   return isToday(due) ? format(due, 'HH:mm') : format(due, 'M/d');
}

export default function TodoCard() {
   const { role } = useAuth();

   const [todos, setTodos] = useState<TodoItem[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [hasError, setHasError] = useState(false);
   const [retryKey, setRetryKey] = useState(0);

   useEffect(() => {
      let isMounted = true;
      getTodoSummary()
         .then((result) => {
            if (isMounted) setTodos(result);
         })
         .catch(() => {
            if (isMounted) setHasError(true);
         })
         .finally(() => {
            if (isMounted) setIsLoading(false);
         });
      return () => {
         isMounted = false;
      };
   }, [retryKey]);

   // 0건인 항목은 굳이 보여줄 필요가 없어 목록에서 뺀다
   const visibleTodos = todos.filter((todo) => todo.count > 0);

   return (
      <div className="h-full rounded-xs border border-gray-200 bg-white p-6 lg:p-6">
         <div className="mb-4 flex items-center justify-between lg:mb-4">
            <h2 className="flex items-center gap-1.5 -ml-1 text-sm font-bold text-gray-900">
               <ListChecks size={16} className="text-gray-400" />
               할일 관리
            </h2>
         </div>

         {isLoading ? (
            <p className="py-6 text-center text-sm text-gray-400">불러오는 중...</p>
         ) : hasError ? (
            <div className="flex flex-col items-center gap-2 py-6">
               <p className="text-sm text-gray-400">할 일을 불러오지 못했습니다.</p>
               <button
                  type="button"
                  onClick={() => {
                     setIsLoading(true);
                     setHasError(false);
                     setRetryKey((key) => key + 1);
                  }}
                  className="cursor-pointer rounded-xs border border-gray-200 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
               >
                  다시 시도
               </button>
            </div>
         ) : visibleTodos.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">표시할 항목이 없습니다</p>
         ) : (
            <ul>
               {visibleTodos.map((todo) => {
                  const domain = todo.sourceDomain as TodoSourceDomain;
                  const meta = DOMAIN_META[domain] ?? DEFAULT_DOMAIN_META;
                  const label = (role && LABEL_OVERRIDES[role]?.[domain]) || todo.type;
                  // 상담 예정이 1건뿐이면(훈련생은 본인 일정이라 최대 1건, 운영진도 1건일 때) 건수보다
                  // 그 상담이 언제인지가 더 유용하다 - 오늘이면 시각, 아니면 날짜로 보여준다
                  const showDueDateOrTime = domain === 'CONSULTATION' && todo.count === 1;

                  return (
                     <li key={todo.sourceDomain} className="border-b border-gray-100 last:border-none">
                        <Link
                           href={meta.href}
                           className="flex items-center justify-between gap-3 py-2 hover:bg-gray-50 lg:py-3"
                        >
                           <span className="min-w-0 flex-1 truncate text-sm text-gray-700">{label}</span>
                           <span className="flex shrink-0 items-center gap-2">
                              {showDueDateOrTime ? (
                                 todo.nearestDueTime ? (
                                    <span
                                       className={`rounded-xs px-2 py-0.5 text-xs font-medium text-white ${meta.badgeClassName}`}
                                    >
                                       {formatDueLabel(todo.nearestDueTime)}
                                    </span>
                                 ) : (
                                    <span className="text-xs text-gray-400">예정 없음</span>
                                 )
                              ) : (
                                 <span
                                    className={`rounded-xs px-2 py-0.5 text-xs font-medium text-white ${meta.badgeClassName}`}
                                 >
                                    {todo.count}건
                                 </span>
                              )}
                              <ChevronRight size={14} className="text-gray-300" />
                           </span>
                        </Link>
                     </li>
                  );
               })}
            </ul>
         )}
      </div>
   );
}
