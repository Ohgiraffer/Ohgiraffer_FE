import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { X } from 'lucide-react';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/components/auth/AuthContext';
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
   title: 'CampFlow',
   description: '캠프로우 부트캠프 관리 서비스',
};

export default function RootLayout({
   children,
}: Readonly<{
   children: React.ReactNode;
}>) {
   return (
      <html lang="ko" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
         <body className="min-h-full flex flex-col">
            <AuthProvider>{children}</AuthProvider>
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
