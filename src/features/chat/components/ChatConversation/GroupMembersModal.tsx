'use client';

import { X } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import ChatAvatar from '../ChatAvatar';
import type { ChatChannelMember } from '@/services/chat.service';

interface GroupMembersModalProps {
   members: ChatChannelMember[];
   onClose: () => void;
}

export default function GroupMembersModal({ members, onClose }: GroupMembersModalProps) {
   return (
      <Modal onClose={onClose} ariaLabel="참여 멤버" panelClassName="flex max-h-[70vh] w-80 flex-col">
         <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-bold text-gray-900">참여 멤버 {members.length}명</h2>
            <button
               type="button"
               onClick={onClose}
               aria-label="닫기"
               className="cursor-pointer rounded-xs p-1 hover:bg-gray-100"
            >
               <X size={18} className="text-gray-400" />
            </button>
         </div>
         <ul className="-mx-2 flex-1 overflow-y-auto">
            {members.map((member) => (
               <li key={member.userId}>
                  <div className="flex items-center gap-3 rounded-sm px-2 py-2 hover:bg-gray-50">
                     <ChatAvatar name={member.memberName} />
                     <span className="truncate text-sm font-medium text-gray-900">
                        {member.memberName}
                     </span>
                  </div>
               </li>
            ))}
         </ul>
      </Modal>
   );
}
