'use client';

import { Plus, X } from 'lucide-react';
import { IMaskInput } from 'react-imask';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/shadcn/select';
import type { UserDraftRow, UserRole } from '../types';

const ROLE_OPTIONS: UserRole[] = ['훈련생', '강사', '매니저'];

const GRID_COLUMNS =
   'grid-cols-[minmax(0,0.8fr)_minmax(0,1.8fr)_minmax(0,1.1fr)_minmax(0,0.8fr)_28px]';

type Props = {
   rows: UserDraftRow[];
   onAddRow: () => void;
   onRemoveRow: (id: string) => void;
   onUpdateRow: (id: string, field: keyof Omit<UserDraftRow, 'id'>, value: string) => void;
   disabled?: boolean;
};

export default function ManualEntryTab({
   rows,
   onAddRow,
   onRemoveRow,
   onUpdateRow,
   disabled = false,
}: Props) {
   return (
      <div>
         {rows.length > 0 && (
            <div
               className={`mb-2 grid ${GRID_COLUMNS} gap-3 px-1 text-sm font-semibold text-gray-900`}
            >
               <span>
                  이름 <span className="text-brand-gold">*</span>
               </span>
               <span>
                  이메일 <span className="text-brand-gold">*</span>
               </span>
               <span>
                  연락처 <span className="text-brand-gold">*</span>
               </span>
               <span>
                  역할 <span className="text-brand-gold">*</span>
               </span>
               <span />
            </div>
         )}

         {rows.length > 0 && (
            <div className="flex flex-col gap-1">
               {rows.map((row) => (
                  <div key={row.id} className={`grid ${GRID_COLUMNS} items-center gap-2`}>
                     <input
                        type="text"
                        value={row.name}
                        onChange={(event) => onUpdateRow(row.id, 'name', event.target.value)}
                        placeholder="이름"
                        disabled={disabled}
                        className="w-full min-w-0 rounded-xs border border-[#E5E7EB] px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-green disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                     />
                     <input
                        type="email"
                        value={row.email}
                        onChange={(event) => onUpdateRow(row.id, 'email', event.target.value)}
                        placeholder="이메일"
                        disabled={disabled}
                        className="w-full min-w-0 rounded-xs border border-[#E5E7EB] px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-green disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                     />
                     <IMaskInput
                        mask="000-0000-0000"
                        value={row.phone}
                        unmask={false}
                        onAccept={(value: string) => {
                           
                           if (value === row.phone) return;
                           onUpdateRow(row.id, 'phone', value);
                        }}
                        placeholder="010-0000-0000"
                        disabled={disabled}
                        className="w-full min-w-0 rounded-xs border border-[#E5E7EB] px-3 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-green disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
                     />
                     <Select
                        value={row.role}
                        onValueChange={(value) => value && onUpdateRow(row.id, 'role', value)}
                        disabled={disabled}
                     >
                        <SelectTrigger className="data-[size=default]:h-10 w-full min-w-0 rounded-xs bg-white">
                           <SelectValue placeholder="역할" />
                        </SelectTrigger>
                        <SelectContent alignItemWithTrigger={false} align="start" sideOffset={4}>
                           {ROLE_OPTIONS.map((role) => (
                              <SelectItem key={role} value={role} className="cursor-pointer">
                                 {role}
                              </SelectItem>
                           ))}
                        </SelectContent>
                     </Select>
                     <button
                        type="button"
                        onClick={() => onRemoveRow(row.id)}
                        aria-label="행 삭제"
                        disabled={disabled}
                        className="cursor-pointer rounded-xs p-1.5 text-gray-400 hover:bg-gray-50 hover:text-brand-maroon disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-gray-400"
                     >
                        <X size={16} />
                     </button>
                  </div>
               ))}
            </div>
         )}

         <button
            type="button"
            onClick={onAddRow}
            disabled={disabled}
            className="mt-2 flex w-full cursor-pointer items-center justify-center gap-1 rounded-xs border border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:hover:bg-transparent"
         >
            <Plus size={16} />행 추가
         </button>
      </div>
   );
}
