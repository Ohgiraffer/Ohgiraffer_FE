'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, X } from 'lucide-react';
import ChatMessageBubble from './ChatMessageBubble';
import ConfirmModal from '@/components/ui/ConfirmModal';
import {
   createReply,
   deleteMessage,
   editMessage,
   getMessageReplies,
   type ChatChannel,
} from '@/services/chat.service';
import { mapMessageDto } from '../../chatMappers';
import { getMyUserId } from '@/lib/auth/current-user';
import { useAuth } from '@/components/auth/AuthContext';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import type { ChatMessage } from '../../types';

interface ThreadPanelProps {
   room: ChatChannel;
   rootMessage: ChatMessage;
   onClose: () => void;
   onReplySent: (rootId: string) => void;
}

export default function ThreadPanel({ room, rootMessage, onClose, onReplySent }: ThreadPanelProps) {
   const { me } = useAuth();
   const myUserId = getMyUserId();
   const myName = me?.name ?? '나';
   const mapCtx = useMemo(
      () => ({
         currentUserId: myUserId ?? -1,
         currentUserName: myName,
         partnerName: room.channelType === 'DM' ? room.name : undefined,
      }),
      [myUserId, myName, room.channelType, room.name],
   );

   const [root, setRoot] = useState(rootMessage);
   const [replies, setReplies] = useState<ChatMessage[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [draft, setDraft] = useState('');
   const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
   const [deleteTarget, setDeleteTarget] = useState<ChatMessage | null>(null);
   const isSubmittingRef = useRef(false);
   const isDeletingRef = useRef(false);

   // ChatPanel이 rootMessage.id를 key로 넘겨 스레드 대상이 바뀔 때마다 이 컴포넌트를 새로
   // 마운트하므로, root/isLoading은 초기값 그대로 시작한다
   useEffect(() => {
      let isMounted = true;
      getMessageReplies(rootMessage.id)
         .then((dtos) => {
            if (!isMounted) return;
            setReplies(dtos.map((dto) => mapMessageDto(dto, mapCtx)));
         })
         .catch((err) => {
            toast.error(err instanceof ApiError ? err.message : '답글을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.');
         })
         .finally(() => {
            if (isMounted) setIsLoading(false);
         });
      return () => {
         isMounted = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [rootMessage.id]);

   const handleStartEdit = (message: ChatMessage) => {
      setEditingMessage(message);
      setDraft(message.content);
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const content = draft.trim();
      if (!content || isSubmittingRef.current) return;

      isSubmittingRef.current = true;
      try {
         if (editingMessage) {
            await editMessage(editingMessage.id, { channelId: room.channelId, content });
            if (editingMessage.id === root.id) {
               setRoot((prev) => ({ ...prev, content }));
            } else {
               setReplies((prev) => prev.map((m) => (m.id === editingMessage.id ? { ...m, content } : m)));
            }
            setEditingMessage(null);
         } else {
            const dto = await createReply(root.id, { channelId: room.channelId, content });
            setReplies((prev) => [...prev, mapMessageDto(dto, mapCtx)]);
            onReplySent(root.id);
         }
         setDraft('');
      } catch (err) {
         toast.error(err instanceof ApiError ? err.message : '전송에 실패했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
         isSubmittingRef.current = false;
      }
   };

   const handleConfirmDelete = async () => {
      if (!deleteTarget || isDeletingRef.current) return;
      isDeletingRef.current = true;
      try {
         await deleteMessage(deleteTarget.id);
         if (deleteTarget.id === root.id) {
            setRoot((prev) => ({ ...prev, isDeleted: true, content: '' }));
         } else {
            setReplies((prev) =>
               prev.map((m) => (m.id === deleteTarget.id ? { ...m, isDeleted: true, content: '' } : m)),
            );
         }
      } catch (err) {
         toast.error(err instanceof ApiError ? err.message : '삭제에 실패했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
         isDeletingRef.current = false;
         setDeleteTarget(null);
      }
   };

   return (
      <div className="animate-slide-in-right absolute top-0 right-105 bottom-0 flex w-105 flex-col border-r border-gray-200 bg-white shadow-xl">
         <div className="flex items-center justify-between border-b border-gray-200 p-4">
            <h2 className="text-sm font-bold text-gray-900">스레드</h2>
            <button
               type="button"
               onClick={onClose}
               aria-label="닫기"
               className="cursor-pointer rounded-xs p-1 text-gray-400 hover:bg-gray-100"
            >
               <X size={18} />
            </button>
         </div>

         <div className="flex-1 overflow-y-auto p-4">
            <ChatMessageBubble
               message={root}
               showSenderName
               replyCount={0}
               isSearchActive={false}
               onReply={() => {}}
               onEdit={() => handleStartEdit(root)}
               onDelete={() => setDeleteTarget(root)}
               onOpenThread={() => {}}
            />

            <div className="my-3 text-xs text-gray-400">답글 {replies.length}개</div>

            {isLoading ? (
               <p className="py-6 text-center text-sm text-gray-400">불러오는 중...</p>
            ) : (
               <div className="flex flex-col gap-3">
                  {replies.map((reply, index) => (
                     <ChatMessageBubble
                        key={reply.id}
                        message={reply}
                        showSenderName={
                           !replies[index - 1] || replies[index - 1].senderId !== reply.senderId
                        }
                        replyCount={0}
                        isSearchActive={false}
                        onReply={() => {}}
                        onEdit={() => handleStartEdit(reply)}
                        onDelete={() => setDeleteTarget(reply)}
                        onOpenThread={() => {}}
                     />
                  ))}
               </div>
            )}
         </div>

         {editingMessage && (
            <div className="flex items-center justify-between gap-2 border-t border-gray-100 bg-gray-50 px-3 py-2">
               <p className="truncate text-xs text-gray-500">메시지 수정 중</p>
               <button
                  type="button"
                  onClick={() => {
                     setEditingMessage(null);
                     setDraft('');
                  }}
                  aria-label="수정 취소"
                  className="cursor-pointer rounded-xs p-1 text-gray-400 hover:bg-gray-200"
               >
                  <X size={14} />
               </button>
            </div>
         )}

         <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-gray-200 p-3">
            <input
               value={draft}
               onChange={(e) => setDraft(e.target.value)}
               placeholder="답글을 입력하세요."
               className="h-10 flex-1 rounded-sm border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-gray-400"
            />
            <button
               type="submit"
               disabled={!draft.trim()}
               aria-label="전송"
               className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-sm bg-brand-green text-white transition-colors hover:bg-[#4D655A] disabled:cursor-not-allowed disabled:bg-gray-200"
            >
               <Send size={16} />
            </button>
         </form>

         <ConfirmModal
            open={!!deleteTarget}
            title="메시지를 삭제할까요?"
            description="삭제한 메시지는 복구할 수 없습니다."
            variant="danger"
            confirmLabel="삭제"
            onConfirm={handleConfirmDelete}
            onClose={() => setDeleteTarget(null)}
         />
      </div>
   );
}
