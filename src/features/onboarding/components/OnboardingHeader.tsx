import Image from 'next/image';

export default function OnboardingHeader() {
   return (
      <header className="sticky top-0 z-50 flex h-14 items-center gap-3 bg-brand-green px-4 text-white">
         <div className="flex items-center gap-2">
            <Image src="/logo/Main-Logo.png" alt="CampFlow" width={100} height={60} priority />
         </div>

         <span className="h-4 w-px bg-white/30" />

         <span className="text-[14px] font-medium text-white">부트캠프 초기 설정</span>
      </header>
   );
}
