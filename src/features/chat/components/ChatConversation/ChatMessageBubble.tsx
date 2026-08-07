import { MessageSquare, Reply } from 'lucide-react';
import { cn } from '@/lib/utils';
import MessageActionMenu from './MessageActionMenu';
import type { ChatMessage } from '../../types';

interface ChatMessageBubbleProps {
   message: ChatMessage;
   showSenderName: boolean;
   replyCount: number;
   isSearchActive: boolean;
   onReply: () => void;
   onEdit: () => void;
   onDelete: () => void;
   onOpenThread: () => void;
}

export default function ChatMessageBubble({
   message,
   showSenderName,
   replyCount,
   isSearchActive,
   onReply,
   onEdit,
   onDelete,
   onOpenThread,
}: ChatMessageBubbleProps) {
   return (
      <div
         id={`chat-message-${message.id}`}
         className={cn('group flex flex-col', message.isMine ? 'items-end' : 'items-start')}
      >
         {showSenderName && !message.isMine && (
            <span className="mb-1 text-xs font-medium text-gray-500">{message.senderName}</span>
         )}
         <div className={cn('flex items-end gap-1', message.isMine && 'flex-row-reverse')}>
            {!message.isDeleted && (
               <div className="flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                  {message.isMine && <MessageActionMenu onEdit={onEdit} onDelete={onDelete} />}
                  <button
                     type="button"
                     onClick={onReply}
                     aria-label="답장"
                     className="cursor-pointer rounded-xs p-1 text-gray-400 hover:bg-gray-100"
                  >
                     <Reply size={14} />
                  </button>
               </div>
            )}
            <div
               className={cn(
                  'max-w-64 rounded-sm px-3 py-2 text-sm wrap-break-word transition-colors',
                  message.isDeleted
                     ? 'bg-gray-50 text-gray-400 italic'
                     : message.isMine
                       ? 'rounded-br-none bg-[#E8F0EC] text-[#1F2937]'
                       : 'rounded-bl-none bg-gray-100 text-gray-900',
                  isSearchActive && 'ring-2 ring-brand-gold',
               )}
            >
               {message.replyToPreview && !message.isDeleted && (
                  <div className="mb-1 border-l-2 border-gray-300 pl-2 text-xs opacity-70">
                     <p className="font-medium">{message.replyToPreview.senderName}</p>
                     <p className="truncate">{message.replyToPreview.content}</p>
                  </div>
               )}
               {message.isDeleted ? '삭제된 메시지입니다' : message.content}
            </div>
            <span className="shrink-0 whitespace-nowrap text-[11px] text-gray-400">
               {message.isMine && message.isRead && !message.isDeleted && (
                  <span className="mr-1 text-brand-sage">읽음</span>
               )}
               {message.sentAt}
            </span>
         </div>

         {replyCount >= 2 && (
            <button
               type="button"
               onClick={onOpenThread}
               className="mt-1 flex cursor-pointer items-center gap-1 text-xs text-gray-400 hover:text-gray-600 hover:underline"
            >
               <MessageSquare size={12} />
               답글 {replyCount}개
            </button>
         )}
      </div>
   );
}
