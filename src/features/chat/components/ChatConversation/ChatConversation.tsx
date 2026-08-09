'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { isSameDay } from 'date-fns';
import { ChevronLeft, Paperclip, Search, Send, Users, X } from 'lucide-react';
import ChatMessageBubble from './ChatMessageBubble';
import MessageSearchBar from './MessageSearchBar';
import MentionDropdown from './MentionDropdown';
import ReplyPreview from './ReplyPreview';
import GroupMembersModal from './GroupMembersModal';
import ConfirmModal from '@/components/ui/ConfirmModal';
import {
   createReply,
   deleteMessage,
   editMessage,
   getChannelDetail,
   getChannelMessages,
   getUserStatus,
   searchMessages,
   sendMessage,
   uploadChatAttachment,
   type ChatChannel,
   type ChatChannelMember,
   type ChatMessageDto,
} from '@/services/chat.service';
import { getAttachmentFileName, getMessagePreviewText, mapMessageDto } from '../../chatMappers';
import { formatChatDateDivider } from '../../formatChatTimestamp';
import { useAuth } from '@/components/auth/AuthContext';
import { getChatErrorMessage } from '../../chatErrors';
import { toast } from '@/lib/toast';
import type { ChatMessage, ChatMentionUser } from '../../types';

// 열려 있는 대화방에 다른 참여자가 보낸 새 메시지가 있는지 주기적으로 확인 (실시간 푸시가 없어 근사치)
const MESSAGE_POLL_INTERVAL_MS = 8000;
// 검색어를 입력하는 동안마다 서버로 요청을 보내지 않도록 잠깐 대기
const SEARCH_DEBOUNCE_MS = 300;

interface ChatConversationProps {
   room: ChatChannel;
   replyCounts: Record<string, number>;
   onReplySent: (rootId: string) => void;
   onOpenThread: (message: ChatMessage) => void;
   onBack: () => void;
   // 스레드(ThreadPanel)에서 루트 메시지를 수정/삭제하면, 이 목록에도 같은 메시지가 들어있을 수 있어
   // 그 최신 상태를 여기로도 반영해달라고 부모(ChatPanel)가 내려주는 값
   incomingMessagePatch?: ChatMessage | null;
}

