'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { ChevronRight, ListChecks } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { getTodoSummary, type TodoItem, type TodoSourceDomain } from '@/services/todo.service';

const DOMAIN_META: Record<TodoSourceDomain, { href: string; badgeClassName: string }> = {
   APPROVAL: { href: '/approvals', badgeClassName: 'bg-brand-maroon' },
   NOTICE: { href: '/notices', badgeClassName: 'bg-brand-red' },
   CONSULTATION: { href: '/counseling', badgeClassName: 'bg-brand-green' },
   ATTENDANCE: { href: '/attendance', badgeClassName: 'bg-brand-red/60' },
};

export default function TodoCard() {
   const { role } = useAuth();
   const isStudent = role === 'STUDENT';

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
         ) : todos.length === 0 ? (
            <p className="py-6 text-center text-sm text-gray-400">표시할 항목이 없습니다</p>
         ) : (
            <ul>
               {todos.map((todo) => {
                  const meta = DOMAIN_META[todo.sourceDomain];
                  // 훈련생의 "상담 예정"은 본인 일정이 최대 1건이라 건수보다 가장 가까운 시각이 더 유용하다
                  const showTimeInsteadOfCount = isStudent && todo.sourceDomain === 'CONSULTATION';

                  return (
                     <li key={todo.sourceDomain} className="border-b border-gray-100 last:border-none">
                        <Link
                           href={meta.href}
                           className="flex items-center justify-between gap-3 py-2 hover:bg-gray-50 lg:py-3"
                        >
                           <span className="min-w-0 flex-1 truncate text-sm text-gray-700">{todo.type}</span>
                           <span className="flex shrink-0 items-center gap-2">
                              {showTimeInsteadOfCount ? (
                                 todo.nearestDueTime ? (
                                    <span
                                       className={`rounded-xs px-2 py-0.5 text-xs font-medium text-white ${meta.badgeClassName}`}
                                    >
                                       {format(new Date(todo.nearestDueTime), 'HH:mm')}
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
