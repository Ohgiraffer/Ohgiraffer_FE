const AVATAR_COLORS = ['bg-brand-maroon', 'bg-brand-green', 'bg-brand-gold', 'bg-brand-red', 'bg-brand-sage'];

function colorForName(name: string) {
   const code = name.charCodeAt(0) || 0;
   return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

interface ChatAvatarProps {
   name: string;
   isOnline?: boolean;
}

export default function ChatAvatar({ name, isOnline }: ChatAvatarProps) {
   return (
      <span className="relative inline-flex shrink-0">
         <span
            className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-white ${colorForName(name)}`}
         >
            {name.slice(0, 1)}
         </span>
         {isOnline && (
            <span className="absolute right-0 bottom-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-brand-sage" />
         )}
      </span>
   );
}
