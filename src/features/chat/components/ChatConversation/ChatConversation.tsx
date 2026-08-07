'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronLeft, Paperclip, Search, Send, X } from 'lucide-react';
import ChatMessageBubble from './ChatMessageBubble';
import MessageSearchBar from './MessageSearchBar';
import MentionDropdown from './MentionDropdown';
import ReplyPreview from './ReplyPreview';
import ConfirmModal from '@/components/ui/ConfirmModal';
import {
   createReply,
   deleteMessage,
   editMessage,
   getChannelDetail,
   getChannelMessages,
   getUserStatus,
   sendMessage,
   type ChatChannel,
} from '@/services/chat.service';
import { mapMessageDto } from '../../chatMappers';
import { DUMMY_MENTION_USERS } from '../../dummyMentionUsers';
import { getMyUserId } from '@/lib/auth/current-user';
import { useAuth } from '@/components/auth/AuthContext';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import type { ChatMessage, ChatMentionUser } from '../../types';

interface ChatConversationProps {
   room: ChatChannel;
   replyCounts: Record<string, number>;
   onReplySent: (rootId: string) => void;
   onOpenThread: (message: ChatMessage) => void;
   onBack: () => void;
   onClose: () => void;
}

export default function ChatConversation({
   room,
   replyCounts,
   onReplySent,
   onOpenThread,
   onBack,
   onClose,
}: ChatConversationProps) {
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

   const [messages, setMessages] = useState<ChatMessage[]>([]);
   const [isLoadingMessages, setIsLoadingMessages] = useState(true);
   const [draft, setDraft] = useState('');
   const [isPartnerOnline, setIsPartnerOnline] = useState<boolean | null>(null);
   const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null);
   const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
   const [deleteTarget, setDeleteTarget] = useState<ChatMessage | null>(null);
   const [isSearchOpen, setIsSearchOpen] = useState(false);
   const [searchQuery, setSearchQuery] = useState('');
   const [activeSearchIndex, setActiveSearchIndex] = useState(0);
   const [mentionActiveIndex, setMentionActiveIndex] = useState(0);
   const inputRef = useRef<HTMLInputElement>(null);
   const isSubmittingRef = useRef(false);
   const isDeletingRef = useRef(false);

   const title = room.name;
   const subtitle =
      room.channelType === 'DM'
         ? isPartnerOnline
            ? '1:1 채팅 · 온라인'
            : '1:1 채팅'
         : '단체 채팅';

   // 채널 목록에는 상대방 userId가 없어 온라인 여부를 못 구함 - 방에 들어왔을 때
   // 채널 상세로 멤버를 받아온 뒤, 나를 뺀 나머지 한 명(1:1일 때만)의 상태를 조회한다
   useEffect(() => {
      if (room.channelType !== 'DM') return;
      let isMounted = true;
      const uid = getMyUserId();

      getChannelDetail(room.channelId)
         .then((detail) => {
            const partnerId = detail.members.find((member) => member.userId !== uid)?.userId;
            if (partnerId == null) return null;
            return getUserStatus(partnerId);
         })
         .then((status) => {
            if (isMounted && status) setIsPartnerOnline(status.isOnline);
         })
         .catch(() => {
            // 온라인 표시는 보조 정보라 실패해도 조용히 무시 (기본 문구만 보여줌)
         });

      return () => {
         isMounted = false;
      };
   }, [room.channelId, room.channelType]);

   // 채널 메시지 이력 로드 — 방을 바꾸면 ChatPanel이 key로 이 컴포넌트를 새로 마운트하므로
   // isLoadingMessages는 초기값(true) 그대로 시작한다
   useEffect(() => {
      let isMounted = true;
      getChannelMessages(room.channelId)
         .then((page) => {
            if (!isMounted) return;
            // 백엔드가 최신순(sentAt DESC)으로 내려주므로 화면 표시용으로 오래된 순으로 뒤집는다
            const mapped = page.content
               .slice()
               .reverse()
               .map((dto) => mapMessageDto(dto, mapCtx));
            setMessages(mapped);
         })
         .catch((err) => {
            toast.error(
               err instanceof ApiError ? err.message : '메시지를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
            );
         })
         .finally(() => {
            if (isMounted) setIsLoadingMessages(false);
         });
      return () => {
         isMounted = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [room.channelId]);

   // "@뒤에 공백 없이 이어지는 부분"을 멘션 검색어로 취급
   const mentionMatch = /@([^\s@]*)$/.exec(draft);
   const mentionQuery = mentionMatch ? mentionMatch[1] : null;
   const mentionResults: ChatMentionUser[] =
      mentionQuery !== null
         ? DUMMY_MENTION_USERS.filter((user) => user.name.toLowerCase().includes(mentionQuery.toLowerCase()))
         : [];

   const searchMatches = useMemo(() => {
      const q = searchQuery.trim().toLowerCase();
      if (!q) return [];
      return messages.filter((m) => !m.isDeleted && m.content.toLowerCase().includes(q));
   }, [messages, searchQuery]);

   // 입력이 바뀔 때마다(타이핑) 멘션 후보 강조 인덱스를 첫 번째로 되돌린다
   const handleDraftChange = (value: string) => {
      setDraft(value);
      setMentionActiveIndex(0);
   };

   // 검색어가 바뀌면 활성 인덱스를 첫 번째 결과로 되돌린다
   const handleSearchQueryChange = (value: string) => {
      setSearchQuery(value);
      setActiveSearchIndex(0);
   };

   useEffect(() => {
      const target = searchMatches[activeSearchIndex];
      if (target) {
         document
            .getElementById(`chat-message-${target.id}`)
            ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
   }, [activeSearchIndex, searchMatches]);

   const handleSelectMention = (user: ChatMentionUser) => {
      setDraft((prev) => prev.replace(/@([^\s@]*)$/, `@${user.name} `));
      inputRef.current?.focus();
   };

   const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (mentionResults.length === 0) return;
      if (e.key === 'ArrowDown') {
         e.preventDefault();
         setMentionActiveIndex((i) => Math.min(i + 1, mentionResults.length - 1));
      } else if (e.key === 'ArrowUp') {
         e.preventDefault();
         setMentionActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
         e.preventDefault();
         handleSelectMention(mentionResults[mentionActiveIndex]);
      } else if (e.key === 'Escape') {
         setDraft((prev) => prev.replace(/@([^\s@]*)$/, ''));
      }
   };

   const handleStartReply = (message: ChatMessage) => {
      setEditingMessage(null);
      setReplyTarget(message);
      inputRef.current?.focus();
   };

   const handleStartEdit = (message: ChatMessage) => {
      setReplyTarget(null);
      setEditingMessage(message);
      setDraft(message.content);
      inputRef.current?.focus();
   };

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (mentionResults.length > 0) return; // 멘션 목록이 떠 있을 땐 Enter가 선택으로 처리되므로 전송 막기
      const content = draft.trim();
      if (!content || isSubmittingRef.current) return;

      isSubmittingRef.current = true;
      try {
         if (editingMessage) {
            await editMessage(editingMessage.id, { channelId: room.channelId, content });
            setMessages((prev) =>
               prev.map((m) => (m.id === editingMessage.id ? { ...m, content } : m)),
            );
            setEditingMessage(null);
         } else if (replyTarget) {
            const dto = await createReply(replyTarget.id, { channelId: room.channelId, content });
            const mapped = mapMessageDto(dto, mapCtx);
            mapped.replyToPreview = { senderName: replyTarget.senderName, content: replyTarget.content };
            setMessages((prev) => [...prev, mapped]);
            onReplySent(replyTarget.id);
            setReplyTarget(null);
         } else {
            // 멘션 대상 목록이 하드코딩 더미라 실제 사용자 id와 매칭되지 않으므로 항상 빈 배열로 보낸다
            const dto = await sendMessage(room.channelId, { content, mentionedUserIds: [] });
            setMessages((prev) => [...prev, mapMessageDto(dto, mapCtx)]);
         }
         setDraft('');
      } catch (err) {
         toast.error(
            err instanceof ApiError ? err.message : '메시지 전송에 실패했습니다. 잠시 후 다시 시도해주세요.',
         );
      } finally {
         isSubmittingRef.current = false;
      }
   };

   const handleConfirmDelete = async () => {
      if (!deleteTarget || isDeletingRef.current) return;
      isDeletingRef.current = true;
      try {
         await deleteMessage(deleteTarget.id);
         setMessages((prev) =>
            prev.map((m) => (m.id === deleteTarget.id ? { ...m, isDeleted: true, content: '' } : m)),
         );
      } catch (err) {
         toast.error(err instanceof ApiError ? err.message : '삭제에 실패했습니다. 잠시 후 다시 시도해주세요.');
      } finally {
         isDeletingRef.current = false;
         setDeleteTarget(null);
      }
   };

   return (
      <div className="flex h-full flex-col">
         <div className="flex items-center gap-2 border-b border-gray-200 p-4">
            <button
               type="button"
               onClick={onBack}
               aria-label="목록으로"
               className="cursor-pointer rounded-xs p-1 text-gray-500 hover:bg-gray-100"
            >
               <ChevronLeft size={18} />
            </button>
            <div className="min-w-0 flex-1">
               <p className="truncate text-sm font-bold text-gray-900">{title}</p>
               <p className="text-xs text-gray-400">{subtitle}</p>
            </div>
            <button
               type="button"
               onClick={() => setIsSearchOpen((prev) => !prev)}
               aria-label="메시지 검색"
               className="cursor-pointer rounded-xs p-1 text-gray-400 hover:bg-gray-100"
            >
               <Search size={18} />
            </button>
            <button
               type="button"
               onClick={onClose}
               aria-label="닫기"
               className="cursor-pointer rounded-xs p-1 text-gray-400 hover:bg-gray-100"
            >
               <X size={18} />
            </button>
         </div>

         {isSearchOpen && (
            <MessageSearchBar
               query={searchQuery}
               onQueryChange={handleSearchQueryChange}
               resultCount={searchMatches.length}
               activeIndex={activeSearchIndex}
               onPrev={() =>
                  setActiveSearchIndex((i) => (i - 1 + searchMatches.length) % searchMatches.length)
               }
               onNext={() => setActiveSearchIndex((i) => (i + 1) % searchMatches.length)}
               onClose={() => {
                  setIsSearchOpen(false);
                  setSearchQuery('');
               }}
            />
         )}

         <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            {isLoadingMessages ? (
               <p className="py-6 text-center text-sm text-gray-400">불러오는 중...</p>
            ) : messages.length === 0 ? (
               <p className="py-6 text-center text-sm text-gray-400">아직 주고받은 메시지가 없습니다</p>
            ) : (
               messages.map((message, index) => {
                  const prev = messages[index - 1];
                  const showSenderName = !prev || prev.senderId !== message.senderId;
                  const activeSearchMessageId = searchMatches[activeSearchIndex]?.id;
                  return (
                     <ChatMessageBubble
                        key={message.id}
                        message={message}
                        showSenderName={showSenderName}
                        replyCount={replyCounts[message.id] ?? 0}
                        isSearchActive={isSearchOpen && message.id === activeSearchMessageId}
                        onReply={() => handleStartReply(message)}
                        onEdit={() => handleStartEdit(message)}
                        onDelete={() => setDeleteTarget(message)}
                        onOpenThread={() => onOpenThread(message)}
                     />
                  );
               })
            )}
         </div>

         {replyTarget && (
            <ReplyPreview
               senderName={replyTarget.senderName}
               content={replyTarget.content}
               onCancel={() => setReplyTarget(null)}
            />
         )}
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

         <form onSubmit={handleSubmit} className="relative flex items-center gap-2 border-t border-gray-200 p-3">
            {mentionResults.length > 0 && (
               <MentionDropdown
                  users={mentionResults}
                  activeIndex={mentionActiveIndex}
                  onSelect={handleSelectMention}
               />
            )}
            <button
               type="button"
               aria-label="파일 첨부"
               className="shrink-0 cursor-pointer rounded-xs p-2 text-gray-400 hover:bg-gray-100"
            >
               <Paperclip size={18} />
            </button>
            <input
               ref={inputRef}
               value={draft}
               onChange={(e) => handleDraftChange(e.target.value)}
               onKeyDown={handleInputKeyDown}
               placeholder="메시지를 입력하세요... (@로 멘션)"
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
