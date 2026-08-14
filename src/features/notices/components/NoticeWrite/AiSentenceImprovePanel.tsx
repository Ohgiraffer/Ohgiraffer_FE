'use client';

import { Copy, Sparkles, X } from 'lucide-react';
import type { SentenceSuggestion } from '../../splitSentences';

type Props = {
   suggestions: SentenceSuggestion[];
   improvedFullText: string;
   onCopySuggestion: (text: string) => void;
   onApplyAll: (improvedFullText: string) => void;
   onClose: () => void;
};

// [AI 문장 개선] 결과 - 문장별 원문/제안을 나란히 보여준다. 자동으로 반영되지 않고, 문장별 [복사] 또는
// [전체 적용]을 사용자가 직접 눌러야 실제 본문에 반영된다(개선 결과를 검토 없이 그대로 덮어쓰지 않기 위함)
export default function AiSentenceImprovePanel({
   suggestions,
   improvedFullText,
   onCopySuggestion,
   onApplyAll,
   onClose,
}: Props) {
   return (
      <div className="rounded-sm border border-[#E5E7EB] bg-white px-6 py-5">
         <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
               <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                  <Sparkles size={16} className="text-brand-gold" />
                  AI 문장 개선 제안
               </span>
               <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                  이 기기에서 처리됩니다
               </span>
            </div>
            <button
               type="button"
               onClick={onClose}
               aria-label="AI 문장 개선 제안 닫기"
               className="cursor-pointer rounded-sm p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-700"
            >
               <X size={16} />
            </button>
         </div>

         <div className="mt-3 grid grid-cols-2 gap-4">
            <span className="text-xs font-semibold text-gray-500">원문</span>
            <span className="text-xs font-semibold text-gray-500">AI 제안</span>
         </div>

         <div className="mt-1.5 flex flex-col gap-2">
            {suggestions.map((suggestion, index) => (
               <div key={index} className="grid grid-cols-2 gap-4">
                  <div className="rounded-xs border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2.5 text-sm text-gray-700">
                     {suggestion.original}
                  </div>
                  <div className="flex items-center justify-between gap-2 rounded-xs border border-[#E5E7EB] bg-[#F9FAFB] px-3 py-2.5 text-sm text-gray-700">
                     <span className="min-w-0 flex-1">{suggestion.improved}</span>
                     <button
                        type="button"
                        onClick={() => onCopySuggestion(suggestion.improved)}
                        className="flex shrink-0 cursor-pointer items-center gap-1 rounded-xs px-1.5 py-1 text-xs text-gray-500 hover:bg-gray-100"
                     >
                        <Copy size={12} />
                        복사
                     </button>
                  </div>
               </div>
            ))}
         </div>

         <div className="mt-3 flex items-center justify-between gap-4">
            <p className="text-xs text-gray-400">
               제안 문장을 복사해 직접 수정하거나, 전체 적용할 수 있습니다. 자동으로 적용되지 않습니다.
            </p>
            <button
               type="button"
               onClick={() => onApplyAll(improvedFullText)}
               className="shrink-0 cursor-pointer rounded-xs bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-[#4D655A]"
            >
               전체 적용
            </button>
         </div>
      </div>
   );
}
