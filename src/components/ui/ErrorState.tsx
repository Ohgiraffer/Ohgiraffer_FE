import type { ReactNode } from 'react';

interface ErrorStateProps {
   code: string;
   title: string;
   description: ReactNode;
   actions: ReactNode;
}

// 404 / 403 / 에러 페이지가 공유하는 공용 레이아웃
export default function ErrorState({ code, title, description, actions }: ErrorStateProps) {
   return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F8FA] px-4">
         <p className="text-5xl font-bold text-brand-sage">{code}</p>
         <h1 className="mt-4 text-xl font-bold text-gray-900">{title}</h1>
         <p className="mt-2 text-center text-sm text-gray-400">{description}</p>
         <div className="mt-8 flex items-center gap-2">{actions}</div>
      </div>
   );
}
