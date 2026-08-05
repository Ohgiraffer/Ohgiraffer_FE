// auth 레이아웃
export default function AuthLayout({ children }: { children: React.ReactNode }) {
   return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F8FA] px-4">
         {children}
      </div>
   );
}
