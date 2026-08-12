'use client';

import { useCallback, useEffect, useState } from 'react';
import type { GoogleSheetColumnField, GoogleSheetSaveResult } from '@/components/ui/googlesheet/GoogleSheetSync';
import {
   getEvaluationSheetLink,
   saveEvaluationSheetLink,
} from '@/services/evaluation.service';

// GoogleSheetSync에 넘기는 컬럼 목록 - 키는 /evaluations/sheet-link의 columnMapping 필드명과 동일해야
// 한다("의견"만 선택 항목)
export const EVALUATION_SHEET_COLUMNS: GoogleSheetColumnField[] = [
   { key: 'traineeIdentifier', label: '훈련생 식별자' },
   { key: 'evaluationType', label: '평가 유형' },
   { key: 'item', label: '평가 항목' },
   { key: 'score', label: '점수' },
   { key: 'comment', label: '의견', required: false },
];

// 평가 시트 연동 설정 상태 - 탭을 옮겨도 연결 여부가 유지되도록 EvaluationsPageClient에서 한 번만
// 호출한다("동기화 실행" 탭이 이 값으로 잠금 여부를 판단함).
// 진입 시 GET으로 저장된 설정을 조회하고, 204(연동한 적 없음)면 신규 등록 화면으로 시작한다
export function useEvaluationSheetSync() {
   const [isConnected, setIsConnected] = useState(false);
   const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
   const [isLoading, setIsLoading] = useState(true);
   const [loadError, setLoadError] = useState(false);

   useEffect(() => {
      let isMounted = true;

      getEvaluationSheetLink()
         .then((link) => {
            if (!isMounted) return;
            // 204 No Content는 apiFetch가 undefined로 넘겨준다 - 아직 연동한 적 없는 정상 상태
            if (link) {
               setIsConnected(true);
               setSpreadsheetUrl(link.spreadsheetUrl);
            } else {
               setIsConnected(false);
            }
         })
         .catch(() => {
            if (!isMounted) return;
            setLoadError(true);
         })
         .finally(() => {
            if (isMounted) setIsLoading(false);
         });

      return () => {
         isMounted = false;
      };
   }, []);

   // GoogleSheetSync의 [설정 저장] 버튼이 연결 확인을 마친 뒤 호출한다. 응답이 저장 결과를
   // 그대로 돌려주지만 이 화면에서 실제로 쓰는 값은 spreadsheetUrl뿐이라 그것만 갱신한다
   const handleSaveMapping = useCallback(async (result: GoogleSheetSaveResult) => {
      await saveEvaluationSheetLink({
         spreadsheetUrl: result.spreadsheetUrl,
         tabName: result.sheetName,
         columnMapping: {
            traineeIdentifier: result.columnMapping.traineeIdentifier.columnName,
            evaluationType: result.columnMapping.evaluationType.columnName,
            item: result.columnMapping.item.columnName,
            score: result.columnMapping.score.columnName,
            comment: result.columnMapping.comment?.columnName ?? null,
         },
      });
      setIsConnected(true);
      setSpreadsheetUrl(result.spreadsheetUrl);
   }, []);

   return { isConnected, spreadsheetUrl, isLoading, loadError, handleSaveMapping };
}
