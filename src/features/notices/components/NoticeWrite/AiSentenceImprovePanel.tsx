'use client';

import { Copy, WandSparkles, X } from 'lucide-react';
import type { SentenceSuggestion } from '../../splitSentences';

type Props = {
   suggestions: SentenceSuggestion[];
   improvedFullText: string;
   onCopySuggestion: (text: string) => void;
   onApplyAll: (improvedFullText: string) => void;
   onClose: () => void;
};

// [AI 문장 개선] 결과
export default function AiSentenceImprovePanel({
   suggestions,
   improvedFullText,
   onCopySuggestion,
   onApplyAll,
   onClose,
}: Props) {
   return (
      <div className="rounded-b-sm border border-t-none border-[#E5E7EB] bg-white">
         <div className="flex items-center justify-between rounded-t-sm border-b border-[#E5E7EB] bg-[#F9FAFB] px-6 py-3">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
               <WandSparkles size={16} className="text-brand-sage" />
               AI 문장 개선 제안
            </span>
            <button
               type="button"
               onClick={onClose}
               aria-label="AI 문장 개선 제안 닫기"
               className="cursor-pointer rounded-sm p-1 text-gray-400 hover:text-gray-700"
            >
               <X size={16} />
            </button>
         </div>

         <div className="px-6 py-5">
            <div className="grid grid-cols-2 gap-4">
               <span className="text-xs font-semibold text-[#9CA3AF]">원문</span>
               <span className="text-xs font-semibold text-brand-green">AI 제안</span>
            </div>

            <div className="mt-2 flex flex-col gap-2">
               {suggestions.map((suggestion, index) => (
                  <div key={index} className="grid grid-cols-2 gap-4">
                     <div className="rounded-xs border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2.5 text-sm text-[#6B7280]">
                        {suggestion.original}
                     </div>
                     <div className="flex items-center justify-between gap-2 rounded-xs border border-[#D6DFD4] bg-[#F4F7F4] px-3 py-2.5 text-sm text-[#374151]">
                        <span className="min-w-0 flex-1">{suggestion.improved}</span>
                        <button
                           type="button"
                           onClick={() => onCopySuggestion(suggestion.improved)}
                           className="flex shrink-0 cursor-pointer items-center gap-1 rounded-xs px-1.5 py-1 text-xs text-[#9CA3AF] hover:text-gray-700"
                        >
                           <Copy size={12} />
                           복사
                        </button>
                     </div>
                  </div>
               ))}
            </div>
            <hr className="mt-3 border-[#E5E7EB]" />
            <div className="mt-3 flex items-center justify-between gap-4">
               <p className="text-xs text-[#9CA3AF]">
                  제안 문장을 복사해 직접 수정하거나, 전체 적용할 수 있습니다. 자동으로 적용되지
                  않습니다.
               </p>
               <button
                  type="button"
                  onClick={() => onApplyAll(improvedFullText)}
                  className="shrink-0 cursor-pointer rounded-xs bg-brand-green px-2.5 py-1.5 text-[13px] text-white hover:bg-[#4D655A]"
               >
                  전체 적용
               </button>
            </div>
         </div>
      </div>
   );
}
