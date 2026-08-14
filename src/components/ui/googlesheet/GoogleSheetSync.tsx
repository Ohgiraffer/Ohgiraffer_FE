'use client';

import { useId, useRef, useState } from 'react';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/shadcn/select';
import { validateExternalSheet } from '@/services/externalSheet.service';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import GoogleSheetEmailNotice from './GoogleSheetEmailNotice';
import GoogleSheetConnectedCard from './GoogleSheetConnectedCard';

export interface GoogleSheetColumnField {
   key: string;
   label: string;
   // 기본값 true. false로 주면 매핑하지 않아도 저장 가능(예: 평가 시트의 "의견")하고,
   // 라벨 옆에도 필수(*) 대신 "(선택)"이 표시된다
   required?: boolean;
}

export interface GoogleSheetColumnMapping {
   // 같은 이름의 컬럼이 여러 개여도 구분할 수 있도록 열 위치(0-based)를 함께 넘긴다
   columnIndex: number;
   columnName: string;
}

export interface GoogleSheetSaveResult {
   spreadsheetId: string;
   spreadsheetUrl: string;
   spreadsheetTitle: string;
   sheetName: string;
   columnMapping: Record<string, GoogleSheetColumnMapping>;
}

interface GoogleSheetSyncProps {
   // 페이지마다 매핑해야 하는 컬럼이 달라서 목록을 props로 받는다. 빈 배열이면 컬럼 매핑 없이
   // 연결 확인만으로 저장 가능한 단순한 흐름(예: 설문 응답 자동 기록)이 된다
   columns: GoogleSheetColumnField[];
   // 연결 확인(/external-sheets/validate)은 예산/평가/출결 등에서 공통으로 쓰는 API라 컴포넌트가 직접 호출한다.
   // 저장 방식만 페이지마다 달라서(연동 대상 테이블이 다름) 호출을 위임받는다.
   onSave: (result: GoogleSheetSaveResult) => Promise<void>;
   // 연결된 상태의 헤더 영역에 페이지별 추가 액션(예: "평가 요약 결과 다운로드")을 끼워 넣는다
   connectedExtra?: React.ReactNode;
   // 서버에 이미 저장된 연동 설정이 있어서 페이지 진입 시부터 "연결됨" 카드로 보여줘야 할 때 넘긴다.
   // 이 컴포넌트 자체는 조회 API를 모르므로(페이지마다 다름) 이미 조회된 결과를 그대로 받는다.
   // columnMapping(컬럼 key -> 실제 시트의 컬럼명)을 함께 주면, "수정"을 눌렀을 때 URL이 그대로인
   // 한 재검증 후 이 값으로 매핑을 미리 채워준다(안 주면 예전처럼 매핑을 처음부터 다시 입력해야 함)
   initialConnection?: { spreadsheetUrl: string; columnMapping?: Record<string, string> };
}

interface Connection {
   spreadsheetId: string;
   spreadsheetTitle: string;
   // 탭이 여러 개일 수 있으나 지금은 첫 번째 탭만 사용한다
   sheetName: string;
   columnOptions: string[];
}

