'use client';

import GoogleSheetSync, {
   type GoogleSheetSaveResult,
} from '@/components/ui/googlesheet/GoogleSheetSync';
import { EVALUATION_SHEET_COLUMNS } from '../hooks/useEvaluationSheetSync';

type Props = {
   isConnected: boolean;
   spreadsheetUrl: string;
   isLoading: boolean;
   loadError: boolean;
   onSaveMapping: (result: GoogleSheetSaveResult) => Promise<void>;
};

// "연동 설정" 탭 - 평가 시트 컬럼 매핑(훈련생 식별자/평가 유형/평가 항목/점수/의견).
// 저장 성공 여부는 상위(EvaluationsPageClient)의 isConnected로 관리되어 탭을 옮겨도
// "동기화 실행" 탭 잠금 해제 상태가 유지된다
export default function SheetSyncTab({
   isConnected,
   spreadsheetUrl,
   isLoading,
   loadError,
   onSaveMapping,
}: Props) {
   if (isLoading) {
      return <p className="py-16 text-center text-sm text-gray-400">불러오는 중...</p>;
   }

   if (loadError) {
      return (
         <div className="flex flex-col items-center gap-3 py-16">
            <p className="text-sm text-gray-400">연동 설정을 불러오지 못했습니다.</p>
            <button
               type="button"
               onClick={() => window.location.reload()}
               className="cursor-pointer rounded-xs border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
               다시 시도
            </button>
         </div>
      );
   }

   return (
      <GoogleSheetSync
         columns={EVALUATION_SHEET_COLUMNS}
         onSave={onSaveMapping}
         initialConnection={isConnected ? { spreadsheetUrl } : undefined}
      />
   );
}
