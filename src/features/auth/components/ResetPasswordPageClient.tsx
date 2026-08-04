'use client';

import { Check, Eye, EyeOff, TriangleAlert } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function ResetPasswordPageClient() {
   const [password, setPassword] = useState('');
   const [passwordConfirm, setPasswordConfirm] = useState('');
   const [isPasswordVisible, setIsPasswordVisible] = useState(false);
   const [isPasswordConfirmVisible, setIsPasswordConfirmVisible] = useState(false);

   const isLengthValid = password.length >= 8 && password.length <= 16;
   const hasLetter = /[a-zA-Z]/.test(password);
   const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_\-+=~`[\]\\/;']/.test(password);
   const isMatching = password.length > 0 && password === passwordConfirm;

   const checklist = [
      { label: '8~16자 이내', valid: isLengthValid },
      { label: '영문 포함', valid: hasLetter },
      { label: '특수기호 포함', valid: hasSpecialChar },
      { label: '비밀번호 일치', valid: isMatching },
   ];

   const isAllValid = checklist.every((item) => item.valid);

   const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!isAllValid) return;
      // TODO: 백엔드 API 연동 시 비밀번호 재설정 요청 처리
   };

   return (
      <div className="w-full max-w-md rounded-sm bg-white p-10 shadow-sm">
         <div className="text-center">
            <h1 className="text-xl font-bold text-gray-900">비밀번호 재설정</h1>
            <p className="mt-1 text-sm text-gray-500">
               영문+특수기호 포함 8~16자로 입력해주세요.
            </p>
         </div>

         <form onSubmit={handleSubmit} className="mt-10 flex flex-col gap-5">
            <div>
               <label htmlFor="password" className="mb-2 block text-sm font-semibold text-gray-900">
                  새 비밀번호
               </label>
               <div className="relative">
                  <input
                     id="password"
                     type={isPasswordVisible ? 'text' : 'password'}
                     value={password}
                     onChange={(e) => setPassword(e.target.value)}
                     placeholder="새 비밀번호를 입력해주세요"
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
            </div>

            <div>
               <label
                  htmlFor="passwordConfirm"
                  className="mb-2 block text-sm font-semibold text-gray-900"
               >
                  비밀번호 확인
               </label>
               <div className="relative">
                  <input
                     id="passwordConfirm"
                     type={isPasswordConfirmVisible ? 'text' : 'password'}
                     value={passwordConfirm}
                     onChange={(e) => setPasswordConfirm(e.target.value)}
                     placeholder="비밀번호를 다시 한번 입력해주세요"
                     className="h-12 w-full rounded-sm border border-gray-200 bg-white px-4 pr-11 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:border-gray-400"
                  />
                  <button
                     type="button"
                     onClick={() => setIsPasswordConfirmVisible((prev) => !prev)}
                     aria-label={isPasswordConfirmVisible ? '비밀번호 숨기기' : '비밀번호 보기'}
                     className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors hover:text-gray-600"
                  >
                     {isPasswordConfirmVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
               </div>
            </div>

            <ul className="flex flex-col gap-2 rounded-md bg-gray-50 p-4">
               {checklist.map((item) => (
                  <li key={item.label} className="flex items-center gap-2">
                     <span
                        className={`flex h-4 w-4 items-center justify-center rounded-full transition-colors ${
                           item.valid ? 'bg-brand-sage' : 'bg-gray-300'
                        }`}
                     >
                        <Check size={10} className="text-white" />
                     </span>
                     <span
                        className={`text-sm transition-colors ${
                           item.valid ? 'text-brand-green' : 'text-gray-400'
                        }`}
                     >
                        {item.label}
                     </span>
                  </li>
               ))}
            </ul>
            <p className="flex items-center justify-center gap-1 text-xs text-brand-red">
               <TriangleAlert size={13} />
               최초 비밀번호 재설정 이후에는 다시 변경할 수 없습니다.
            </p>

            <Button
               type="submit"
               disabled={!isAllValid}
               className={`h-12 w-full text-base ${
                  isAllValid
                     ? 'bg-brand-green text-white hover:bg-[#4D655A]'
                     : 'bg-gray-200 text-gray-400'
               }`}
            >
               비밀번호 변경하기
            </Button>
         </form>
      </div>
   );
}
