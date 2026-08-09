import { cn } from '@/lib/utils';

type Tone = 'success' | 'danger' | 'neutral' | 'muted' | 'gold';

// 연한 배경 + 진한 글자 방식 (연동 상태 뱃지, 토스트 색상 등 앱 곳곳의 라이트 톤 배지와 동일한 계열)
const TONE_CLASSES: Record<Tone, string> = {
   success: 'bg-green-50 text-brand-green',
   danger: 'bg-[#F5DFDC] text-[#C0392B]',
   neutral: 'bg-[#E8F0EC] text-[#2E4A3D]',
   muted: 'bg-gray-100 text-gray-400',
   gold: 'bg-brand-cream text-[#8A6D1F]',
};

interface StatusBadgeProps {
   tone: Tone;
   children: React.ReactNode;
   className?: string;
}

export default function StatusBadge({ tone, children, className }: StatusBadgeProps) {
   return (
      <span
         className={cn(
            'inline-flex items-center justify-center rounded-xs px-2.5 py-1 text-xs font-semibold whitespace-nowrap',
            TONE_CLASSES[tone],
            className,
         )}
      >
         {children}
      </span>
   );
}
