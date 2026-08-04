import Link from 'next/link';
import { buttonVariants } from '@/components/ui/button';
import ErrorState from '@/components/ui/ErrorState';

// next/navigation의 forbidden()을 호출하는 서버 컴포넌트/액션이 있어야 이 화면이 뜸
export default function Forbidden() {
   return (
      <ErrorState
         code="403"
         title="접근 권한이 없어요"
         description="이 페이지는 현재 권한으로 접근 불가합니다."
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
