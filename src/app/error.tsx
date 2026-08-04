'use client';

import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import ErrorState from '@/components/ui/ErrorState';

export default function Error({
   reset,
}: {
   error: Error & { digest?: string };
   reset: () => void;
}) {
   return (
      <ErrorState
         code="ERROR"
         title="일시적인 오류가 발생했어요"
         description={
            <>
               잠시 후 다시 시도해주세요.
               <br />
               문제가 계속되면 관리자에게 문의해주세요.
            </>
         }
         actions={
            <>
               <Button type="button" variant="outline" onClick={reset}>
                  새로 고침
               </Button>
               <Link
                  href="/"
                  className={buttonVariants({ className: 'bg-brand-green hover:bg-[#4D655A]' })}
               >
                  메인 페이지로 이동
               </Link>
            </>
         }
      />
   );
}
