'use client';

import { useId } from 'react';
import { Copy } from 'lucide-react';
import { toast } from '@/lib/toast';
import { GOOGLE_SERVICE_ACCOUNT_EMAIL } from '@/lib/googleServiceAccount';

// GoogleSheetSync / SurveyFormSheetLink가 공통으로 쓰는 "서비스 계정 이메일 공유 안내" 블록
export default function GoogleSheetEmailNotice() {
   const emailInputId = useId();

   const handleCopyEmail = () => {
      navigator.clipboard.writeText(GOOGLE_SERVICE_ACCOUNT_EMAIL);
      toast.success('이메일을 복사했습니다.');
   };

   return (
      <>
         <label htmlFor={emailInputId} className="block text-xs text-gray-700">
            아래 이메일을 시트의 공유 대상(뷰어 이상)으로 추가해주세요.
         </label>
         <div className="mt-2 flex gap-2">
            <input
               id={emailInputId}
               readOnly
               value={GOOGLE_SERVICE_ACCOUNT_EMAIL}
               className="h-8 flex-1 rounded-xs border border-gray-200 bg-white px-3 text-sm text-brand-green"
            />
            <button
               type="button"
               onClick={handleCopyEmail}
               className="flex shrink-0 cursor-pointer items-center gap-1 rounded-xs border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
               <Copy size={14} />
               복사
            </button>
         </div>
      </>
   );
}
