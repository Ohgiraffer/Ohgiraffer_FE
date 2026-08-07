import { cn } from '@/lib/utils';
import ChatAvatar from '../ChatAvatar';
import type { ChatMentionUser } from '../../types';

interface MentionDropdownProps {
   users: ChatMentionUser[];
   activeIndex: number;
   onSelect: (user: ChatMentionUser) => void;
}

export default function MentionDropdown({ users, activeIndex, onSelect }: MentionDropdownProps) {
   if (users.length === 0) return null;

   return (
      <ul className="absolute bottom-full left-0 z-10 mb-1 max-h-56 w-full overflow-y-auto rounded-sm border border-gray-200 bg-white py-1 shadow-md">
         {users.map((user, index) => (
            <li key={user.id}>
               <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => onSelect(user)}
                  className={cn(
                     'flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left',
                     index === activeIndex ? 'bg-gray-100' : 'hover:bg-gray-50',
                  )}
               >
                  <ChatAvatar name={user.name} />
                  <span className="text-sm font-medium text-gray-900">{user.name}</span>
                  <span className="text-xs text-gray-400">{user.roleLabel}</span>
               </button>
            </li>
         ))}
      </ul>
   );
}
