import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Check, TriangleAlert, X } from 'lucide-react';
import { Toaster } from 'sonner';
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
            {children}
            <Toaster
               position="top-center"
               closeButton
               icons={{
                  success: (
                     <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white">
                        <Check size={12} strokeWidth={3.5} className="ml-0! text-brand-green" />
                     </span>
                  ),
                  error: (
                     <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white">
                        <X size={12} strokeWidth={3.5} className="ml-0! text-brand-maroon" />
                     </span>
                  ),
                  warning: (
                     <span className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-white">
                        <TriangleAlert size={12} strokeWidth={3.5} className="ml-0! text-brand-gold" />
                     </span>
                  ),
                  close: <X size={15} />,
               }}
               toastOptions={{
                  classNames: {
                     toast: '!py-2.5 !pr-5 !shadow-none !rounded-sm',
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
