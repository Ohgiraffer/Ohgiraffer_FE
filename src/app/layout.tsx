import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Geist, Geist_Mono } from 'next/font/google';
import { X } from 'lucide-react';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/components/auth/AuthContext';
import QueryProvider from '@/lib/query/QueryProvider';
import AIAssistantWidgetLoader from '@/features/ai-assistant/AIAssistantWidgetLoader';
import './globals.css';

const geistSans = Geist({
   variable: '--font-geist-sans',
   subsets: ['latin'],
});

const geistMono = Geist_Mono({
   variable: '--font-geist-mono',
   subsets: ['latin'],
});

export const metadata: Metadata = {
   metadataBase: new URL('https://www.campflow.co.kr/'),

   title: 'CampFlow - 흩어진 부트캠프 운영을 하나의 흐름으로',
   description:
      '부트캠프 훈련생·강사·운영 매니저를 대상으로, 분산된 교육 운영 업무와 반복 관리의 비효율을 해결하고 업무 처리 과정을 실시간 Flow로 확인할 수 있는 AI·자동화 기반 그룹웨어 서비스입니다.',
   authors: [{ name: 'Team Ohgiraffer', url: 'https://github.com/Ohgiraffer' }],
   creator: 'Team Ohgiraffer',
   publisher: 'Team Ohgiraffer',

   openGraph: {
      type: 'website',
      locale: 'ko_KR',
      url: '/',
      siteName: 'CampFlow',
      title: 'CampFlow - 흩어진 부트캠프 운영을 하나의 흐름으로',
      description:
         '부트캠프 훈련생·강사·운영 매니저를 대상으로, 분산된 교육 운영 업무와 반복 관리의 비효율을 해결하고 업무 처리 과정을 실시간 Flow로 확인할 수 있는 AI·자동화 기반 그룹웨어 서비스입니다.',
      images: [
         {
            url: '/OGtag_thumbnail.png',
            width: 1900,
            height: 1000,
            alt: '캠플로우 로고',
         },
      ],
   },
   twitter: {
      card: 'summary_large_image',
      title: 'CampFlow - 흩어진 부트캠프 운영을 하나의 흐름으로',
      description:
         '부트캠프 훈련생·강사·운영 매니저를 대상으로, 분산된 교육 운영 업무와 반복 관리의 비효율을 해결하고 업무 처리 과정을 실시간 Flow로 확인할 수 있는 AI·자동화 기반 그룹웨어 서비스입니다.',
      images: '/OGtag_thumbnail.png',
      creator: '@Team_Ohgiraffer',
   },
};

export default function RootLayout({
   children,
}: Readonly<{
   children: React.ReactNode;
}>) {
   return (
      <html lang="ko" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
         <body className="min-h-full flex flex-col">
            <QueryProvider>
               <AuthProvider>
                  {children}
                  {/* ssr:false 클라이언트 전용 위젯을 Suspense 없이 그대로 두면, 동적 렌더링되는
                  라우트((user)/*)에서 이 하나 때문에 페이지 전체가 요청마다 서버 렌더링을 포기하고
                  통째로 클라이언트 렌더링으로 폴백한다(next/dynamic bail out) - Suspense로 감싸서
                  이 위젯만 폴백 처리되게 격리한다 */}
                  <Suspense fallback={null}>
                     <AIAssistantWidgetLoader />
                  </Suspense>
               </AuthProvider>
            </QueryProvider>
            <Toaster
               position="top-center"
               closeButton
               gap={8}
               duration={5000}
               icons={{ close: <X size={13} strokeWidth={2.5} /> }}
               toastOptions={{
                  classNames: {
                     toast: '!items-start !py-2.5 !px-3 !pl-5 !shadow-none !rounded-sm',
                     title: '!leading-snug !break-words !break-keep !whitespace-pre-line',
                     icon: '!hidden', // 앞에 붙던 success/error/warning 타입 아이콘을 숨김
                     success: '!bg-brand-sage !text-white !border-brand-green',
                     error: '!bg-[#F5DFDC] !text-brand-maroon !border-brand-maroon',
                     warning: '!bg-brand-cream !text-black !border-brand-gold',
                     closeButton:
                        '!static !order-last !ml-auto !transform-none !bg-transparent !border-0 !text-inherit',
                  },
               }}
            />
         </body>
      </html>
   );
}
