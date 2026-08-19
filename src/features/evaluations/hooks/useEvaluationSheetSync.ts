'use client';

import { useCallback, useEffect, useState } from 'react';
import type {
   GoogleSheetColumnField,
   GoogleSheetSaveResult,
} from '@/components/ui/googlesheet/GoogleSheetSync';
import {
   getEvaluationSheetLink,
   saveEvaluationSheetLink,
   type EvaluationSheetColumnMapping,
   type EvaluationSheetLink,
} from '@/services/evaluation.service';

// GoogleSheetSync에 넘기는 컬럼 목록
export const EVALUATION_SHEET_COLUMNS: GoogleSheetColumnField[] = [
   { key: 'traineeIdentifier', label: '훈련생 식별자' },
   { key: 'evaluationType', label: '평가 유형' },
   { key: 'item', label: '평가 항목' },
   { key: 'score', label: '점수' },
   { key: 'comment', label: '의견', required: false },
];

// initial === undefined면 "프리페치를 못 받음"(로딩부터 시작), null이면 "프리페치는 받았고
// 아직 연동 안 한 상태로 확인됨", 객체면 "프리페치로 이미 연동된 상태를 확인함" - 세 가지를
// 구분해야 로딩 스켈레톤을 안 띄우면서도 연동 여부를 정확히 시딩할 수 있다
export function useEvaluationSheetSync(initial?: EvaluationSheetLink | null) {
   const hasInitial = initial !== undefined;
   const [isConnected, setIsConnected] = useState(!!initial);
   const [spreadsheetUrl, setSpreadsheetUrl] = useState(initial?.spreadsheetUrl ?? '');
   const [columnMapping, setColumnMapping] = useState<EvaluationSheetColumnMapping | null>(
      initial?.columnMapping ?? null,
   );
   const [isLoading, setIsLoading] = useState(!hasInitial);
   const [loadError, setLoadError] = useState(false);

   // initial이 있어도(프리페치 성공) 마운트 시 한 번은 항상 다시 조회한다 - 연동 상태는 다른
   // 운영진이 방금 바꿨을 수도 있는 값이라, 프리페치된 값을 화면엔 즉시 보여주면서 백그라운드로
   // 조용히 재검증한다(isLoading을 안 건드리므로 스켈레톤 없이 조용히 갱신됨)
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
