import { cn } from '@/lib/utils';
import type { ChatMessage } from '../types';

interface ChatMessageBubbleProps {
   message: ChatMessage;
   showSenderName: boolean;
}

export default function ChatMessageBubble({ message, showSenderName }: ChatMessageBubbleProps) {
   return (
      <div className={cn('flex flex-col', message.isMine ? 'items-end' : 'items-start')}>
         {showSenderName && !message.isMine && (
            <span className="mb-1 text-xs font-medium text-gray-500">{message.senderName}</span>
         )}
         <div className={cn('flex items-end gap-1.5', message.isMine && 'flex-row-reverse')}>
            <div
               className={cn(
                  'max-w-64 rounded-sm px-3 py-2 text-sm wrap-break-word',
                  message.isMine
                     ? 'rounded-br-none bg-brand-green text-white'
                     : 'rounded-bl-none bg-gray-100 text-gray-900',
               )}
            >
               {message.content}
            </div>
            <span className="shrink-0 whitespace-nowrap text-[11px] text-gray-400">
               {message.isMine && message.isRead && (
                  <span className="mr-1 text-brand-sage">읽음</span>
               )}
               {message.sentAt}
            </span>
         </div>
      </div>
   );
}