export default function ChatConversation({
   room,
   replyCounts,
   onReplySent,
   onOpenThread,
   onBack,
   incomingMessagePatch,
}: ChatConversationProps) {
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

   const [messages, setMessages] = useState<ChatMessage[]>([]);
   // 렌더 중 prop 변화를 감지해 반영하는 패턴(React의 "prop 변경에 따라 state 조정") - 같은 patch를
   // 두 번 반영하지 않도록 마지막으로 적용한 patch 객체 자체를 비교 기준으로 삼는다
   const [appliedPatch, setAppliedPatch] = useState<ChatMessage | null>(null);
   if (incomingMessagePatch && incomingMessagePatch !== appliedPatch) {
      setAppliedPatch(incomingMessagePatch);
      setMessages((prev) =>
         prev.map((m) => (m.id === incomingMessagePatch.id ? incomingMessagePatch : m)),
      );
   }
   const [isLoadingMessages, setIsLoadingMessages] = useState(true);
   const [draft, setDraft] = useState('');
   const [isPartnerOnline, setIsPartnerOnline] = useState<boolean | null>(null);
   const [replyTarget, setReplyTarget] = useState<ChatMessage | null>(null);
   const [editingMessage, setEditingMessage] = useState<ChatMessage | null>(null);
   const [deleteTarget, setDeleteTarget] = useState<ChatMessage | null>(null);
   const [isSearchOpen, setIsSearchOpen] = useState(false);
   const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
   const [searchQuery, setSearchQuery] = useState('');
   const [activeSearchIndex, setActiveSearchIndex] = useState(0);
   const [mentionActiveIndex, setMentionActiveIndex] = useState(0);
   // 지금까지 입력창에서 선택한 멘션 대상들 - 전송 시 본문에 "@이름"이 아직 남아있는 사람만 추려 id로 보낸다
   const [mentionedUsers, setMentionedUsers] = useState<ChatMentionUser[]>([]);
   const [remoteSearchMatches, setRemoteSearchMatches] = useState<ChatMessageDto[]>([]);
   const [pendingAttachment, setPendingAttachment] = useState<{ url: string; name: string } | null>(
      null,
   );
   const [isUploadingAttachment, setIsUploadingAttachment] = useState(false);
   const inputRef = useRef<HTMLInputElement>(null);
   const fileInputRef = useRef<HTMLInputElement>(null);
   const isSubmittingRef = useRef(false);
   const isDeletingRef = useRef(false);

   const title = room.name;
   const subtitle = room.channelType === 'DM' ? '1:1 채팅' : '단체 채팅';

   // 채널 상세(멤버 목록)와 메시지 이력을 함께 받아온다. 멤버 목록은 GROUP 메시지 발신자 이름과
   // 멘션 후보에 쓰이는데, 메시지를 별도 effect에서 따로 불러와 매핑하면 멤버 목록이 아직
   // 로딩 중일 때 매핑된 이름이 고정돼버려(참여자로 굳어짐) 나중에 멤버가 로드돼도 갱신되지 않는다.
   // 그래서 두 응답을 함께 기다린 뒤, 방금 받아온 멤버 목록으로 바로 매핑한다.
   // 방을 바꾸면 ChatPanel이 key로 이 컴포넌트를 새로 마운트하므로 isLoadingMessages는 초기값(true) 그대로 시작한다
   useEffect(() => {
      let isMounted = true;
      const uid = myUserId;

      Promise.all([getChannelDetail(room.channelId), getChannelMessages(room.channelId)])
         .then(([detail, page]) => {
            if (!isMounted) return;
            setMembers(detail.members);
            const ctx = {
               currentUserId: uid ?? -1,
               currentUserName: myName,
               members: detail.members,
            };
            // 백엔드가 최신순(sentAt DESC)으로 내려주므로 화면 표시용으로 오래된 순으로 뒤집는다
            const mapped = page.content
               .slice()
               .reverse()
               .map((dto) => mapMessageDto(dto, ctx));
            setMessages(mapped);

            if (room.channelType !== 'DM') return;
            // DM은 채널 목록에 상대방 userId가 없어 온라인 여부도 못 구하므로, 나를 뺀 나머지 한 명의 상태를 이어서 조회한다
            const partnerId = detail.members.find((member) => member.userId !== uid)?.userId;
            if (partnerId == null) return;
            getUserStatus(partnerId)
               .then((status) => {
                  if (isMounted) setIsPartnerOnline(status.isOnline);
               })
               .catch(() => {
                  // 온라인 표시는 보조 정보라 실패해도 조용히 무시 (기본 문구만 보여줌)
               });
         })
         .catch((err) => {
            toast.error(getChatErrorMessage(err, '메시지를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.'));
         })
         .finally(() => {
            if (isMounted) setIsLoadingMessages(false);
         });

      return () => {
         isMounted = false;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [room.channelId, room.channelType]);

   // 실시간 푸시(웹소켓)가 없어, 열려 있는 대화방에 다른 사람이 보낸 새 메시지나 다른 사람의
   // 수정·삭제가 있는지 주기적으로 조용히 다시 조회한다. id로 병합해 기존 메시지는 최신 내용으로
   // 갱신하고, 새 메시지만 뒤에 붙인다(단, 답장 인용 미리보기처럼 서버가 안 주는 클라이언트 전용
   // 필드는 유지)
   useEffect(() => {
      const interval = setInterval(() => {
         getChannelMessages(room.channelId)
            .then((page) => {
               setMessages((prev) => {
                  const dtoById = new Map(page.content.map((dto) => [dto.sendbirdMessageId, dto]));
                  const merged = prev.map((m) => {
                     const dto = dtoById.get(m.id);
                     if (!dto) return m;
                     return { ...mapMessageDto(dto, mapCtx), replyToPreview: m.replyToPreview };
                  });
                  const existingIds = new Set(prev.map((m) => m.id));
                  const newOnes = page.content
                     .slice()
                     .reverse()
                     .filter((dto) => !existingIds.has(dto.sendbirdMessageId))
                     .map((dto) => mapMessageDto(dto, mapCtx));
                  return newOnes.length > 0 ? [...merged, ...newOnes] : merged;
               });
            })
            .catch(() => {}); // 백그라운드 새로고침이라 실패해도 조용히 무시
      }, MESSAGE_POLL_INTERVAL_MS);
      return () => clearInterval(interval);
   }, [room.channelId, mapCtx]);

   // 검색어가 바뀔 때마다(디바운스 후) 서버 검색 API로 채널 전체 이력에서 매치를 찾는다.
   // 다만 위/아래 이동은 실제로 화면에 그려진 메시지로만 가능하므로(페이지네이션이 없어 최근분만 로드됨),
   // 서버 매치 결과와 현재 로드된 messages의 교집합만 이동 가능한 결과로 취급한다
   useEffect(() => {
      const query = searchQuery.trim();
      let isMounted = true;
      // 검색어를 지웠을 때는 기다릴 필요가 없어 0ms로 바로 처리하지만, setState는 항상
      // 콜백(타이머) 안에서만 호출해 effect 본문에서 직접 호출하지 않도록 한다
      const timer = setTimeout(() => {
         if (!query) {
            if (isMounted) setRemoteSearchMatches([]);
            return;
         }
         searchMessages({ channelId: room.channelId, keyword: query })
            .then((page) => {
               if (isMounted) setRemoteSearchMatches(page.content);
            })
            .catch(() => {
               if (isMounted) setRemoteSearchMatches([]);
            });
      }, query ? SEARCH_DEBOUNCE_MS : 0);
      return () => {
         isMounted = false;
         clearTimeout(timer);
      };
   }, [searchQuery, room.channelId]);

   // 채널 상세 조회로 받은 실제 멤버 목록에서 나를 제외하고 멘션 후보로 쓴다
   const mentionCandidates: ChatMentionUser[] = useMemo(
      () =>
         members
            .filter((member) => member.userId !== myUserId)
            .map((member) => ({ id: member.userId, name: member.memberName, roleLabel: '' })),
      [members, myUserId],
   );

   // "@뒤에 공백 없이 이어지는 부분"을 멘션 검색어로 취급
   const mentionMatch = /@([^\s@]*)$/.exec(draft);
   const mentionQuery = mentionMatch ? mentionMatch[1] : null;
   const mentionResults: ChatMentionUser[] =
      mentionQuery !== null
         ? mentionCandidates.filter((user) =>
              user.name.toLowerCase().includes(mentionQuery.toLowerCase()),
           )
         : [];

   const searchMatches = useMemo(() => {
      if (!searchQuery.trim()) return [];
      const remoteIds = new Set(remoteSearchMatches.map((m) => m.sendbirdMessageId));
      return messages.filter((m) => !m.isDeleted && remoteIds.has(m.id));
   }, [messages, remoteSearchMatches, searchQuery]);

   const handleDraftChange = (value: string) => {
      setDraft(value);
      setMentionActiveIndex(0);
   };

   const handleSearchQueryChange = (value: string) => {
      setSearchQuery(value);
      setActiveSearchIndex(0);
   };

   // 검색 중 메시지가 삭제되는 등 결과 수가 줄어들면 activeSearchIndex가 범위를 벗어날 수 있어,
   // 실제 state는 그대로 두고 화면 표시/스크롤에는 이 보정된 값만 사용한다
   const safeActiveSearchIndex =
      searchMatches.length === 0 ? 0 : Math.min(activeSearchIndex, searchMatches.length - 1);

   useEffect(() => {
      const target = searchMatches[safeActiveSearchIndex];
      if (target) {
         document
            .getElementById(`chat-message-${target.id}`)
            ?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
   }, [safeActiveSearchIndex, searchMatches]);

   const handleSelectMention = (user: ChatMentionUser) => {
      setDraft((prev) => prev.replace(/@([^\s@]*)$/, `@${user.name} `));
      setMentionedUsers((prev) => (prev.some((u) => u.id === user.id) ? prev : [...prev, user]));
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
      setPendingAttachment(
         message.attachmentUrl
            ? { url: message.attachmentUrl, name: getAttachmentFileName(message.attachmentUrl) }
            : null,
      );
      inputRef.current?.focus();
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
      if (mentionResults.length > 0) return; // 멘션 목록이 떠 있을 땐 Enter가 선택으로 처리되므로 전송 막기
      const content = draft.trim();
      if ((!content && !pendingAttachment) || isSubmittingRef.current) return;

      isSubmittingRef.current = true;
      try {
         if (editingMessage) {
            const attachmentUrl = pendingAttachment?.url ?? null;
            await editMessage(editingMessage.id, { channelId: room.channelId, content, attachmentUrl });
            setMessages((prev) =>
               prev.map((m) => (m.id === editingMessage.id ? { ...m, content, attachmentUrl } : m)),
            );
            setEditingMessage(null);
         } else if (replyTarget) {
            const dto = await createReply(replyTarget.id, {
               channelId: room.channelId,
               content: content || null,
               attachmentUrl: pendingAttachment?.url ?? null,
            });
            const mapped = mapMessageDto(dto, mapCtx);
            mapped.replyToPreview = {
               senderName: replyTarget.senderName,
               content: getMessagePreviewText(replyTarget),
            };
            setMessages((prev) => [...prev, mapped]);
            onReplySent(replyTarget.id);
            setReplyTarget(null);
         } else {
            // 본문에 "@이름"이 아직 남아있는(도중에 지우지 않은) 멘션만 대상 id로 보낸다
            const mentionedUserIds = mentionedUsers
               .filter((user) => content.includes(`@${user.name}`))
               .map((user) => user.id);
            const dto = await sendMessage(room.channelId, {
               content: content || null,
               attachmentUrl: pendingAttachment?.url ?? null,
               mentionedUserIds,
            });
            setMessages((prev) => [...prev, mapMessageDto(dto, mapCtx)]);
         }
         setDraft('');
         setPendingAttachment(null);
         setMentionedUsers([]);
      } catch (err) {
         toast.error(getChatErrorMessage(err, '메시지 전송에 실패했습니다. 잠시 후 다시 시도해주세요.'));
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
         setMessages((prev) =>
            prev.map((m) =>
               m.id === deleteTarget.id ? { ...m, isDeleted: true, content: '' } : m,
            ),
         );
         // 삭제한 메시지를 수정 중이었다면 그 상태도 정리
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
               <p className="flex items-center gap-1.5">
                  <span className="truncate text-sm font-bold text-gray-900">{title}</span>
                  {room.channelType === 'DM' && isPartnerOnline && (
                     <span className="h-2 w-2 shrink-0 rounded-full bg-brand-sage" aria-label="온라인" />
                  )}
               </p>
               <div className="flex items-center gap-1 text-xs text-gray-400">
                  <span>{subtitle}</span>
                  {room.channelType === 'GROUP' && (
                     <button
                        type="button"
                        onClick={() => setIsMembersModalOpen(true)}
                        aria-label="참여 멤버 보기"
                        className="flex cursor-pointer items-center gap-0.5 rounded-xs px-1 py-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                     >
                        <Users size={12} />
                        {members.length}
                     </button>
                  )}
               </div>
            </div>
            <button
               type="button"
               onClick={() => setIsSearchOpen((prev) => !prev)}
               aria-label="메시지 검색"
               className="cursor-pointer rounded-xs p-1 text-gray-400 hover:bg-gray-100"
            >
               <Search size={18} />
            </button>
         </div>

         {isSearchOpen && (
            <MessageSearchBar
               query={searchQuery}
               onQueryChange={handleSearchQueryChange}
               resultCount={searchMatches.length}
               activeIndex={safeActiveSearchIndex}
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
               <p className="py-6 text-center text-sm text-gray-400">
                  아직 주고받은 메시지가 없습니다
               </p>
            ) : (
               messages.map((message, index) => {
                  const prev = messages[index - 1];
                  const showSenderName = !prev || prev.senderId !== message.senderId;
                  const showDateDivider = !prev || !isSameDay(new Date(prev.sentAtISO), new Date(message.sentAtISO));
                  const activeSearchMessageId = searchMatches[safeActiveSearchIndex]?.id;
                  return (
                     <div key={message.id}>
                        {showDateDivider && (
                           <div className="mb-3 flex items-center gap-2 text-xs text-gray-400">
                              <span className="h-px flex-1 bg-gray-200" />
                              <span className="shrink-0">{formatChatDateDivider(message.sentAtISO)}</span>
                              <span className="h-px flex-1 bg-gray-200" />
                           </div>
                        )}
                        <ChatMessageBubble
                           message={message}
                           showSenderName={showSenderName}
                           replyCount={replyCounts[message.id] ?? 0}
                           isSearchActive={isSearchOpen && message.id === activeSearchMessageId}
                           onReply={() => handleStartReply(message)}
                           onEdit={() => handleStartEdit(message)}
                           onDelete={() => setDeleteTarget(message)}
                           onOpenThread={() => onOpenThread(message)}
                        />
                     </div>
                  );
               })
            )}
         </div>

         {replyTarget && (
            <ReplyPreview
               senderName={replyTarget.senderName}
               content={getMessagePreviewText(replyTarget)}
               onCancel={() => setReplyTarget(null)}
            />
         )}
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

         <form
            onSubmit={handleSubmit}
            className="relative flex items-center gap-2 border-t border-gray-200 p-3"
         >
            {mentionResults.length > 0 && (
               <MentionDropdown
                  users={mentionResults}
                  activeIndex={mentionActiveIndex}
                  onSelect={handleSelectMention}
               />
            )}
            <input
               ref={fileInputRef}
               type="file"
               onChange={handleFileSelected}
               className="hidden"
            />
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
               onChange={(e) => handleDraftChange(e.target.value)}
               onKeyDown={handleInputKeyDown}
               placeholder="메시지를 입력하세요... (@로 멘션)"
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

         {isMembersModalOpen && (
            <GroupMembersModal members={members} onClose={() => setIsMembersModalOpen(false)} />
         )}
      </div>
   );
}
