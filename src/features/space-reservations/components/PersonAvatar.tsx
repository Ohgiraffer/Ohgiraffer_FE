import { User } from 'lucide-react';

type Props = {
   name: string;
   profileImgUrl?: string | null;
   isCurrentUser?: boolean;
};

// 프로필 사진이 있으면 그대로 보여주고, 없으면 ProfileDropdown과 동일하게 lucide User 아이콘으로 대체
export default function PersonAvatar({ name, profileImgUrl, isCurrentUser }: Props) {
   return (
      <span
         className={`flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full ${
            isCurrentUser ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-600'
         }`}
      >
         {profileImgUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- 동적 S3 URL이라 next/image 설정 없이 바로 사용
            <img src={profileImgUrl} alt="" className="h-full w-full object-cover" />
         ) : (
            <User size={18} aria-label={name} />
         )}
      </span>
   );
}
