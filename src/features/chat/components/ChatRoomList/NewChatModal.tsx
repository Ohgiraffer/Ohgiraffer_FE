'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import SearchInput from '@/components/ui/SearchInput';
import ChatAvatar from '../ChatAvatar';
import { searchChatUsers, type ChatUserSearchResult } from '@/services/chat.service';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';

interface NewChatModalProps {
   onClose: () => void;
   onCreate: (payload: { userIds: number[]; name?: string }) => void;
}

export default function NewChatModal({ onClose, onCreate }: NewChatModalProps) {
   const [results, setResults] = useState<ChatUserSearchResult[]>([]);
   const [hasSearched, setHasSearched] = useState(false);
   const [isSearching, setIsSearching] = useState(false);
   const [selectedUsers, setSelectedUsers] = useState<ChatUserSearchResult[]>([]);
   const [roomName, setRoomName] = useState('');

   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
   }, [onClose]);

   const handleSearch = async (value: string) => {
      if (!value) {
         setHasSearched(false);
         setResults([]);
         return;
      }
      setIsSearching(true);
      try {
         const users = await searchChatUsers(value);
         setResults(users);
      } catch (err) {
         toast.error(
            err instanceof ApiError ? err.message : '검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
         );
      } finally {
         setHasSearched(true);
         setIsSearching(false);
      }
   };

   const toggleUser = (user: ChatUserSearchResult) => {
      setSelectedUsers((prev) =>
         prev.some((u) => u.userId === user.userId)
            ? prev.filter((u) => u.userId !== user.userId)
            : [...prev, user],
      );
   };

   const handleCreate = () => {
      if (selectedUsers.length === 0) return;
      // 채팅방명을 안 넣으면 참여자 이름을 조합해서 자동으로 채팅방명 만듦
      const autoName = selectedUsers.map((u) => u.name ?? '알 수 없음').join(', ');
      onCreate({
         userIds: selectedUsers.map((u) => u.userId),
         name: selectedUsers.length >= 2 ? roomName.trim() || autoName : undefined,
      });
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
                        {user.name ?? '알 수 없음'}
                        <button
                           type="button"
                           onClick={() => toggleUser(user)}
                           aria-label={`${user.name ?? '알 수 없음'} 선택 해제`}
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
               <SearchInput onSearch={handleSearch} placeholder="이름으로 검색" className="w-full" />
            </div>

            <ul className="flex-1 overflow-y-auto py-1 scrollbar-gutter-stable">
               {!hasSearched ? (
                  <p className="p-6 text-center text-sm text-gray-400">이름으로 검색해보세요</p>
               ) : isSearching ? (
                  <p className="p-6 text-center text-sm text-gray-400">검색 중...</p>
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
                           <ChatAvatar name={user.name} isOnline={user.isOnline} />
                           <span className="truncate text-sm font-medium text-gray-900">
                              {user.name ?? '알 수 없음'}
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
                  disabled={selectedUsers.length === 0}
                  className="h-10 flex-1 cursor-pointer rounded-sm bg-brand-green text-sm font-medium text-white hover:bg-[#4D655A] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
               >
                  만들기{selectedUsers.length > 0 ? ` (${selectedUsers.length}명)` : ''}
               </button>
            </div>
         </div>
      </div>
   );
}
