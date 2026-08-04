import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import ErrorState from '@/components/ui/ErrorState';

export default function NotFound() {
   return (
      <ErrorState
         code="404"
         title="페이지를 찾을 수 없어요"
         description="요청하신 페이지가 삭제되었거나 주소가 잘못되었을 수 있어요"
         actions={
            <Link
               href="/"
               className={buttonVariants({ className: 'bg-brand-green hover:bg-[#4D655A]' })}
            >
               메인 페이지로 이동
            </Link>
         }
      />
   );
}
