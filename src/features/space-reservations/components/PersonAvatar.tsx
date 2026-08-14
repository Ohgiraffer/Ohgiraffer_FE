'use client';

import { useState } from 'react';
import { User } from 'lucide-react';

type Props = {
   name: string;
   profileImgUrl?: string | null;
   isCurrentUser?: boolean;
};

export default function PersonAvatar({ name, profileImgUrl, isCurrentUser }: Props) {
   const [failedUrl, setFailedUrl] = useState<string | null>(null);
   const showImage = Boolean(profileImgUrl) && profileImgUrl !== failedUrl;

   return (
      <span
         className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full ${
            isCurrentUser ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-600'
         }`}
      >
         {showImage ? (
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
