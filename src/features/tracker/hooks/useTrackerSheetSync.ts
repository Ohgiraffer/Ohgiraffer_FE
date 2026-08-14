'use client';

import { useCallback, useEffect, useState } from 'react';
import { ApiError } from '@/lib/http';
import type { GoogleSheetColumnField, GoogleSheetSaveResult } from '@/components/ui/googlesheet/GoogleSheetSync';
import {
   getAttendanceSheetLink,
   saveAttendanceSheetLink,
   type AttendanceSheetColumnMapping,
} from '@/services/attendance.service';

// 출결 시트에서 매핑해야 하는 컬럼 9개 - 키는 /attendance/sheet-link의 columnMapping 필드명과 동일
export const ATTENDANCE_SHEET_COLUMNS: GoogleSheetColumnField[] = [
   { key: 'name', label: '이름' },
   // 학생을 식별하는 칼럼이라 필수 - 이름은 중복될 수 있어 실제 매칭 기준은 이메일이다
   { key: 'email', label: '이메일' },
   { key: 'trainingStatus', label: '훈련 상태' },
   { key: 'attendanceStatus', label: '출석 상태' },
   { key: 'checkIn', label: '입실 시간' },
   { key: 'checkOut', label: '퇴실 시간' },
   { key: 'outing', label: '외출 시간' },
   { key: 'return', label: '복귀 시간' },
   { key: 'trainingDate', label: '훈련 일자' },
];

// A1 표기법에서 시트 이름에 공백/하이픈 등이 있으면 단일 인용부호로 감싸야 하고, 이름 안의
// 단일 인용부호는 두 번 써서 escape해야 한다(알파벳/숫자/밑줄만이어도 감싸는 건 항상 안전함)
function quoteSheetName(sheetName: string) {
   return `'${sheetName.replace(/'/g, "''")}'`;
}

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
            // email 매핑이 필수가 되기 전에 등록된 연동은 이 필드가 비어 있을 수 있다 - 이름만으로는
            // 학생을 특정할 수 없어 동기화를 그대로 돌리면 안 되므로, 연결된 것으로 취급하지 않고
            // 다시 매핑하도록 유도한다(백엔드에 기존 데이터를 채워주는 마이그레이션이 없는 상태)
            if (!link.columnMapping.email) {
               setIsConnected(false);
               return;
            }
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
         dateCellRange: `${quoteSheetName(result.sheetName)}!I2`,
         columnMapping,
      });
      setIsConnected(true);
      setSpreadsheetUrl(result.spreadsheetUrl);
   }, []);

   return { isConnected, spreadsheetUrl, isLoading, loadError, handleSaveMapping };
}
