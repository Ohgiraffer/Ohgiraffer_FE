'use client';

import Image from 'next/image';
import { Eye, EyeOff, TriangleAlert } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/shadcn/button';
import { RoleMismatchError, useAuth } from '@/components/auth/AuthContext';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';

export default function LoginPageClient() {
   const router = useRouter();
   const { login, isAuthenticated, isInitializing, needResetPw } = useAuth();
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [isPasswordVisible, setIsPasswordVisible] = useState(false);
   const [emailError, setEmailError] = useState('');
   const [passwordError, setPasswordError] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);
   // 최초 진입 시 "이미 로그인된 상태인지"를 한 번만 확인하기 위한 가드
   const hasCheckedInitialAuthRef = useRef(false);

   // 이미 로그인된 상태로 로그인 페이지에 들어오면 대시보드로 보냄 - 단, 비밀번호를 아직
   // 재설정하지 않은 계정이면(예: 재설정 화면에서 뒤로가기) 대시보드 대신 재설정 화면으로 보낸다
   useEffect(() => {
      if (isInitializing || hasCheckedInitialAuthRef.current) return;
      hasCheckedInitialAuthRef.current = true;
      if (isAuthenticated) {
         router.replace(needResetPw ? '/reset-password' : '/');
      }
   }, [isInitializing, isAuthenticated, needResetPw, router]);

   const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();

      const nextEmailError = email.trim() ? '' : '이메일을 입력해주세요';
      const nextPasswordError = password ? '' : '비밀번호를 입력해주세요';
      setEmailError(nextEmailError);
      setPasswordError(nextPasswordError);

      if (nextEmailError || nextPasswordError) return;

      setIsSubmitting(true);
      try {
         const result = await login(email, password);
         toast.success(`${result.name}님 환영합니다`);

         if (result.needResetPw) {
            router.push('/reset-password');
         } else if (result.bootcampId === null) {
            router.push('/onboarding-wizard');
         } else {
            router.push('/');
         }
      } catch (err) {
         if (err instanceof RoleMismatchError) {
            toast.error('인증 정보가 일치하지 않습니다. 다시 로그인해주세요.');
         } else if (err instanceof ApiError) {
            if (err.status === 400) {
               setEmailError(err.errors.email ?? '');
               setPasswordError(err.errors.password ?? '');
            } else {
               // 401(비밀번호 불일치/존재하지 않는 계정)
               // 403(자퇴·제적 등)
               toast.error(err.message);
            }
         } else {
            toast.error('로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
         }
      } finally {
         setIsSubmitting(false);
      }
   };

   return (
      <>
         <div className="w-full max-w-md rounded-sm bg-white p-10 shadow-sm">
            <div className="mb-8 flex justify-center mr-7">
               <Image src="/logo/AuthLogo.png" alt="CampFlow" width={220} height={76} priority />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
               <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-semibold text-gray-900">
                     이메일
                  </label>
                  <input
                     id="email"
                     type="email"
                     value={email}
                     onChange={(e) => {
                        setEmail(e.target.value);
                        if (emailError) setEmailError('');
                     }}
                     placeholder="이메일 주소를 입력해주세요"
                     className="h-12 w-full rounded-sm border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-400"
                  />
                  {emailError && (
                     <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                        <TriangleAlert size={13} />
                        {emailError}
                     </p>
                  )}
               </div>

               <div>
                  <label
                     htmlFor="password"
                     className="mb-2 block text-sm font-semibold text-gray-900"
                  >
                     비밀번호
                  </label>
                  <div className="relative">
                     <input
                        id="password"
                        type={isPasswordVisible ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => {
                           setPassword(e.target.value);
                           if (passwordError) setPasswordError('');
                        }}
                        placeholder="비밀번호를 입력해주세요"
                        className="h-12 w-full rounded-sm border border-gray-200 bg-white px-4 pr-11 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-400"
                     />
                     <button
                        type="button"
                        onClick={() => setIsPasswordVisible((prev) => !prev)}
                        aria-label={isPasswordVisible ? '비밀번호 숨기기' : '비밀번호 보기'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                     >
                        {isPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                     </button>
                  </div>
                  {passwordError && (
                     <p className="mt-1.5 flex items-center gap-1 text-xs text-red-600">
                        <TriangleAlert size={13} />
                        {passwordError}
                     </p>
                  )}
               </div>

               <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-2 h-12 w-full bg-brand-green text-base hover:bg-[#4D655A] disabled:opacity-70"
               >
                  {isSubmitting ? '로그인 중...' : '로그인'}
               </Button>
            </form>
         </div>

         <p className="mt-6 text-sm text-gray-400">
            © 2026 캠플로우 CampFlow. All rights reserved.
         </p>
      </>
   );
}
