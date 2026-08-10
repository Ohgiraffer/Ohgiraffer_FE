'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Paperclip, Send, X } from 'lucide-react';
import ChatMessageBubble from './ChatMessageBubble';
import ConfirmModal from '@/components/ui/ConfirmModal';
import {
   createReply,
   deleteMessage,
   editMessage,
   getChannelDetail,
   getMessageReplies,
   uploadChatAttachment,
   type ChatChannel,
   type ChatChannelMember,
} from '@/services/chat.service';
import { getAttachmentFileName, mapMessageDto } from '../../chatMappers';
import { useAuth } from '@/components/auth/AuthContext';
import { getChatErrorMessage } from '../../chatErrors';
import { toast } from '@/lib/toast';
import type { ChatMessage } from '../../types';

// 실시간 푸시가 없어, 스레드가 열려 있는 동안 새 답글이 있는지 주기적으로 조용히 다시 확인
const REPLY_POLL_INTERVAL_MS = 8000;

interface ThreadPanelProps {
   room: ChatChannel;
   rootMessage: ChatMessage;
   onClose: () => void;
   onReplySent: (rootId: string) => void;
   // 루트 메시지를 여기서 수정/삭제하면, 대화 목록에 있는 같은 메시지도 최신 상태로 맞추라고 부모에게 알림
   onRootMessageChange: (message: ChatMessage) => void;
}

