'use client';

import { useMemo, useState } from 'react';
import { Trash2 } from 'lucide-react';
import SearchInput from '@/components/ui/SearchInput';
import Pagination from '@/components/ui/Pagination';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/shadcn/select';
import UserRegisterModal from '../components/UserRegisterModal';
import { MOCK_USERS } from '../mockData';
import type { ManagerSettingUser, UserRole } from '../types';

const PAGE_SIZE = 6;

const ROLE_BADGE_STYLE: Record<UserRole, string> = {
   훈련생: 'bg-brand-sage text-white',
   강사: 'bg-brand-green text-white',
   매니저: 'bg-brand-maroon text-white',
};

const ROLE_OPTIONS: Array<{ value: 'all' | UserRole; label: string }> = [
   { value: 'all', label: '전체' },
   { value: '훈련생', label: '훈련생' },
   { value: '강사', label: '강사' },
   { value: '매니저', label: '매니저' },
];

export default function UserPermissionTab() {
   const [users, setUsers] = useState<ManagerSettingUser[]>(MOCK_USERS);
   const [keyword, setKeyword] = useState('');
   const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
   const [currentPage, setCurrentPage] = useState(1);
   const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

   const filteredUsers = useMemo(() => {
      return users.filter((user) => {
         const matchesKeyword =
            !keyword ||
            user.name.toLowerCase().includes(keyword.toLowerCase()) ||
            user.email.toLowerCase().includes(keyword.toLowerCase());
         const matchesRole = roleFilter === 'all' || user.role === roleFilter;
         return matchesKeyword && matchesRole;
      });
   }, [users, keyword, roleFilter]);

   const totalPages = Math.max(1, Math.ceil(filteredUsers.length / PAGE_SIZE));
   const pagedUsers = filteredUsers.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

   const handleSearch = (value: string) => {
      setKeyword(value);
      setCurrentPage(1);
   };

   const handleRoleFilterChange = (value: 'all' | UserRole | null) => {
      if (!value) return;
      setRoleFilter(value);
      setCurrentPage(1);
   };

   const removeUser = (id: string) => {
      // TODO: 백엔드 준비되면 실제 삭제 API 연동
      setUsers((prev) => prev.filter((user) => user.id !== id));
   };

   return (
      <div>
         <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
               <SearchInput
                  onSearch={handleSearch}
                  placeholder="이름·이메일 검색"
                  className="w-72"
               />
               <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
                  <SelectTrigger className="data-[size=default]:h-10 rounded-xs bg-white">
                     <SelectValue placeholder="역할">
                        {(value: 'all' | UserRole | null) =>
                           ROLE_OPTIONS.find((option) => option.value === value)?.label ?? '역할'
                        }
                     </SelectValue>
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false} align="start" sideOffset={4}>
                     {ROLE_OPTIONS.map((option) => (
                        <SelectItem
                           key={option.value}
                           value={option.value}
                           className="cursor-pointer"
                        >
                           {option.label}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            </div>

            <button
               type="button"
               onClick={() => setIsRegisterModalOpen(true)}
               className="cursor-pointer rounded-sm bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-[#4D655A]"
            >
               + 사용자 등록
            </button>
         </div>

         <UserRegisterModal
            open={isRegisterModalOpen}
            onClose={() => setIsRegisterModalOpen(false)}
            onRegister={(newUsers) => setUsers((prev) => [...prev, ...newUsers])}
         />

         <div className="mt-4 overflow-hidden rounded-sm border border-[#E5E7EB] bg-white">
            <table className="w-full table-fixed text-center text-sm">
               <thead>
                  <tr className="border-b border-[#E5E7EB] bg-[#F9FAFB] text-[#6B7280]">
                     <th className="w-[6%] px-6 py-3 font-medium">#</th>
                     <th className="w-[14%] px-6 py-3 font-medium">이름</th>
                     <th className="w-[26%] px-6 py-3 font-medium">이메일</th>
                     <th className="w-[14%] px-6 py-3 font-medium">역할</th>
                     <th className="w-[14%] px-6 py-3 font-medium">현재 팀</th>
                     <th className="w-[14%] px-6 py-3 font-medium">상태</th>
                     <th className="w-[12%] px-6 py-3 font-medium" />
                  </tr>
               </thead>
               <tbody>
                  {pagedUsers.map((user, index) => {
                     const isDeleted = user.status === '삭제됨';
                     const rowNumber = (currentPage - 1) * PAGE_SIZE + index + 1;

                     return (
                        <tr key={user.id} className="border-b border-[#F3F4F6] last:border-b-0">
                           <td className="px-6 py-4 text-gray-500">{rowNumber}</td>
                           <td
                              className={`px-6 py-4 font-medium ${isDeleted ? 'text-gray-400' : 'text-gray-900'}`}
                           >
                              {user.name}
                           </td>
                           <td
                              className={`px-6 py-4 ${isDeleted ? 'text-gray-400' : 'text-gray-700'}`}
                           >
                              {user.email}
                           </td>
                           <td className="px-6 py-4">
                              <span
                                 className={`rounded-sm px-2.5 py-1 text-xs font-semibold ${
                                    isDeleted
                                       ? 'bg-gray-200 text-gray-400'
                                       : ROLE_BADGE_STYLE[user.role]
                                 }`}
                              >
                                 {user.role}
                              </span>
                           </td>
                           <td
                              className={`px-6 py-4 ${isDeleted ? 'text-gray-400' : 'text-gray-700'}`}
                           >
                              {user.team ?? '—'}
                           </td>
                           <td className="px-6 py-4">
                              {isDeleted ? (
                                 <span className="text-gray-400">삭제됨</span>
                              ) : (
                                 <span className="inline-flex items-center justify-center gap-1.5 text-gray-700">
                                    <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
                                    활성
                                 </span>
                              )}
                           </td>
                           <td className="px-6 py-4 text-right">
                              {!isDeleted && (
                                 <button
                                    type="button"
                                    onClick={() => removeUser(user.id)}
                                    aria-label="사용자 삭제"
                                    className="cursor-pointer rounded-sm p-1.5 text-gray-400 hover:bg-gray-50 hover:text-brand-maroon"
                                 >
                                    <Trash2 size={16} />
                                 </button>
                              )}
                           </td>
                        </tr>
                     );
                  })}
               </tbody>
            </table>
         </div>

         <div className="mt-6">
            <Pagination
               currentPage={currentPage}
               totalPages={totalPages}
               onPageChange={setCurrentPage}
            />
         </div>
      </div>
   );
}
