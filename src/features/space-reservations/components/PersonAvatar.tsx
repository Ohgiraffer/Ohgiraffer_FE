type Props = {
   name: string;
   isCurrentUser?: boolean;
};

// 성 이니셜을 원형으로 보여주는 아바타 - 추후 API 연동 시 사용자 프로필 이미지로 대체될 예정
export default function PersonAvatar({ name, isCurrentUser }: Props) {
   return (
      <span
         className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
            isCurrentUser ? 'bg-brand-green text-white' : 'bg-gray-100 text-gray-600'
         }`}
      >
         {name.charAt(0)}
      </span>
   );
}
