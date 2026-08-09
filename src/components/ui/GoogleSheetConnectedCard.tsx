'use client';

import { ExternalLink } from 'lucide-react';

interface GoogleSheetConnectedCardProps {
   urlLabel: string;
   spreadsheetUrl: string;
   onEdit: () => void;
   extra?: React.ReactNode;
}

// GoogleSheetSync / SurveyFormSheetLink가 공통으로 쓰는 "연결됨" 상태 카드
export default function GoogleSheetConnectedCard({
   urlLabel,
   spreadsheetUrl,
   onEdit,
   extra,
}: GoogleSheetConnectedCardProps) {
   return (
      <div className="rounded-xs border border-gray-200 p-5">
         <h3 className="text-sm font-bold text-gray-900">Google Sheet 연동</h3>
         <div className="mt-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
               <p className="text-xs text-gray-500">{urlLabel}</p>
               <a
                  href={spreadsheetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center gap-1 text-sm text-brand-green hover:underline"
               >
                  <ExternalLink size={14} className="shrink-0" />
                  <span className="truncate">{spreadsheetUrl}</span>
               </a>
            </div>
            <div className="flex shrink-0 items-center gap-2">
               {extra}
               <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-brand-green">
                  <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
                  연결됨
               </span>
               <button
                  type="button"
                  onClick={onEdit}
                  className="cursor-pointer rounded-xs border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
               >
                  수정
               </button>
            </div>
         </div>
      </div>
   );
}
