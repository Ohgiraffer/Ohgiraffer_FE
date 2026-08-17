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
import { Skeleton } from '@/components/ui/loading/Skeleton';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import { updateUserStatus, type UserStatus } from '@/services/user.service';
import UserRegisterModal from '../components/UserRegisterModal';
import UserStatusChangeModal, {
   type UserStatusChangeReason,
} from '../components/UserStatusChangeModal';
import { useUserList } from '../hooks/useUserList';
import type { ManagerSettingUser, UserRole } from '../types';

const REASON_TO_STATUS: Record<UserStatusChangeReason, UserStatus> = {
   자퇴: 'WITHDRAWN',
   제적: 'EXPELLED',
};

const PAGE_SIZE = 6;

const ROLE_BADGE_STYLE: Record<UserRole, string> = {
   훈련생: 'bg-brand-sage text-white',
   강사: 'bg-[#E8B84B] text-white',
   매니저: 'bg-brand-maroon text-white',
};

const ROLE_OPTIONS: Array<{ value: 'all' | UserRole; label: string }> = [
   { value: 'all', label: '전체' },
   { value: '훈련생', label: '훈련생' },
   { value: '강사', label: '강사' },
   { value: '매니저', label: '매니저' },
];

export default function UserPermissionTab() {
   const { users, isLoading, loadError, refetch } = useUserList();
   const [keyword, setKeyword] = useState('');
   const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
   const [currentPage, setCurrentPage] = useState(1);
   const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
   const [statusChangeTarget, setStatusChangeTarget] = useState<ManagerSettingUser | null>(null);

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

   const handleConfirmStatusChange = async (reason: UserStatusChangeReason) => {
      if (!statusChangeTarget) return;
      try {
         await updateUserStatus({
            userId: Number(statusChangeTarget.id),
            status: REASON_TO_STATUS[reason],
         });
         toast.success('사용자 상태가 정상적으로 변경되었습니다.');
         setStatusChangeTarget(null);
         refetch();
      } catch (err) {
         toast.error(
            err instanceof ApiError
               ? err.message
               : '사용자 상태 변경 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
         );
         throw err;
      }
   };

   if (isLoading) {
      return (
         <div>
            <div className="flex items-center justify-between gap-3">
               <div className="flex items-center gap-2">
                  <Skeleton width={288} height={40} className="rounded-xs" />
                  <Skeleton width={96} height={40} className="rounded-xs" />
               </div>
               <Skeleton width={120} height={40} className="rounded-sm" />
            </div>

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
                     {[0, 1, 2, 3, 4].map((i) => (
                        <tr key={i} className="border-b border-[#F3F4F6] last:border-b-0">
                           <td className="px-6 py-4">
                              <Skeleton width={16} height={14} className="mx-auto rounded-md" />
                           </td>
                           <td className="px-6 py-4">
                              <Skeleton width="60%" height={14} className="mx-auto rounded-md" />
                           </td>
                           <td className="px-6 py-4">
                              <Skeleton width="70%" height={14} className="mx-auto rounded-md" />
                           </td>
                           <td className="px-6 py-4">
                              <Skeleton width={56} height={22} className="mx-auto rounded-xs" />
                           </td>
                           <td className="px-6 py-4">
                              <Skeleton width="50%" height={14} className="mx-auto rounded-md" />
                           </td>
                           <td className="px-6 py-4">
                              <Skeleton width={48} height={14} className="mx-auto rounded-md" />
                           </td>
                           <td className="px-6 py-4">
                              <Skeleton width={16} height={16} className="mx-auto rounded-xs" />
                           </td>
                        </tr>
                     ))}
                  </tbody>
               </table>
            </div>
         </div>
      );
   }

   if (loadError) {
      return (
         <div className="rounded-sm border border-[#E5E7EB] bg-white px-8 py-10 text-center text-sm text-brand-red">
            {loadError}
         </div>
      );
   }

   return (
      <div>
         <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
               <SearchInput
                  onSearch={handleSearch}
                  placeholder="이름·이메일 검색"
                  className="w-full sm:w-72"
               />
               <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
                  <SelectTrigger className="data-[size=default]:h-10 w-full rounded-xs bg-white sm:w-auto">
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
               className="w-full cursor-pointer rounded-xs bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-[#4D655A] sm:w-auto"
            >
               + 사용자 등록
            </button>
         </div>

         <UserRegisterModal
            open={isRegisterModalOpen}
            onClose={() => setIsRegisterModalOpen(false)}
            onRegistered={refetch}
         />

         <UserStatusChangeModal
            user={statusChangeTarget}
            onClose={() => setStatusChangeTarget(null)}
            onConfirm={handleConfirmStatusChange}
         />

         {pagedUsers.length === 0 ? (
            <div className="mt-4 rounded-sm border border-[#E5E7EB] bg-white px-6 py-10 text-center text-gray-400">
               조건에 맞는 사용자가 없습니다.
            </div>
         ) : (
            <>
               {/* 좁은 화면 - 카드형 목록 */}
               <div className="mt-4 divide-y divide-[#F3F4F6] overflow-hidden rounded-sm border border-[#E5E7EB] bg-white md:hidden">
                  {pagedUsers.map((user, index) => {
                     const isReadOnly = user.status !== '활성';
                     const rowNumber = (currentPage - 1) * PAGE_SIZE + index + 1;

                     return (
                        <div key={user.id} className="p-4">
                           <div className="flex items-start justify-between gap-2">
                              <div>
                                 <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400">#{rowNumber}</span>
                                    <span
                                       className={`text-sm font-semibold ${isReadOnly ? 'text-gray-400' : 'text-gray-900'}`}
                                    >
                                       {user.name}
                                    </span>
                                    <span
                                       className={`rounded-sm px-2 py-0.5 text-xs font-semibold ${
                                          isReadOnly
                                             ? 'bg-gray-200 text-gray-400'
                                             : ROLE_BADGE_STYLE[user.role]
                                       }`}
                                    >
                                       {user.role}
                                    </span>
                                 </div>
                                 <p
                                    className={`mt-1 text-xs ${isReadOnly ? 'text-gray-400' : 'text-gray-500'}`}
                                 >
                                    {user.email}
                                 </p>
                              </div>
                              {!isReadOnly && (
                                 <button
                                    type="button"
                                    onClick={() => setStatusChangeTarget(user)}
                                    aria-label="사용자 상태 변경"
                                    className="cursor-pointer rounded-sm p-1.5 text-gray-400 hover:bg-gray-50 hover:text-brand-maroon"
                                 >
                                    <Trash2 size={16} />
                                 </button>
                              )}
                           </div>
                           <div className="mt-3 flex items-center gap-4 text-xs">
                              <span className="text-gray-500">
                                 현재 팀{' '}
                                 <span
                                    className={isReadOnly ? 'text-gray-400' : 'text-gray-700'}
                                 >
                                    {user.team ?? '—'}
                                 </span>
                              </span>
                              {user.status === '활성' && (
                                 <span className="inline-flex items-center gap-1.5 text-brand-green">
                                    <span className="h-1.5 w-1.5 rounded-full bg-brand-sage" />
                                    활성
                                 </span>
                              )}
                              {user.status === '수료' && (
                                 <span className="inline-flex items-center gap-1.5 text-gray-500">
                                    <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                                    수료
                                 </span>
                              )}
                              {user.status === '삭제됨' && (
                                 <span className="text-gray-400">삭제됨</span>
                              )}
                           </div>
                        </div>
                     );
                  })}
               </div>

               {/* 넓은 화면 - 테이블 */}
               <div className="mt-4 hidden overflow-hidden rounded-sm border border-[#E5E7EB] bg-white md:block">
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
                           const isReadOnly = user.status !== '활성';
                           const rowNumber = (currentPage - 1) * PAGE_SIZE + index + 1;

                           return (
                              <tr key={user.id} className="border-b border-[#F3F4F6] last:border-b-0">
                                 <td className="px-6 py-4 text-gray-500">{rowNumber}</td>
                                 <td
                                    className={`px-6 py-4 font-medium ${isReadOnly ? 'text-gray-400' : 'text-gray-900'}`}
                                 >
                                    {user.name}
                                 </td>
                                 <td
                                    className={`px-6 py-4 ${isReadOnly ? 'text-gray-400' : 'text-gray-700'}`}
                                 >
                                    {user.email}
                                 </td>
                                 <td className="px-6 py-4">
                                    <span
                                       className={`rounded-sm px-2.5 py-1 text-xs font-semibold ${
                                          isReadOnly
                                             ? 'bg-gray-200 text-gray-400'
                                             : ROLE_BADGE_STYLE[user.role]
                                       }`}
                                    >
                                       {user.role}
                                    </span>
                                 </td>
                                 <td
                                    className={`px-6 py-4 ${isReadOnly ? 'text-gray-400' : 'text-gray-700'}`}
                                 >
                                    {user.team ?? '—'}
                                 </td>
                                 <td className="px-6 py-4">
                                    {user.status === '활성' && (
                                       <span className="inline-flex items-center justify-center gap-1.5 text-brand-green">
                                          <span className="h-1.5 w-1.5 rounded-full bg-brand-sage" />
                                          활성
                                       </span>
                                    )}
                                    {user.status === '수료' && (
                                       <span className="inline-flex items-center justify-center gap-1.5 text-gray-500">
                                          <span className="h-1.5 w-1.5 rounded-full bg-gray-400" />
                                          수료
                                       </span>
                                    )}
                                    {user.status === '삭제됨' && (
                                       <span className="text-gray-400">삭제됨</span>
                                    )}
                                 </td>
                                 <td className="px-6 py-4 text-right">
                                    {!isReadOnly && (
                                       <button
                                          type="button"
                                          onClick={() => setStatusChangeTarget(user)}
                                          aria-label="사용자 상태 변경"
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
            </>
         )}

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
