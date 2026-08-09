const AVATAR_COLORS = ['bg-brand-maroon', 'bg-brand-green', 'bg-brand-gold', 'bg-brand-red', 'bg-brand-sage'];

// 실제 데이터에 이름이 null인 사용자가 존재해(백엔드 확인됨) null/빈 문자열도 안전하게 처리
function colorForName(name: string | null | undefined) {
   const code = name ? name.charCodeAt(0) : 0;
   return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

interface ChatAvatarProps {
   name: string | null | undefined;
   // 백엔드가 프로필 사진 URL을 내려주는 곳(현재는 사용자 검색 결과)에서만 전달됨 - 없으면 이니셜로 대체
   imageUrl?: string | null;
   isOnline?: boolean;
   size?: 'sm' | 'md';
}

const SIZE_CLASSES: Record<'sm' | 'md', string> = {
   sm: 'h-7 w-7 text-xs',
   md: 'h-11 w-11 text-sm',
};

export default function ChatAvatar({ name, imageUrl, isOnline, size = 'md' }: ChatAvatarProps) {
   return (
      <span className="relative inline-flex shrink-0">
         {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- 외부(S3) 원본 URL, next/image 도메인 화이트리스트 불필요
            <img
               src={imageUrl}
               alt=""
               className={`rounded-full object-cover ${SIZE_CLASSES[size]}`}
            />
         ) : (
            <span
               className={`flex items-center justify-center rounded-full font-semibold text-white ${SIZE_CLASSES[size]} ${colorForName(name)}`}
            >
               {name ? name.slice(0, 1) : '?'}
            </span>
         )}
         {isOnline && (
            <span className="absolute right-0 bottom-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-brand-sage" />
         )}
      </span>
   );
}
