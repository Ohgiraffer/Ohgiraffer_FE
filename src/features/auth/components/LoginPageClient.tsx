'use client';

import Image from 'next/image';
import { ClipboardList, Eye, EyeOff, RefreshCw, TriangleAlert, Users, Zap } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/shadcn/button';
import { RoleMismatchError, useAuth } from '@/components/auth/AuthContext';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';

// 좌측 브랜드 패널의 소개 카드 4종
const LOGIN_FEATURES = [
   {
      icon: Zap,
      title: 'AI·자동화 운영',
      description: '반복 행정을 자동화해 운영 부담을 대폭 줄입니다.',
   },
   {
      icon: RefreshCw,
      title: '실시간 Flow 대시보드',
      description: '출결·과제·상담 현황을 한 화면에서 파악합니다.',
   },
   {
      icon: Users,
      title: '역할별 통합 관리',
      description: '훈련생·강사·매니저가 하나의 플랫폼에서 협력합니다.',
   },
   {
      icon: ClipboardList,
      title: '결재·일정 일원화',
      description: '문서 결재, 상담 예약, 공지까지 한 곳에서 처리합니다.',
   },
];

export default function LoginPageClient() {
   const router = useRouter();
   const { login, isAuthenticated, isInitializing, bootcampId, needResetPw } = useAuth();
   const [email, setEmail] = useState('');
   const [password, setPassword] = useState('');
   const [isPasswordVisible, setIsPasswordVisible] = useState(false);
   const [emailError, setEmailError] = useState('');
   const [passwordError, setPasswordError] = useState('');
   const [isSubmitting, setIsSubmitting] = useState(false);
   // 최초 진입 시 "이미 로그인된 상태인지"를 한 번만 확인하기 위한 가드
   const hasCheckedInitialAuthRef = useRef(false);

   useEffect(() => {
      if (isInitializing || hasCheckedInitialAuthRef.current) return;
      hasCheckedInitialAuthRef.current = true;
      if (isAuthenticated) {
         router.replace(
            needResetPw ? '/reset-password' : bootcampId === null ? '/onboarding-wizard' : '/',
         );
      }
   }, [isInitializing, isAuthenticated, needResetPw, bootcampId, router]);

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
      // AuthLayout(부모)이 이 페이지를 가운데 정렬된 좁은 카드로 감싸고 있어서, 화면 전체를
      // 좌우로 나누는 레이아웃은 fixed로 뷰포트에 직접 고정해 부모의 정렬/여백 영향을 받지 않게 한다
      <div className="fixed inset-0 flex items-start overflow-y-auto bg-white">
         <div className="relative isolate hidden min-h-full w-4/7 flex-col justify-between overflow-hidden bg-[linear-gradient(145deg,#1E3528_0%,#2E4A3D_45%,#3D6350_100%)] px-22 py-14 text-white lg:flex">
            <svg
               className="pointer-events-none absolute inset-0 -z-10 h-full w-full opacity-[0.07]"
               viewBox="0 0 900 700"
               preserveAspectRatio="xMidYMid slice"
               aria-hidden="true"
            >
               <path
                  d="M-100 350 Q150 150 400 350 Q650 550 900 350"
                  fill="none"
                  stroke="white"
                  strokeWidth="80"
               />
               <path
                  d="M-100 420 Q200 220 450 420 Q700 620 950 420"
                  fill="none"
                  stroke="white"
                  strokeWidth="50"
               />
               <path
                  d="M-100 280 Q120 80 350 280 Q580 480 850 280"
                  fill="none"
                  stroke="white"
                  strokeWidth="30"
               />
            </svg>

            <div className="-ml-4">
               <Image src="/logo/Main-Logo.png" alt="CampFlow" width={170} height={63} priority />
            </div>
            <div className="max-w-md">
               <h1 className="text-[34px] leading-tight font-bold">
                  부트캠프 운영,
                  <br />
                  <span className="text-brand-sage">이제 하나의 흐름으로</span>
               </h1>
               <p className="mt-4 text-[15px] leading-relaxed text-white/70">
                  분산된 교육 운영 업무와 반복 관리의 비효율을 해결하고,
                  <br />
                  업무 처리 과정을 실시간 Flow로 확인하세요.
               </p>

               <div className="mt-10 grid grid-cols-2 gap-4">
                  {LOGIN_FEATURES.map(({ icon: Icon, title, description }) => (
                     <div key={title} className="rounded-sm border border-white/10 bg-white/5 p-4">
                        <Icon size={18} className="text-brand-sage" />
                        <p className="mt-2.5 text-sm font-bold break-keep text-white">{title}</p>
                        <p className="mt-1 text-xs leading-relaxed break-keep text-white/60">
                           {description}
                        </p>
                     </div>
                  ))}
               </div>
            </div>

            <div />
         </div>

         <div className="flex min-h-full w-full flex-col items-center justify-center bg-white px-25 lg:w-3/7">
            <div className="w-full max-w-md">
               {/* 좌측 브랜드 패널이 보이는 lg 이상에서는 인사말, 패널이 숨겨지는 작은 화면에서는 로고 */}
               <div className="lg:hidden flex items-center justify-center -ml-8 mb-12">
                  <Image src="/logo/AuthLogo.png" alt="CampFlow" width={240} height={69} priority />
               </div>
               <div className="hidden lg:block">
                  <h2 className="text-2xl font-bold text-gray-900">안녕하세요!</h2>
                  <p className="mt-1 text-sm text-gray-500">CampFlow에 로그인하세요</p>
               </div>

               <form onSubmit={handleSubmit} className="mt-8 flex flex-col gap-5">
                  <div>
                     <label
                        htmlFor="email"
                        className="mb-2 block text-sm font-semibold text-gray-900"
                     >
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
                     className="mt-2 h-12 w-full rounded-sm bg-brand-green text-base hover:bg-[#4D655A] disabled:opacity-70"
                  >
                     {isSubmitting ? '로그인 중...' : '로그인'}
                  </Button>
               </form>
            </div>

            <p className="mt-6 text-sm text-gray-400">
               © 2026 캠플로우 CampFlow. All rights reserved.
            </p>
         </div>
      </div>
   );
}
