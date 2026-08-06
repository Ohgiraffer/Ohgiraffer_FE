'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import SearchInput from '@/components/ui/SearchInput';
import ChatAvatar from './ChatAvatar';
import { CHAT_USERS } from '../dummyData';

interface NewChatModalProps {
   onClose: () => void;
   onCreate: (payload: { memberIds: string[]; name?: string }) => void;
}

// 본인과는 채팅을 만들 수 없으므로 목록에서 제외
const SELECTABLE_USERS = CHAT_USERS.filter((user) => user.id !== 'u7');

export default function NewChatModal({ onClose, onCreate }: NewChatModalProps) {
   const [query, setQuery] = useState('');
   const [selectedIds, setSelectedIds] = useState<string[]>([]);
   const [roomName, setRoomName] = useState('');

   useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
         if (e.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
   }, [onClose]);

   const filteredUsers = SELECTABLE_USERS.filter((user) =>
      user.name.toLowerCase().includes(query.toLowerCase()),
   );

   const toggleUser = (id: string) => {
      setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
   };

   const handleCreate = () => {
      if (selectedIds.length === 0) return;
      onCreate({ memberIds: selectedIds, name: selectedIds.length >= 2 ? roomName.trim() : undefined });
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
               <button type="button" onClick={onClose} aria-label="닫기" className="cursor-pointer">
                  <X size={18} className="text-gray-400" />
               </button>
            </div>

            {selectedIds.length > 0 && (
               <div className="mb-3 flex flex-wrap gap-1.5">
                  {selectedIds.map((id) => {
                     const user = SELECTABLE_USERS.find((u) => u.id === id);
                     if (!user) return null;
                     return (
                        <span
                           key={id}
                           className="flex items-center gap-1 rounded-xs bg-gray-100 py-1 pr-1.5 pl-2 text-xs text-gray-700"
                        >
                           {user.name}
                           <button
                              type="button"
                              onClick={() => toggleUser(id)}
                              aria-label={`${user.name} 선택 해제`}
                              className="cursor-pointer text-gray-400 hover:text-gray-600"
                           >
                              <X size={12} />
                           </button>
                        </span>
                     );
                  })}
               </div>
            )}

            {selectedIds.length >= 2 && (
               <input
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="채팅방 이름을 입력해주세요 (선택)"
                  className="mb-3 h-10 w-full rounded-sm border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-gray-400"
               />
            )}

            <div className="mb-2">
               <SearchInput onSearch={setQuery} placeholder="이름으로 검색" className="w-full" />
            </div>

            <ul className="flex-1 overflow-y-auto">
               {filteredUsers.map((user) => (
                  <li key={user.id}>
                     <label className="flex cursor-pointer items-center gap-3 rounded-sm p-2 hover:bg-gray-50">
                        <input
                           type="checkbox"
                           checked={selectedIds.includes(user.id)}
                           onChange={() => toggleUser(user.id)}
                           className="h-4 w-4 cursor-pointer accent-brand-green"
                        />
                        <ChatAvatar name={user.name} isOnline={user.isOnline} />
                        <div className="min-w-0 flex-1">
                           <span className="flex items-center gap-1.5">
                              <span className="truncate text-sm font-medium text-gray-900">
                                 {user.name}
                              </span>
                              <span className="shrink-0 rounded-xs bg-gray-100 px-1.5 py-0.5 text-[11px] text-gray-500">
                                 {user.role}
                              </span>
                           </span>
                           <p className="truncate text-xs text-gray-400">{user.email}</p>
                        </div>
                     </label>
                  </li>
               ))}
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
                  disabled={selectedIds.length === 0}
                  className="h-10 flex-1 cursor-pointer rounded-sm bg-brand-green text-sm font-medium text-white hover:bg-[#4D655A] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
               >
                  만들기{selectedIds.length > 0 ? ` (${selectedIds.length}명)` : ''}
               </button>
            </div>
         </div>
      </div>
   );
}
