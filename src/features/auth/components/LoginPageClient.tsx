'use client';

import Image from 'next/image';
import { Eye, EyeOff, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function LoginPageClient() {
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [isPasswordVisible, setIsPasswordVisible] = useState(false);
   const [emailError, setEmailError] = useState('');
   const [passwordError, setPasswordError] = useState('');

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      const nextEmailError = email.trim() ? '' : '이메일을 입력해주세요';
      const nextPasswordError = password ? '' : '비밀번호를 입력해주세요';
      setEmailError(nextEmailError);
      setPasswordError(nextPasswordError);

      if (nextEmailError || nextPasswordError) return;

      // TODO: 백엔드 API 연동 시 로그인 요청 처리
   };

   return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#F7F8FA] px-4">
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
                  className="mt-2 h-12 w-full bg-brand-green text-base hover:bg-[#4D655A]"
               >
                  로그인
               </Button>
            </form>
         </div>

         <p className="mt-6 text-sm text-gray-400">
            © 2026 캠플로우 CampFlow. All rights reserved.
         </p>
      </div>
   );
}
