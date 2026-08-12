'use client';

import { useState } from 'react';
import { User } from 'lucide-react';
import { ROLE_LABELS } from '@/services/auth.service';
import type { Counselor } from '@/services/counseling.service';

type AvatarProps = {
   name: string;
   profileImgUrl?: string | null;
};

// 공간 예약의 PersonAvatar와 동일한 방식: 사진이 있으면 그대로, 없거나 로드에 실패하면 User 아이콘으로 대체.
// (도메인이 달라 컴포넌트를 직접 재사용하지 않고 동일한 패턴만 가져옴)
function CounselorAvatar({ name, profileImgUrl }: AvatarProps) {
   const [failedUrl, setFailedUrl] = useState<string | null>(null);
   const showImage = Boolean(profileImgUrl) && profileImgUrl !== failedUrl;

   return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-gray-500">
         {showImage ? (
            // eslint-disable-next-line @next/next/no-img-element -- 동적 S3 URL이라 next/image 설정 없이 바로 사용
            <img
               src={profileImgUrl ?? undefined}
               alt=""
               className="h-full w-full object-cover"
               onError={() => setFailedUrl(profileImgUrl ?? null)}
            />
         ) : (
            <User size={14} aria-label={name} />
         )}
      </span>
   );
}

type Props = {
   counselors: Counselor[];
   selectedCounselorId: number | null;
   onSelect: (counselorId: number) => void;
};

// 훈련생 "상담 신청" 상단 - 상담 가능한 운영진을 칩으로 나열해서 한 명을 고른다
export default function CounselorList({ counselors, selectedCounselorId, onSelect }: Props) {
   return (
      <div className="flex flex-wrap gap-2">
         {counselors.map((counselor) => {
            const isSelected = counselor.counselorId === selectedCounselorId;
            return (
               <button
                  key={counselor.counselorId}
                  type="button"
                  onClick={() => onSelect(counselor.counselorId)}
                  aria-pressed={isSelected}
                  className={`flex cursor-pointer items-center gap-2 rounded-sm border px-3 py-2 text-sm transition-colors ${
                     isSelected
                        ? 'border-brand-green bg-[#F0F4F3]'
                        : 'border-[#E5E7EB] bg-white hover:bg-gray-50'
                  }`}
               >
                  <CounselorAvatar name={counselor.name} profileImgUrl={counselor.profileImgUrl} />
                  <span className="font-semibold text-gray-900">{counselor.name}</span>
                  <span className="text-xs text-gray-400">{ROLE_LABELS[counselor.role]}</span>
               </button>
            );
         })}
      </div>
   );
}
