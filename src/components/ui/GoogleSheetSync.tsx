'use client';

import { useId, useState } from 'react';
import { Copy, ExternalLink } from 'lucide-react';
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

// TODO: 실제 서비스 계정 이메일이 정해지면 교체
const SHARE_EMAIL = 'campflow-bot@campflow-lms.iam.gserviceaccount.com';

export interface GoogleSheetColumnField {
   key: string;
   label: string;
}

export interface GoogleSheetSaveResult {
   spreadsheetId: string;
   spreadsheetUrl: string;
   spreadsheetTitle: string;
   sheetName: string;
   columnMapping: Record<string, string>;
}

interface GoogleSheetSyncProps {
   // 페이지마다 매핑해야 하는 컬럼이 달라서 목록을 props로 받는다
   columns: GoogleSheetColumnField[];
   // 연결 확인(/external-sheets/validate)은 예산/평가/출결 등에서 공통으로 쓰는 API라 컴포넌트가 직접 호출한다.
   // 저장 방식만 페이지마다 달라서(연동 대상 테이블이 다름) 호출을 위임받는다.
   onSave: (result: GoogleSheetSaveResult) => Promise<void>;
}

interface Connection {
   spreadsheetId: string;
   spreadsheetTitle: string;
   // 탭이 여러 개일 수 있으나 지금은 첫 번째 탭만 사용한다
   sheetName: string;
   columnOptions: string[];
}

