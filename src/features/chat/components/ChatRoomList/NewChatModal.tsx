'use client';

import { useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import SearchInput from '@/components/ui/SearchInput';
import ChatAvatar from '../ChatAvatar';
import { useAuth } from '@/components/auth/AuthContext';
import { getUserList, type UserListItem } from '@/services/user.service';
import { ROLE_LABELS } from '@/services/auth.service';
import { getChatErrorMessage } from '../../chatErrors';
import { toast } from '@/lib/toast';

interface NewChatModalProps {
   onClose: () => void;
   onCreate: (payload: { userIds: number[]; name?: string }) => Promise<void>;
}

export default function NewChatModal({ onClose, onCreate }: NewChatModalProps) {
   const { me } = useAuth();
   const [allUsers, setAllUsers] = useState<UserListItem[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [query, setQuery] = useState('');
   const [selectedUsers, setSelectedUsers] = useState<UserListItem[]>([]);
   const [roomName, setRoomName] = useState('');
   const [isCreating, setIsCreating] = useState(false);

   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
   }, [onClose]);

   // 목록 전체가 크지 않아(수십 명) 한 번만 불러온 뒤 검색어는 클라이언트에서 바로 필터링한다
   useEffect(() => {
      let isMounted = true;
      getUserList()
         .then((users) => {
            if (isMounted) setAllUsers(users);
         })
         .catch((err) => {
            toast.error(getChatErrorMessage(err, '사용자 목록을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'));
         })
         .finally(() => {
            if (isMounted) setIsLoading(false);
         });
      return () => {
         isMounted = false;
      };
   }, []);

   const results = useMemo(() => {
      const q = query.trim().toLowerCase();
      return allUsers.filter((user) => {
         if (user.userId === me?.userId || user.status !== 'ACTIVE') return false;
         if (!q) return true;
         return user.name.toLowerCase().includes(q) || user.teamName?.toLowerCase().includes(q);
      });
   }, [allUsers, query, me?.userId]);

   const toggleUser = (user: UserListItem) => {
      setSelectedUsers((prev) =>
         prev.some((u) => u.userId === user.userId)
            ? prev.filter((u) => u.userId !== user.userId)
            : [...prev, user],
      );
   };

   const handleCreate = async () => {
      if (selectedUsers.length === 0 || isCreating) return;
      setIsCreating(true);
      try {
         // 채팅방명을 안 넣으면 참여자 이름을 조합해서 자동으로 채팅방명 만듦.
         // 단체 채팅방은 나 자신도 참여자라 이름에 같이 들어가야 하지만, 
         // 1:1 채팅방은 상대방 한 명의 이름만 보이는 게 맞아서(뒤에서 상대방 이름으로 다시 보정됨) 그대로 둔다
         const autoName =
            selectedUsers.length >= 2
               ? [me?.name, ...selectedUsers.map((u) => u.name)].filter(Boolean).join(', ')
               : selectedUsers.map((u) => u.name).join(', ');
         await onCreate({
            userIds: selectedUsers.map((u) => u.userId),
            name: roomName.trim() || autoName,
         });
      } finally {
         setIsCreating(false);
      }
   };

   return (
      <div
         role="dialog"
         aria-modal="true"
         aria-label="새 채팅"
         className="absolute inset-0 z-20 bg-black/20"
         onClick={onClose}
      >
         <div
            className="animate-slide-up-from-bottom absolute inset-x-0 bottom-0 flex max-h-[85%] flex-col rounded-t-sm bg-white p-4 shadow-[0_-4px_16px_rgba(0,0,0,0.12)]"
            onClick={(e) => e.stopPropagation()}
         >
            <div className="mb-3 flex items-center justify-between">
               <h2 className="text-base font-bold text-gray-900">새 채팅</h2>
               <button
                  type="button"
                  onClick={onClose}
                  aria-label="닫기"
                  className="cursor-pointer rounded-xs p-1 hover:bg-gray-100"
               >
                  <X size={18} className="text-gray-400" />
               </button>
            </div>

            {selectedUsers.length > 0 && (
               <div className="mb-3 flex flex-wrap gap-1.5">
                  {selectedUsers.map((user) => (
                     <span
                        key={user.userId}
                        className="flex items-center gap-1 rounded-xs bg-gray-100 py-1 pr-1.5 pl-2 text-xs text-gray-700"
                     >
                        {user.name}
                        <button
                           type="button"
                           onClick={() => toggleUser(user)}
                           aria-label={`${user.name} 선택 해제`}
                           className="cursor-pointer text-gray-400 hover:text-gray-600"
                        >
                           <X size={12} />
                        </button>
                     </span>
                  ))}
               </div>
            )}

            {selectedUsers.length >= 2 && (
               <input
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="채팅방 이름을 입력해주세요 (선택)"
                  className="mb-3 h-10 w-full rounded-sm border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-gray-400"
               />
            )}

            <div className="mb-2">
               {/* value/onChange를 안 넘겨 다른 검색창들과 동일하게 Enter나 돋보기 클릭 시에만 검색되도록 함 */}
               <SearchInput
                  onSearch={setQuery}
                  placeholder="이름 또는 팀으로 검색"
                  className="w-full"
               />
            </div>

            <ul className="flex-1 overflow-y-auto py-1 scrollbar-gutter-stable">
               {isLoading ? (
                  <p className="p-6 text-center text-sm text-gray-400">불러오는 중...</p>
               ) : results.length === 0 ? (
                  <p className="p-6 text-center text-sm text-gray-400">검색 결과가 없습니다</p>
               ) : (
                  results.map((user) => (
                     <li key={user.userId}>
                        <label className="flex cursor-pointer items-center gap-3 rounded-sm p-2 hover:bg-gray-50">
                           <input
                              type="checkbox"
                              checked={selectedUsers.some((u) => u.userId === user.userId)}
                              onChange={() => toggleUser(user)}
                              className="h-4 w-4 cursor-pointer accent-brand-green"
                           />
                           <ChatAvatar name={user.name} imageUrl={user.profileImageUrl} />
                           <span className="flex min-w-0 flex-col">
                              <span className="truncate text-sm font-medium text-gray-900">{user.name}</span>
                              <span className="truncate text-xs text-gray-400">
                                 {user.teamName ?? ROLE_LABELS[user.role]}
                              </span>
                           </span>
                        </label>
                     </li>
                  ))
               )}
            </ul>

            <div className="mt-3 flex gap-2">
               <button
                  type="button"
                  onClick={onClose}
                  className="h-10 flex-1 cursor-pointer rounded-sm border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
               >
                  취소
               </button>
               <button
                  type="button"
                  onClick={handleCreate}
                  disabled={selectedUsers.length === 0 || isCreating}
                  className="h-10 flex-1 cursor-pointer rounded-sm bg-brand-green text-sm font-medium text-white hover:bg-[#4D655A] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
               >
                  {isCreating ? '만드는 중...' : `만들기${selectedUsers.length > 0 ? ` (${selectedUsers.length}명)` : ''}`}
               </button>
            </div>
         </div>
      </div>
   );
}
