'use client';

import GoogleSheetSync, {
   type GoogleSheetSaveResult,
} from '@/components/ui/googlesheet/GoogleSheetSync';
import { EVALUATION_SHEET_COLUMNS } from '../hooks/useEvaluationSheetSync';

type Props = {
   onSaveMapping: (result: GoogleSheetSaveResult) => Promise<void>;
};

// "연동 설정" 탭 - 평가 시트 컬럼 매핑(훈련생 식별자/평가 유형/평가 항목/점수/의견).
// 저장 성공 여부는 상위(EvaluationsPageClient)의 isConnected로 관리되어 탭을 옮겨도
// "동기화 실행" 탭 잠금 해제 상태가 유지된다
export default function SheetSyncTab({ onSaveMapping }: Props) {
   return <GoogleSheetSync columns={EVALUATION_SHEET_COLUMNS} onSave={onSaveMapping} />;
}
