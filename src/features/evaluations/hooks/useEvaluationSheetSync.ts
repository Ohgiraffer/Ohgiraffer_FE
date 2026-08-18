'use client';

import { useCallback, useEffect, useState } from 'react';
import type { GoogleSheetColumnField, GoogleSheetSaveResult } from '@/components/ui/googlesheet/GoogleSheetSync';
import {
   getEvaluationSheetLink,
   saveEvaluationSheetLink,
   type EvaluationSheetColumnMapping,
} from '@/services/evaluation.service';

// GoogleSheetSync에 넘기는 컬럼 목록
export const EVALUATION_SHEET_COLUMNS: GoogleSheetColumnField[] = [
   { key: 'traineeIdentifier', label: '훈련생 식별자' },
   { key: 'evaluationType', label: '평가 유형' },
   { key: 'item', label: '평가 항목' },
   { key: 'score', label: '점수' },
   { key: 'comment', label: '의견', required: false },
];

export function useEvaluationSheetSync() {
   const [isConnected, setIsConnected] = useState(false);
   const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
   const [columnMapping, setColumnMapping] = useState<EvaluationSheetColumnMapping | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [loadError, setLoadError] = useState(false);

   useEffect(() => {
      let isMounted = true;

      getEvaluationSheetLink()
         .then((link) => {
            if (!isMounted) return;

            if (link) {
               setIsConnected(true);
               setSpreadsheetUrl(link.spreadsheetUrl);
               setColumnMapping(link.columnMapping);
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

   // GoogleSheetSync의 [설정 저장] 버튼이 연결 확인을 마친 뒤 호출
   const handleSaveMapping = useCallback(async (result: GoogleSheetSaveResult) => {
      const mapping: EvaluationSheetColumnMapping = {
         traineeIdentifier: result.columnMapping.traineeIdentifier.columnName,
         evaluationType: result.columnMapping.evaluationType.columnName,
         item: result.columnMapping.item.columnName,
         score: result.columnMapping.score.columnName,
         comment: result.columnMapping.comment?.columnName ?? null,
      };

      await saveEvaluationSheetLink({
         spreadsheetUrl: result.spreadsheetUrl,
         tabName: result.sheetName,
         columnMapping: mapping,
      });
      setIsConnected(true);
      setSpreadsheetUrl(result.spreadsheetUrl);
      setColumnMapping(mapping);
   }, []);

   return { isConnected, spreadsheetUrl, columnMapping, isLoading, loadError, handleSaveMapping };
}