export default function GoogleSheetSync({
   columns,
   onSave,
   connectedExtra,
   initialConnection,
}: GoogleSheetSyncProps) {
   const urlInputId = useId();
   // 컬럼 매핑 select가 반복 렌더링되므로 useId를 컬럼 개수만큼 미리 부를 수 없다 -
   // 한 번만 받은 prefix에 column.key(이미 고유함이 보장된 값)를 붙여 각 select의 id를 만든다
   const columnFieldPrefix = useId();
   const [spreadsheetUrl, setSpreadsheetUrl] = useState(initialConnection?.spreadsheetUrl ?? '');
   const [isVerifying, setIsVerifying] = useState(false);
   const [verifyError, setVerifyError] = useState('');
   const [connection, setConnection] = useState<Connection | null>(null);
   // 컬럼 이름이 같은 시트도 구분할 수 있도록 이름이 아니라 columnOptions 안에서의 인덱스로 보관한다
   const [columnMapping, setColumnMapping] = useState<Record<string, number>>({});
   const [isSaving, setIsSaving] = useState(false);
   const [isSaved, setIsSaved] = useState(initialConnection != null);
   // 마지막으로 저장 확인된 상태의 스냅샷 - "수정" 시 재검증 후 매핑을 미리 채우거나,
   // "취소" 시 되돌아가는 기준으로 쓴다(저장에 성공할 때마다 최신 값으로 갱신)
   const [savedSnapshot, setSavedSnapshot] = useState(
      initialConnection
         ? { spreadsheetUrl: initialConnection.spreadsheetUrl, columnMapping: initialConnection.columnMapping ?? {} }
         : null,
   );
   // handleVerify/handleEdit이 각자 독립적으로 validateExternalSheet를 호출할 수 있어서, 취소
   // 없이 겹쳐 호출되면(예: handleEdit 재검증 도중 사용자가 "연결 확인"을 다시 누른 경우) 먼저
   // 끝난 요청의 finally가 isVerifying을 꺼버려 아직 실행 중인 요청이 있는데도 저장이 활성화될
   // 수 있다 - 매 호출마다 세대를 올리고, 응답이 왔을 때 가장 최신 요청인지 확인해 그 결과만 반영한다
   const verifyEpochRef = useRef(0);

   const canVerify = spreadsheetUrl.trim().length > 0 && !isVerifying && !isSaving;
   const canSave =
      connection !== null &&
      columns.every(
         (column) => column.required === false || columnMapping[column.key] !== undefined,
      ) &&
      !isSaving &&
      !isVerifying;

   // 같은 이름의 컬럼이 여러 개면 선택 목록에서 구분할 수 있도록 표시해준다.
   // (API가 컬럼 이름 문자열만 내려줘서, 이름이 같으면 백엔드 입장에서도 여전히 구분이 안 된다는 한계는 남아있다)
   const duplicateColumnNames = connection
      ? new Set(
           connection.columnOptions.filter(
              (name, index) => connection.columnOptions.indexOf(name) !== index,
           ),
        )
      : new Set<string>();

   const handleUrlChange = (value: string) => {
      setSpreadsheetUrl(value);
      setVerifyError('');
      // URL이 바뀌면 이전 검증 결과와 매핑은 더 이상 유효하지 않다
      setConnection(null);
      setColumnMapping({});
   };

   const handleVerify = async () => {
      const epoch = ++verifyEpochRef.current;
      setIsVerifying(true);
      setVerifyError('');
      try {
         const result = await validateExternalSheet(spreadsheetUrl.trim());
         // 이 요청이 진행되는 동안 더 최신 검증 요청이 시작됐다면(재검증이 겹친 경우) 낡은
         // 응답이니 상태를 덮어쓰지 않는다
         if (verifyEpochRef.current !== epoch) return;
         const firstSheet = result.sheets[0];
         setConnection({
            spreadsheetId: result.spreadsheetId,
            spreadsheetTitle: result.spreadsheetTitle,
            sheetName: firstSheet?.sheetName ?? '',
            columnOptions: firstSheet?.columns ?? [],
         });
         setColumnMapping({});
      } catch (err) {
         if (verifyEpochRef.current !== epoch) return;
         setConnection(null);
         setVerifyError(
            err instanceof ApiError
               ? err.message
               : '연결 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
         );
      } finally {
         if (verifyEpochRef.current === epoch) setIsVerifying(false);
      }
   };

   const handleSave = async () => {
      if (!connection) return;
      setIsSaving(true);
      try {
         const resolvedMapping: Record<string, GoogleSheetColumnMapping> = Object.fromEntries(
            Object.entries(columnMapping).map(([key, index]) => [
               key,
               { columnIndex: index, columnName: connection.columnOptions[index] },
            ]),
         );
         await onSave({
            spreadsheetId: connection.spreadsheetId,
            spreadsheetUrl: spreadsheetUrl.trim(),
            spreadsheetTitle: connection.spreadsheetTitle,
            sheetName: connection.sheetName,
            columnMapping: resolvedMapping,
         });
         setIsSaved(true);
         setSavedSnapshot({
            spreadsheetUrl: spreadsheetUrl.trim(),
            columnMapping: Object.fromEntries(
               Object.entries(resolvedMapping).map(([key, value]) => [key, value.columnName]),
            ),
         });
      } catch (err) {
         toast.error(
            err instanceof ApiError
               ? err.message
               : '설정 저장에 실패했습니다. 잠시 후 다시 시도해주세요.',
         );
      } finally {
         setIsSaving(false);
      }
   };

   // URL이 그대로면 재검증 후 이전에 저장했던 컬럼명으로 매핑을 미리 채운다 - URL을 바꾸면
   // handleUrlChange가 이미 connection/columnMapping을 비우므로 자연스럽게 새로 매핑하게 된다
   const handleEdit = async () => {
      setIsSaved(false);
      setVerifyError('');
      if (!savedSnapshot) {
         setConnection(null);
         setColumnMapping({});
         return;
      }
      const epoch = ++verifyEpochRef.current;
      setIsVerifying(true);
      try {
         const result = await validateExternalSheet(savedSnapshot.spreadsheetUrl.trim());
         if (verifyEpochRef.current !== epoch) return;
         const firstSheet = result.sheets[0];
         const columnOptions = firstSheet?.columns ?? [];
         setConnection({
            spreadsheetId: result.spreadsheetId,
            spreadsheetTitle: result.spreadsheetTitle,
            sheetName: firstSheet?.sheetName ?? '',
            columnOptions,
         });
         const prefilled: Record<string, number> = {};
         Object.entries(savedSnapshot.columnMapping).forEach(([key, name]) => {
            const index = columnOptions.indexOf(name);
            if (index !== -1) prefilled[key] = index;
         });
         setColumnMapping(prefilled);
      } catch {
         if (verifyEpochRef.current !== epoch) return;
         // 재검증 자체가 실패해도 편집은 계속할 수 있어야 하므로 빈 상태로 두고,
         // 사용자가 "연결 확인"을 다시 눌러 직접 재시도하게 한다
         setConnection(null);
         setColumnMapping({});
      } finally {
         if (verifyEpochRef.current === epoch) setIsVerifying(false);
      }
   };

   // 편집을 그만두고 마지막 저장 상태로 되돌아간다(저장된 적이 없으면 취소 버튼 자체가 안 보임)
   const handleCancelEdit = () => {
      if (!savedSnapshot) return;
      setSpreadsheetUrl(savedSnapshot.spreadsheetUrl);
      setConnection(null);
      setColumnMapping({});
      setVerifyError('');
      setIsSaved(true);
   };

   if (isSaved) {
      return (
         <GoogleSheetConnectedCard
            urlLabel="스프레드시트 URL"
            spreadsheetUrl={spreadsheetUrl}
            onEdit={handleEdit}
            extra={connectedExtra}
         />
      );
   }

   return (
      <div className="rounded-xs border bg-white border-gray-200 p-5">
         <h3 className="text-sm font-bold text-gray-900">Google Sheet 연동</h3>

         <div className="mt-4 rounded-xs border border-[#C8D9CE] bg-[#F0F4F2] px-6 py-5">
            <GoogleSheetEmailNotice />

            <label htmlFor={urlInputId} className="mt-4 block text-xs font-medium text-gray-700">
               스프레드시트 URL
            </label>
            <div className="mt-2 flex gap-2">
               <input
                  id={urlInputId}
                  value={spreadsheetUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  disabled={isVerifying || isSaving}
                  placeholder="https://docs.google.com/spreadsheets/..."
                  className="h-8 flex-1 rounded-xs border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-gray-400 disabled:bg-gray-50 disabled:text-gray-400"
               />
               <button
                  type="button"
                  onClick={handleVerify}
                  disabled={!canVerify}
                  className="h-8 shrink-0 cursor-pointer rounded-xs bg-brand-green px-3 text-sm font-medium text-white hover:bg-[#4D655A] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
               >
                  {isVerifying ? '확인 중...' : '연결 확인'}
               </button>
            </div>
            {verifyError && <p className="mt-2 text-xs text-red-500">{verifyError}</p>}
            {connection && (
               <p className="mt-2 text-xs text-brand-green">
                  {connection.spreadsheetTitle}에 연결됐습니다.
               </p>
            )}
         </div>

         {columns.length > 0 && (
            <div className="mt-5">
               <p className="flex items-center gap-2 text-sm font-bold text-gray-900">
                  컬럼 매핑
                  {!connection && (
                     <span className="text-xs font-normal text-gray-400">연결 후 활성화됩니다</span>
                  )}
               </p>
               <div className="mt-3 grid grid-cols-3 gap-4">
                  {columns.map((column) => {
                     const fieldId = `${columnFieldPrefix}-${column.key}`;
                     return (
                        <div key={column.key} className="px-1.5">
                           <label
                              htmlFor={fieldId}
                              className="flex items-center gap-1 text-sm text-gray-700"
                           >
                              {column.label}
                              {column.required === false ? (
                                 <span className="text-xs font-normal text-gray-400">(선택)</span>
                              ) : (
                                 <span className="text-brand-gold">*</span>
                              )}
                           </label>
                           <Select
                              value={
                                 columnMapping[column.key] !== undefined
                                    ? String(columnMapping[column.key])
                                    : ''
                              }
                              onValueChange={(value) => {
                                 if (value === null) return;
                                 setColumnMapping((prev) => ({
                                    ...prev,
                                    [column.key]: Number(value),
                                 }));
                              }}
                              disabled={!connection || isVerifying || isSaving}
                           >
                              <SelectTrigger
                                 id={fieldId}
                                 aria-required="true"
                                 className="mt-2 h-10 w-full rounded-xs"
                              >
                                 <SelectValue placeholder="컬럼 선택">
                                    {(value: string | null) => {
                                       const option = value
                                          ? connection?.columnOptions[Number(value)]
                                          : undefined;
                                       if (option === undefined) return null;
                                       return duplicateColumnNames.has(option)
                                          ? `${option} (${Number(value) + 1}번째 열)`
                                          : option;
                                    }}
                                 </SelectValue>
                              </SelectTrigger>
                              <SelectContent alignItemWithTrigger={false}>
                                 {connection?.columnOptions.map((option, index) => (
                                    <SelectItem key={index} value={String(index)}>
                                       {duplicateColumnNames.has(option)
                                          ? `${option} (${index + 1}번째 열)`
                                          : option}
                                    </SelectItem>
                                 ))}
                              </SelectContent>
                           </Select>
                        </div>
                     );
                  })}
               </div>
            </div>
         )}

         <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
            {savedSnapshot && (
               <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="cursor-pointer rounded-xs border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
               >
                  취소
               </button>
            )}
            <button
               type="button"
               onClick={handleSave}
               disabled={!canSave}
               className="cursor-pointer rounded-xs bg-brand-green px-3.5 py-2 text-sm font-medium text-white hover:bg-[#4D655A] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
            >
               {isSaving ? '저장 중...' : '설정 저장'}
            </button>
         </div>
      </div>
   );
}
