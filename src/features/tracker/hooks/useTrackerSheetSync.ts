'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/http';
import type { GoogleSheetColumnField, GoogleSheetSaveResult } from '@/components/ui/googlesheet/GoogleSheetSync';
import {
   getAttendanceSheetLink,
   saveAttendanceSheetLink,
   type AttendanceSheetColumnMapping,
} from '@/services/attendance.service';

// 출결 시트에서 매핑해야 하는 컬럼 8개 - 키는 /attendance/sheet-link의 columnMapping 필드명과 동일
export const ATTENDANCE_SHEET_COLUMNS: GoogleSheetColumnField[] = [
   { key: 'name', label: '이름' },
   { key: 'trainingStatus', label: '훈련 상태' },
   { key: 'attendanceStatus', label: '출석 상태' },
   { key: 'checkIn', label: '입실 시간' },
   { key: 'checkOut', label: '퇴실 시간' },
   { key: 'outing', label: '외출 시간' },
   { key: 'return', label: '복귀 시간' },
   { key: 'trainingDate', label: '훈련 일자' },
];

// 출결 시트 연동 설정 - 탭을 옮겨도 연결 여부가 유지되도록 ManagerTrackerBoard에서 한 번만 호출한다
export function useTrackerSheetSync() {
   const [isConnected, setIsConnected] = useState(false);
   const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
   const [isLoading, setIsLoading] = useState(true);
   const [loadError, setLoadError] = useState(false);

   useEffect(() => {
      let isMounted = true;
      getAttendanceSheetLink()
         .then((link) => {
            if (!isMounted) return;
            setIsConnected(true);
            setSpreadsheetUrl(link.sheetUrl);
         })
         .catch((err) => {
            if (!isMounted) return;
            // 404(ATTENDANCE_005) = 아직 등록한 시트가 없는 정상 상태 - 에러가 아니라 연결 안 됨으로 처리
            if (err instanceof ApiError && err.status === 404) {
               setIsConnected(false);
            } else {
               setLoadError(true);
            }
         })
         .finally(() => {
            if (isMounted) setIsLoading(false);
         });
      return () => {
         isMounted = false;
      };
   }, []);

   const handleSaveMapping = useCallback(async (result: GoogleSheetSaveResult) => {
      const columnMapping = Object.fromEntries(
         Object.entries(result.columnMapping).map(([key, value]) => [key, value.columnName]),
      ) as unknown as AttendanceSheetColumnMapping;

      await saveAttendanceSheetLink({
         sheetUrl: result.spreadsheetUrl,
         tabName: result.sheetName,
         // 날짜는 항상 "시트 이름!I2" 셀에 있어야 함 - 사용자 입력이 아니라 고정 규칙으로 만든다
         dateCellRange: `${result.sheetName}!I2`,
         columnMapping,
      });
      setIsConnected(true);
      setSpreadsheetUrl(result.spreadsheetUrl);
   }, []);

   return { isConnected, spreadsheetUrl, isLoading, loadError, handleSaveMapping };
}
