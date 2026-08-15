'use client';

import { useState } from 'react';
import Image from 'next/image';
import { User } from 'lucide-react';
import { ROLE_LABELS } from '@/services/auth.service';
import type { Counselor } from '@/services/counseling.service';

type AvatarProps = {
   name: string;
   profileImgUrl?: string | null;
};

function CounselorAvatar({ name, profileImgUrl }: AvatarProps) {
   const [failedUrl, setFailedUrl] = useState<string | null>(null);
   const showImage = Boolean(profileImgUrl) && profileImgUrl !== failedUrl;

   return (
      <span className="relative flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-gray-500">
         {showImage ? (
            <Image
               src={profileImgUrl ?? ''}
               alt=""
               fill
               sizes="28px"
               className="object-cover"
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

// 상담 가능 운영진 목록
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
