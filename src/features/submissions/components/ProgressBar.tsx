import { cn } from '@/lib/utils';

interface ProgressBarProps {
   value: number;
   max: number;
   className?: string;
}

export default function ProgressBar({ value, max, className }: ProgressBarProps) {
   const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

   return (
      <div className={cn('h-1.5 w-35 shrink-0 overflow-hidden rounded-full bg-gray-200', className)}>
         <div className="h-full rounded-full bg-brand-sage" style={{ width: `${pct}%` }} />
      </div>
   );
}
