import { ChevronRight, ListChecks } from 'lucide-react';

interface TodoItem {
   label: string;
   count: string;
   badgeClassName: string;
}

// 하드코딩된 더미 데이터 — 추후 API 연동 예정
const TODOS: TodoItem[] = [
   { label: '미제출 발표자료', count: '1건', badgeClassName: 'bg-brand-maroon' },
   { label: '미완료 평가', count: '3건', badgeClassName: 'bg-brand-red' },
   { label: '상담 예정', count: '1건', badgeClassName: 'bg-brand-green' },
   { label: '내 신청 처리중', count: '1건', badgeClassName: 'bg-brand-red/60' },
];

export default function TodoCard() {
   return (
      <div className="h-full rounded-sm border border-gray-200 bg-white p-6 lg:p-4">
         <div className="mb-4 flex items-center justify-between lg:mb-2">
            <h2 className="flex items-center gap-1.5 text-sm font-bold text-gray-900">
               <ListChecks size={16} className="text-gray-400" />
               할일 관리
            </h2>
         </div>

         <ul>
            {TODOS.map((todo) => (
               <li
                  key={todo.label}
                  className="flex items-center justify-between gap-3 border-b border-gray-100 py-2 last:border-none last:pb-0 lg:py-3"
               >
                  <span className="text-sm text-gray-700">{todo.label}</span>
                  <span className="flex items-center gap-2">
                     <span
                        className={`rounded-xs px-2 py-0.5 text-xs font-medium text-white ${todo.badgeClassName}`}
                     >
                        {todo.count}
                     </span>
                     <ChevronRight size={14} className="text-gray-300" />
                  </span>
               </li>
            ))}
         </ul>
      </div>
   );
}
