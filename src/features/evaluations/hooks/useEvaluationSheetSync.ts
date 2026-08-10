'use client';

import { useState } from 'react';
import type { GoogleSheetColumnField } from '@/components/ui/googlesheet/GoogleSheetSync';

// GoogleSheetSync에 넘기는 컬럼 목록 - "의견"만 선택 항목(required: false)
export const EVALUATION_SHEET_COLUMNS: GoogleSheetColumnField[] = [
   { key: 'traineeIdentifier', label: '훈련생 식별자' },
   { key: 'evaluationType', label: '평가 유형' },
   { key: 'evaluationItem', label: '평가 항목' },
   { key: 'score', label: '점수' },
   { key: 'comment', label: '의견', required: false },
];

// 평가 시트 연동 설정 상태 - 탭을 옮겨도 연결 여부가 유지되도록 EvaluationsPageClient에서 한 번만
// 호출한다("동기화 실행" 탭이 이 값으로 잠금 여부를 판단함).
// TODO: 실제 연동 저장 API가 나오면 evaluation.service.ts 호출로 교체(지금은 mock 흐름만 구현)
export function useEvaluationSheetSync() {
   const [isConnected, setIsConnected] = useState(false);

   // 매핑 결과 자체는 아직 쓸 곳이 없어 받지 않는다(더 좁은 인자 수의 함수도 onSave 타입에 할당 가능)
   const handleSaveMapping = async () => {
      setIsConnected(true);
   };

   return { isConnected, handleSaveMapping };
}
