'use client';

import { useState } from 'react';
import Image from 'next/image';
import { User, type LucideIcon } from 'lucide-react';
import { API_BASE_URL } from '@/lib/http';

// 채팅 프로필 사진은 절대 URL이 아니라 "/profileImg/55" 같은 상대 경로로 내려온다(콘솔에서
// http://localhost:3000/profileImg/55 404로 확인됨 - 프론트 origin 기준으로 요청되고 있었음).
// 백엔드 origin을 앞에 붙여줘야 실제 이미지 서버로 요청이 간다. 이렇게 만든 값이 그래도 올바른
// URL이 아니면(예상 못한 형식) next/image가 렌더링 시점에 바로 터지므로, 여기서 미리 검증해서
// 실패하면 null을 돌려주고 기본 아이콘으로 대체한다
function resolveImageUrl(url: string): string | null {
   const resolved = url.startsWith('/') ? `${API_BASE_URL}${url}` : url;
   try {
      new URL(resolved);
      return resolved;
   } catch {
      return null;
   }
}

interface ChatAvatarProps {
   name: string | null | undefined;
   // 없거나(백엔드 미지원) 로드에 실패하면 헤더 프로필 사진과 동일한 기본 아이콘으로 대체
   imageUrl?: string | null;
   isOnline?: boolean;
   size?: 'sm' | 'md';
   // sm/md 둘 다 안 맞을 때(예: 중간 크기) 컨테이너 크기를 직접 지정한다. size는 그대로 기본
   // 아이콘 크기 계산 등에 쓰이므로 같이 넘겨야 한다
   sizeClassName?: string;
   // 화면마다 배경이 달라 기본 아이콘 배경색을 바꿔야 할 때 쓴다(예: 팀 관리/팀 현황은 흰색)
   bgClassName?: string;
   // 기본 아이콘(사진 없을 때) 크기를 size별 기본값 대신 직접 지정하고 싶을 때 쓴다
   iconSize?: number;
   // 배경색이 카드 배경과 비슷해 경계가 안 보일 때(예: 흰 배경 위 흰 아바타) 테두리를 추가한다
   borderClassName?: string;
   // 기본 아이콘 자체를 바꾸고 싶을 때(예: 챗봇은 사람 아이콘 대신 로봇 아이콘) 쓴다 - 기본은 User
   icon?: LucideIcon;
   // 기본 아이콘 색상을 bgClassName과 어울리게 바꾸고 싶을 때 쓴다
   iconClassName?: string;
}

const SIZE_CLASSES: Record<'sm' | 'md', string> = {
   sm: 'h-7 w-7',
   md: 'h-11 w-11',
};

// sm 기본 아이콘이 28px 원 안에서 너무 작아 보여(10px) 16px로 키움 - md는 44px 원에 24px로 이미 적당한 비율
const ICON_SIZES: Record<'sm' | 'md', number> = {
   sm: 16,
   md: 24,
};

export default function ChatAvatar({
   name,
   imageUrl,
   isOnline,
   size = 'md',
   sizeClassName,
   bgClassName = 'bg-brand-sage/10',
   iconSize,
   borderClassName = '',
   icon: Icon = User,
   iconClassName = 'text-gray-500',
}: ChatAvatarProps) {
   // 이미지 URL이 있어도 로드가 실패하면(권한 없는 S3 경로, 잘못된 URL 등) 브라우저 기본
   // 깨진 이미지 아이콘 대신 기본 아이콘으로 대체한다. url이 바뀌면 다시 시도할 수 있게 초기화
   const [failedUrl, setFailedUrl] = useState<string | null>(null);
   const resolvedUrl = imageUrl ? resolveImageUrl(imageUrl) : null;
   const showImage = resolvedUrl !== null && resolvedUrl !== failedUrl;

   return (
      <span className="relative inline-flex shrink-0">
         <span
            className={`relative flex items-center justify-center overflow-hidden rounded-full ${iconClassName} ${bgClassName} ${borderClassName} ${sizeClassName ?? SIZE_CLASSES[size]}`}
         >
            {showImage ? (
               <Image
                  src={resolvedUrl}
                  alt={name ?? ''}
                  fill
                  sizes={size === 'sm' ? '28px' : '44px'}
                  onError={() => setFailedUrl(resolvedUrl)}
                  className="object-cover"
               />
            ) : (
               <Icon size={iconSize ?? ICON_SIZES[size]} />
            )}
         </span>
         {isOnline && (
            <span className="absolute right-0 bottom-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-brand-sage" />
         )}
      </span>
   );
}
