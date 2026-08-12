'use client';

import { useState } from 'react';
import type { GoogleSheetColumnField } from '@/components/ui/googlesheet/GoogleSheetSync';

// 출결 시트 연동에 필요한 컬럼은 훈련생 식별자/출결 상태/일자 3개뿐
export const ATTENDANCE_SHEET_COLUMNS: GoogleSheetColumnField[] = [
   { key: 'traineeIdentifier', label: '훈련생 식별자' },
   { key: 'attendanceStatus', label: '출결 상태' },
   { key: 'date', label: '일자' },
];

// 출결 시트 연동 설정 상태 - 탭을 옮겨도 연결 여부가 유지되도록 ManagerTrackerBoard에서 한 번만 호출한다
// TODO: 실제 연동 저장 API가 나오면 tracker.service.ts 호출로 교체(지금은 mock 흐름만 구현)
export function useTrackerSheetSync() {
   const [isConnected, setIsConnected] = useState(false);

   const handleSaveMapping = async () => {
      setIsConnected(true);
   };

   return { isConnected, handleSaveMapping };
}