export default function ThreadPanel({
   room,
   rootMessage,
   onClose,
   onReplySent,
   onRootMessageChange,
}: ThreadPanelProps) {
   const { me } = useAuth();
   const myUserId = me?.userId ?? null;
   const myName = me?.name ?? '나';
   const [members, setMembers] = useState<ChatChannelMember[]>([]);
   const mapCtx = useMemo(
      () => ({
         currentUserId: myUserId ?? -1,
         currentUserName: myName,
         members,
      }),
      [myUserId, myName, members],
   );

   const [root, setRoot] = useState(rootMessage);
   const [replies, setReplies] = useState<ChatMessage[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [draft, setDraft] = useState('');
   const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
   const [deleteTarget, setDeleteTarget] = useState<ChatMessage | null>(null);
   const [pendingAttachment, setPendingAttachment] = useState<{ url: string; name: string } | null>(
      null,
   );
   const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
   const inputRef = useRef<HTMLInputElement>(null);
   const fileInputRef = useRef<HTMLInputElement>(null);
   const isSubmittingRef = useRef(false);
   const isDeletingRef = useRef(false);

   // 멤버 목록(답글 발신자 이름 표시용, 특히 GROUP 채널)과 답글을 함께 받아온다.
   // 별도 effect로 나눠서 각자 상태(members)를 업데이트하면, 답글이 먼저 도착했을 때
   // 그 시점의 빈 멤버 목록으로 이름이 고정돼버려 나중에 멤버가 로드돼도 갱신되지 않는다.
   // ChatPanel이 rootMessage.id를 key로 넘겨 스레드 대상이 바뀔 때마다 이 컴포넌트를 새로
   // 마운트하므로, root/isLoading은 초기값 그대로 시작한다
   useEffect(() => {
      let isMounted = true;
      const uid = myUserId;

      Promise.all([getChannelDetail(room.channelId), getMessageReplies(rootMessage.id)])
         .then(([detail, dtos]) => {
            if (!isMounted) return;
            setMembers(detail.members);
            const ctx = { currentUserId: uid ?? -1, currentUserName: myName, members: detail.members };
            setReplies((dtos ?? []).map((dto) => mapMessageDto(dto, ctx)));
         })
         .catch((err) => {
            toast.error(getChatErrorMessage(err, '답글을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'));
         })
         .finally(() => {
            if (isMounted) setIsLoading(false);
         });
      return () => {
         isMounted = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [rootMessage.id, room.channelId]);

   // id로 병합해 기존 답글은 최신 내용(다른 사람의 수정·삭제 포함)으로 갱신하고, 새 답글만 뒤에 붙인다
   useEffect(() => {
      const interval = setInterval(() => {
         getMessageReplies(rootMessage.id)
            .then((dtos) => {
               setReplies((prev) => {
                  const list = dtos ?? [];
                  const dtoById = new Map(list.map((dto) => [dto.sendbirdMessageId, dto]));
                  const merged = prev.map((m) => {
                     const dto = dtoById.get(m.id);
                     return dto ? mapMessageDto(dto, mapCtx) : m;
                  });
                  const existingIds = new Set(prev.map((m) => m.id));
                  const newOnes = list
                     .filter((dto) => !existingIds.has(dto.sendbirdMessageId))
                     .map((dto) => mapMessageDto(dto, mapCtx));
                  return newOnes.length > 0 ? [...merged, ...newOnes] : merged;
               });
            })
            .catch(() => {}); // 백그라운드 새로고침이라 실패해도 조용히 무시
      }, REPLY_POLL_INTERVAL_MS);
      return () => clearInterval(interval);
   }, [rootMessage.id, mapCtx]);

   const handleStartEdit = (message: ChatMessage) => {
      setEditingMessage(message);
      setDraft(message.content);
      setPendingAttachment(
         message.attachmentUrl
            ? { url: message.attachmentUrl, name: getAttachmentFileName(message.attachmentUrl) }
            : null,
      );
   };

   const handleAttachClick = () => fileInputRef.current?.click();

   const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = '';
      if (!file) return;
      setIsUploadingAttachment(true);
      try {
         const { url } = await uploadChatAttachment(room.channelId, file);
         setPendingAttachment({ url, name: file.name });
      } catch (err) {
         toast.error(getChatErrorMessage(err, '파일 업로드에 실패했습니다. 잠시 후 다시 시도해주세요.'));
      } finally {
         setIsUploadingAttachment(false);
      }
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      const content = draft.trim();
      if ((!content && !pendingAttachment) || isSubmittingRef.current) return;

      isSubmittingRef.current = true;
      try {
         if (editingMessage) {
            const attachmentUrl = pendingAttachment?.url ?? null;
            await editMessage(editingMessage.id, { channelId: room.channelId, content, attachmentUrl });
            if (editingMessage.id === root.id) {
               const updatedRoot = { ...root, content, attachmentUrl };
               setRoot(updatedRoot);
               onRootMessageChange(updatedRoot);
            } else {
               setReplies((prev) =>
                  prev.map((m) => (m.id === editingMessage.id ? { ...m, content, attachmentUrl } : m)),
               );
            }
            setEditingMessage(null);
         } else {
            const dto = await createReply(root.id, {
               channelId: room.channelId,
               content: content || null,
               attachmentUrl: pendingAttachment?.url ?? null,
            });
            setReplies((prev) => [...prev, mapMessageDto(dto, mapCtx)]);
            onReplySent(root.id);
         }
         setDraft('');
         setPendingAttachment(null);
      } catch (err) {
         toast.error(getChatErrorMessage(err, '전송에 실패했습니다. 잠시 후 다시 시도해주세요.'));
      } finally {
         isSubmittingRef.current = false;
         inputRef.current?.focus();
      }
   };

   const handleConfirmDelete = async () => {
      if (!deleteTarget || isDeletingRef.current) return;
      isDeletingRef.current = true;
      try {
         await deleteMessage(deleteTarget.id, room.channelId);
         if (deleteTarget.id === root.id) {
            const updatedRoot = { ...root, isDeleted: true, content: '' };
            setRoot(updatedRoot);
            onRootMessageChange(updatedRoot);
         } else {
            setReplies((prev) =>
               prev.map((m) => (m.id === deleteTarget.id ? { ...m, isDeleted: true, content: '' } : m)),
            );
         }
         // 삭제한 메시지를 수정 중이었다면 그 상태도 정리한다
         if (editingMessage?.id === deleteTarget.id) {
            setEditingMessage(null);
            setDraft('');
            setPendingAttachment(null);
         }
      } catch (err) {
         toast.error(getChatErrorMessage(err, '삭제에 실패했습니다. 잠시 후 다시 시도해주세요.'));
      } finally {
         isDeletingRef.current = false;
         setDeleteTarget(null);
      }
   };

   return (
      <div className="animate-slide-in-right absolute top-0 right-0 bottom-0 w-full max-w-105 flex flex-col border-r-2 border-brand-green bg-white min-[900px]:right-105 min-[900px]:w-105">
         <div className="flex h-17.25 items-center justify-between border-b border-gray-200 p-4">
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
               showReplyQuote={false}
               showReplyOnHover={false}
               onReply={() => {}}
               onEdit={() => handleStartEdit(root)}
               onDelete={() => setDeleteTarget(root)}
               onOpenThread={() => {}}
            />

            <div className="my-3 flex items-center gap-2 text-xs text-gray-400">
               <span className="h-px flex-1 bg-gray-200" />
               <span className="shrink-0">답글 {replies.length}개</span>
               <span className="h-px flex-1 bg-gray-200" />
            </div>

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
                        showReplyQuote={false}
                        showReplyOnHover={false}
                        onReply={() => {}}
                        onEdit={() => handleStartEdit(reply)}
                        onDelete={() => setDeleteTarget(reply)}
                        onOpenThread={() => {}}
                     />
                  ))}
               </div>
            )}
         </div>

         {pendingAttachment && (
            <div className="flex items-center justify-between gap-2 border-t border-gray-100 bg-gray-50 px-3 py-2">
               <p className="flex items-center gap-1.5 truncate text-xs text-gray-500">
                  <Paperclip size={12} className="shrink-0" />
                  {pendingAttachment.name}
               </p>
               <button
                  type="button"
                  onClick={() => setPendingAttachment(null)}
                  aria-label="첨부파일 취소"
                  className="cursor-pointer rounded-xs p-1 text-gray-400 hover:bg-gray-200"
               >
                  <X size={14} />
               </button>
            </div>
         )}
         {editingMessage && (
            <div className="flex items-center justify-between gap-2 border-t border-gray-100 bg-gray-50 px-3 py-2">
               <p className="truncate text-xs text-gray-500">메시지 수정 중</p>
               <button
                  type="button"
                  onClick={() => {
                     setEditingMessage(null);
                     setDraft('');
                     setPendingAttachment(null);
                  }}
                  aria-label="수정 취소"
                  className="cursor-pointer rounded-xs p-1 text-gray-400 hover:bg-gray-200"
               >
                  <X size={14} />
               </button>
            </div>
         )}

         <form onSubmit={handleSubmit} className="flex items-center gap-2 border-t border-gray-200 p-3">
            <input ref={fileInputRef} type="file" onChange={handleFileSelected} className="hidden" />
            <button
               type="button"
               onClick={handleAttachClick}
               disabled={isUploadingAttachment}
               aria-label="파일 첨부"
               className="shrink-0 cursor-pointer rounded-xs p-2 text-gray-400 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
               <Paperclip size={18} className={isUploadingAttachment ? 'animate-pulse' : ''} />
            </button>
            <input
               ref={inputRef}
               value={draft}
               onChange={(e) => setDraft(e.target.value)}
               placeholder="답글을 입력하세요."
               className="h-10 flex-1 rounded-sm border border-gray-200 px-3 text-sm text-gray-900 outline-none focus:border-gray-400"
            />
            <button
               type="submit"
               disabled={!draft.trim() && !pendingAttachment}
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
