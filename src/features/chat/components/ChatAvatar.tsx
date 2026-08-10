'use client';

import { useState } from 'react';
import { API_BASE_URL } from '@/lib/http';

const AVATAR_COLORS = ['bg-brand-maroon', 'bg-brand-green', 'bg-brand-gold', 'bg-brand-red', 'bg-brand-sage'];

// 실제 데이터에 이름이 null인 사용자가 존재해(백엔드 확인됨) null/빈 문자열도 안전하게 처리
function colorForName(name: string | null | undefined) {
   const code = name ? name.charCodeAt(0) : 0;
   return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

// 채팅 프로필 사진은 절대 URL이 아니라 "/profileImg/55" 같은 상대 경로로 내려온다(콘솔에서
// http://localhost:3000/profileImg/55 404로 확인됨 - 프론트 origin 기준으로 요청되고 있었음).
// 백엔드 origin을 앞에 붙여줘야 실제 이미지 서버로 요청이 간다
function resolveImageUrl(url: string) {
   return url.startsWith('/') ? `${API_BASE_URL}${url}` : url;
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
   // 이미지 URL이 있어도 로드가 실패하면(권한 없는 S3 경로, 잘못된 URL 등) 브라우저 기본
   // 깨진 이미지 아이콘 대신 이니셜 아바타로 대체한다. url이 바뀌면 다시 시도할 수 있게 초기화
   const [failedUrl, setFailedUrl] = useState<string | null>(null);
   const showImage = imageUrl && imageUrl !== failedUrl;

   return (
      <span className="relative inline-flex shrink-0">
         {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- 외부(S3) 원본 URL, next/image 도메인 화이트리스트 불필요
            <img
               src={resolveImageUrl(imageUrl)}
               alt=""
               onError={() => setFailedUrl(imageUrl)}
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
