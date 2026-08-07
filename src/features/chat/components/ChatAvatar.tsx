const AVATAR_COLORS = ['bg-brand-maroon', 'bg-brand-green', 'bg-brand-gold', 'bg-brand-red', 'bg-brand-sage'];

// 실제 데이터에 이름이 null인 사용자가 존재해(백엔드 확인됨) null/빈 문자열도 안전하게 처리
function colorForName(name: string | null | undefined) {
   const code = name ? name.charCodeAt(0) : 0;
   return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

interface ChatAvatarProps {
   name: string | null | undefined;
   isOnline?: boolean;
}

export default function ChatAvatar({ name, isOnline }: ChatAvatarProps) {
   return (
      <span className="relative inline-flex shrink-0">
         <span
            className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white ${colorForName(name)}`}
         >
            {name ? name.slice(0, 1) : '?'}
         </span>
         {isOnline && (
            <span className="absolute right-0 bottom-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-brand-sage" />
         )}
      </span>
   );
}
