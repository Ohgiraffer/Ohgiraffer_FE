'use client';

import { toast } from 'sonner';

export default function DevTestToastPage() {
   return (
      <div className="flex flex-col gap-3 p-10">
         <button
            type="button"
            onClick={() => {
               toast.success('ssss님 환영합니다', { duration: 60000 });
               toast.error('ssss님 환영합니다', { duration: 60000 });
               toast.warning('ssss님 환영합니다', { duration: 60000 });
            }}
            className="w-40 rounded-md bg-brand-green px-4 py-2 text-white"
         >
            토스트 3개 띄우기
         </button>
      </div>
   );
}
