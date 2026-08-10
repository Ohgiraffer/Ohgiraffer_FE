import { CornerDownRight, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import ChatAvatar from '../ChatAvatar';
import MessageActionMenu from './MessageActionMenu';
import { getAttachmentFileName } from '../../chatMappers';
import type { ChatMessage } from '../../types';

const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|svg)$/i;

// 서명 쿼리(?X-Amz-...)나 fragment가 붙은 URL도 있어, 쿼리/fragment를 뺀 pathname만으로 확장자를 판단한다
function isImageAttachment(url: string) {
   try {
      return IMAGE_EXTENSIONS.test(new URL(url).pathname);
   } catch {
      return IMAGE_EXTENSIONS.test(url);
   }
}

interface ChatMessageBubbleProps {
   message: ChatMessage;
   showSenderName: boolean;
   replyCount: number;
   isSearchActive: boolean;
   // 대화방 본문에서는 인용 박스를 보여주고, 스레드에서는 원본이 이미 위에 있으므로 보여주지 않는다
   showReplyQuote?: boolean;
   // 상대방 메시지에서 시간 대신 호버 시 답장 아이콘을 보여줄지 - 스레드 안에서는 끔
   showReplyOnHover?: boolean;
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
   showReplyQuote = true,
   showReplyOnHover = true,
   onReply,
   onEdit,
   onDelete,
   onOpenThread,
}: ChatMessageBubbleProps) {
   return (
      <div
         id={`chat-message-${message.id}`}
         className={cn('group flex', message.isMine ? 'justify-end' : 'justify-start')}
      >
         {!message.isMine && (
            <div className="mr-2 w-7 shrink-0">
               {showSenderName && (
                  <ChatAvatar name={message.senderName} imageUrl={message.senderProfileImageUrl} size="sm" />
               )}
            </div>
         )}
         <div className={cn('flex flex-col', message.isMine ? 'items-end' : 'items-start')}>
            {showSenderName && !message.isMine && (
               <span className="mb-1 text-xs font-medium text-gray-500">{message.senderName}</span>
            )}
            {message.replyToPreview && !message.isDeleted && showReplyQuote && (
               <div className="mb-1 max-w-64 truncate border-l-2 border-brand-green pl-2 text-xs text-brand-green">
                  <span className="font-medium">{message.replyToPreview.senderName}: </span>
                  {message.replyToPreview.content}
               </div>
            )}
            <div className="flex items-end gap-1">
               {message.isMine && (
                  <span className="relative flex h-3.5 w-9 shrink-0 items-center justify-end">
                     <span
                        className={cn(
                           'whitespace-nowrap text-[11px] text-gray-400 transition-opacity',
                           !message.isDeleted && 'group-hover:opacity-0',
                        )}
                     >
                        {message.sentAt}
                     </span>
                     {!message.isDeleted && (
                        <div className="absolute right-0 flex items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                           <MessageActionMenu onEdit={onEdit} onDelete={onDelete} />
                           <button
                              type="button"
                              onClick={onReply}
                              aria-label="답장"
                              className="cursor-pointer rounded-xs p-1 text-gray-400 hover:bg-gray-100"
                           >
                              <CornerDownRight size={14} />
                           </button>
                        </div>
                     )}
                  </span>
               )}
               <div
                  className={cn(
                     'max-w-64 rounded-sm px-3 py-2 text-sm wrap-break-word transition-colors',
                     message.isDeleted
                        ? 'bg-gray-50 text-gray-400 italic'
                        : message.isMine
                          ? 'rounded-br-none bg-[#E8F0EC] text-[#1F2937]'
                          : 'rounded-tl-none bg-gray-100 text-gray-900',
                     isSearchActive && 'ring-2 ring-brand-green',
                  )}
               >
                  {message.isDeleted ? (
                     '삭제된 메시지입니다'
                  ) : message.attachmentUrl ? (
                     <div className="flex flex-col gap-1.5">
                        {isImageAttachment(message.attachmentUrl) ? (
                           // eslint-disable-next-line @next/next/no-img-element -- 외부(S3) 원본 URL, next/image 도메인 화이트리스트 불필요
                           <img
                              src={message.attachmentUrl}
                              alt={getAttachmentFileName(message.attachmentUrl)}
                              className="max-h-48 max-w-56 rounded-xs object-cover"
                           />
                        ) : (
                           <a
                              href={message.attachmentUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 underline underline-offset-2 hover:opacity-80"
                           >
                              <FileText size={14} className="shrink-0" />
                              <span className="truncate">{getAttachmentFileName(message.attachmentUrl)}</span>
                           </a>
                        )}
                        {message.content && <span>{message.content}</span>}
                     </div>
                  ) : (
                     message.content
                  )}
               </div>
               {!message.isMine && (showReplyOnHover ? (
                  <span className="relative flex h-3.5 w-9 shrink-0 items-center justify-end">
                     <span
                        className={cn(
                           'whitespace-nowrap text-[11px] text-gray-400 transition-opacity',
                           !message.isDeleted && 'group-hover:opacity-0',
                        )}
                     >
                        {message.sentAt}
                     </span>
                     {!message.isDeleted && (
                        <button
                           type="button"
                           onClick={onReply}
                           aria-label="답장"
                           className="absolute left-0 cursor-pointer text-gray-400 opacity-0 transition-opacity hover:text-gray-600 group-hover:opacity-100"
                        >
                           <CornerDownRight size={14} />
                        </button>
                     )}
                  </span>
               ) : (
                  <span className="shrink-0 whitespace-nowrap text-[11px] text-gray-400">
                     {message.sentAt}
                  </span>
               ))}
            </div>

            {replyCount >= 2 && (
               <button
                  type="button"
                  onClick={onOpenThread}
                  className="mt-1 flex cursor-pointer items-center gap-1 text-xs text-gray-400 hover:text-gray-600 hover:underline"
               >
                  <CornerDownRight size={12} />
                  답글 {replyCount}개
               </button>
            )}
         </div>
      </div>
   );
}
