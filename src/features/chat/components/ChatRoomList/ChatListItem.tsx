interface ChatListItemProps {
   avatar: React.ReactNode;
   title: string;
   timestamp?: string;
   preview?: string;
   unreadCount?: number;
   onClick: () => void;
}

export default function ChatListItem({
   avatar,
   title,
   timestamp,
   preview,
   unreadCount,
   onClick,
}: ChatListItemProps) {
   return (
      <button
         type="button"
         onClick={onClick}
         className="flex w-full cursor-pointer items-center gap-3 border-b border-gray-100 px-4 py-3.5 text-left last:border-none hover:bg-gray-50"
      >
         {avatar}
         <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
               <span className="truncate text-sm font-semibold text-gray-900">{title}</span>
               {timestamp && <span className="shrink-0 text-xs text-gray-400">{timestamp}</span>}
            </div>
            {preview && (
               <div className="mt-0.5 flex items-center justify-between gap-2">
                  <p className="truncate text-xs text-gray-400">{preview}</p>
                  {!!unreadCount && (
                     <span className="flex h-4.5 min-w-4.5 shrink-0 items-center justify-center rounded-full bg-brand-green px-1 text-[11px] font-medium text-white">
                        {unreadCount}
                     </span>
                  )}
               </div>
            )}
         </div>
      </button>
   );
}