export default function GoogleSheetSync({ columns, onSave }: GoogleSheetSyncProps) {
   const emailInputId = useId();
   const urlInputId = useId();
   const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
   const [isVerifying, setIsVerifying] = useState(false);
   const [verifyError, setVerifyError] = useState('');
   const [connection, setConnection] = useState<Connection | null>(null);
   // 컬럼 이름이 같은 시트도 구분할 수 있도록 이름이 아니라 columnOptions 안에서의 인덱스로 보관한다
   const [columnMapping, setColumnMapping] = useState<Record<string, number>>({});
   const [isSaving, setIsSaving] = useState(false);
   const [isSaved, setIsSaved] = useState(false);

   const canVerify = spreadsheetUrl.trim().length > 0 && !isVerifying;
   const canSave =
      connection !== null &&
      columns.every((column) => columnMapping[column.key] !== undefined) &&
      !isSaving;

   // 같은 이름의 컬럼이 여러 개면 선택 목록에서 구분할 수 있도록 표시해준다.
   // (API가 컬럼 이름 문자열만 내려줘서, 이름이 같으면 백엔드 입장에서도 여전히 구분이 안 된다는 한계는 남아있다)
   const duplicateColumnNames = connection
      ? new Set(
           connection.columnOptions.filter(
              (name, index) => connection.columnOptions.indexOf(name) !== index,
           ),
        )
      : new Set<string>();

   const handleCopyEmail = () => {
      navigator.clipboard.writeText(SHARE_EMAIL);
      toast.success('이메일을 복사했습니다.');
   };

   const handleUrlChange = (value: string) => {
      setSpreadsheetUrl(value);
      setVerifyError('');
      // URL이 바뀌면 이전 검증 결과와 매핑은 더 이상 유효하지 않다
      setConnection(null);
      setColumnMapping({});
   };

   const handleVerify = async () => {
      setIsVerifying(true);
      setVerifyError('');
      try {
         const result = await validateExternalSheet(spreadsheetUrl.trim());
         const firstSheet = result.sheets[0];
         setConnection({
            spreadsheetId: result.spreadsheetId,
            spreadsheetTitle: result.spreadsheetTitle,
            sheetName: firstSheet?.sheetName ?? '',
            columnOptions: firstSheet?.columns ?? [],
         });
         setColumnMapping({});
      } catch (err) {
         setConnection(null);
         setVerifyError(
            err instanceof ApiError
               ? err.message
               : '연결 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
         );
      } finally {
         setIsVerifying(false);
      }
   };

   const handleSave = async () => {
      if (!connection) return;
      setIsSaving(true);
      try {
         const resolvedMapping = Object.fromEntries(
            Object.entries(columnMapping).map(([key, index]) => [
               key,
               connection.columnOptions[index],
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

   const handleEdit = () => {
      setIsSaved(false);
      setConnection(null);
      setColumnMapping({});
      setVerifyError('');
   };

   if (isSaved) {
      return (
         <div className="rounded-xs border border-gray-200 p-5">
            <h3 className="text-sm font-bold text-gray-900">Google Sheet 연동</h3>
            <div className="mt-4 flex items-center justify-between gap-3">
               <div className="min-w-0">
                  <p className="text-xs text-gray-500">스프레드시트 URL</p>
                  <a
                     href={spreadsheetUrl}
                     target="_blank"
                     rel="noopener noreferrer"
                     className="mt-1 flex items-center gap-1 text-sm text-brand-green hover:underline"
                  >
                     <ExternalLink size={14} className="shrink-0" />
                     <span className="truncate">{spreadsheetUrl}</span>
                  </a>
               </div>
               <div className="flex shrink-0 items-center gap-2">
                  <span className="flex items-center gap-1.5 rounded-full bg-green-50 px-3 py-1 text-xs font-medium text-brand-green">
                     <span className="h-1.5 w-1.5 rounded-full bg-brand-green" />
                     연결됨
                  </span>
                  <button
                     type="button"
                     onClick={handleEdit}
                     className="cursor-pointer rounded-xs border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
                  >
                     수정
                  </button>
               </div>
            </div>
         </div>
      );
   }

   return (
      <div className="rounded-xs border border-gray-200 p-5">
         <h3 className="text-sm font-bold text-gray-900">Google Sheet 연동</h3>

         <div className="mt-4 rounded-xs border border-[#C8D9CE] bg-[#F0F4F2] px-6 py-5">
            <label htmlFor={emailInputId} className="block text-xs text-gray-700">
               아래 이메일을 시트의 공유 대상(뷰어 이상)으로 추가해주세요.
            </label>
            <div className="mt-2 flex gap-2">
               <input
                  id={emailInputId}
                  readOnly
                  value={SHARE_EMAIL}
                  className="h-8 flex-1 rounded-xs border border-gray-200 bg-white px-3 text-sm text-brand-green"
               />
               <button
                  type="button"
                  onClick={handleCopyEmail}
                  className="flex shrink-0 cursor-pointer items-center gap-1 rounded-xs border border-gray-200 bg-white px-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
               >
                  <Copy size={14} />
                  복사
               </button>
            </div>

            <label htmlFor={urlInputId} className="mt-4 block text-xs font-medium text-gray-700">
               스프레드시트 URL
            </label>
            <div className="mt-2 flex gap-2">
               <input
                  id={urlInputId}
                  value={spreadsheetUrl}
                  onChange={(e) => handleUrlChange(e.target.value)}
                  disabled={isVerifying}
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

         <div className="mt-5">
            <p className="flex items-center gap-2 text-sm font-bold text-gray-900">
               컬럼 매핑
               {!connection && (
                  <span className="text-xs font-normal text-gray-400">연결 후 활성화됩니다</span>
               )}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-4">
               {columns.map((column) => (
                  <div key={column.key} className="px-1.5">
                     <label className="flex items-center gap-1 text-sm text-gray-700">
                        {column.label}
                        <span className="text-brand-gold">*</span>
                     </label>
                     <Select
                        value={
                           columnMapping[column.key] !== undefined
                              ? String(columnMapping[column.key])
                              : ''
                        }
                        onValueChange={(value) => {
                           if (value === null) return;
                           setColumnMapping((prev) => ({ ...prev, [column.key]: Number(value) }));
                        }}
                        disabled={!connection}
                     >
                        <SelectTrigger className="mt-2 h-10 w-full rounded-xs">
                           <SelectValue placeholder="컬럼 선택">
                              {(value: string | null) => {
                                 const option = value ? connection?.columnOptions[Number(value)] : undefined;
                                 if (option === undefined) return null;
                                 return duplicateColumnNames.has(option)
                                    ? `${option} (${Number(value) + 1}번째 열)`
                                    : option;
                              }}
                           </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
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
               ))}
            </div>
         </div>

         <div className="mt-6 flex justify-end border-t border-gray-100 pt-4">
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
