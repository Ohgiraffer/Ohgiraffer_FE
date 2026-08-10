'use client';

import { useState } from 'react';
import { User } from 'lucide-react';

type Props = {
   name: string;
   profileImgUrl?: string | null;
   isCurrentUser?: boolean;
};

// 프로필 사진이 있으면 그대로 보여주고, 없거나(또는 로드 실패 시) ProfileDropdown과 동일하게
// lucide User 아이콘으로 대체
export default function PersonAvatar({ name, profileImgUrl, isCurrentUser }: Props) {
   // 로드에 실패한 URL을 그대로 기억해뒀다가 비교만 하는 방식 - profileImgUrl이 바뀌면(다른 사람
   // 카드로 재사용되는 등) 굳이 리셋하지 않아도 자동으로 다시 "실패 전" 상태가 된다
   const [failedUrl, setFailedUrl] = useState<string | null>(null);
   const showImage = Boolean(profileImgUrl) && profileImgUrl !== failedUrl;

   return (
      <span
         className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full ${
            isCurrentUser ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-600'
         }`}
      >
         {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- 동적 S3 URL이라 next/image 설정 없이 바로 사용
            <img
               src={profileImgUrl ?? undefined}
               alt=""
               className="h-full w-full object-cover"
               onError={() => setFailedUrl(profileImgUrl ?? null)}
            />
         ) : (
            <User size={18} aria-label={name} />
         )}
      </span>
   );
}
