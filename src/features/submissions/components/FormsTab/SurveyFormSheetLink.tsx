'use client';

import { useId, useState } from 'react';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/components/ui/shadcn/select';
import { toast } from '@/lib/toast';
import { ApiError } from '@/lib/http';
import GoogleSheetEmailNotice from '@/components/ui/googlesheet/GoogleSheetEmailNotice';
import GoogleSheetConnectedCard from '@/components/ui/googlesheet/GoogleSheetConnectedCard';
import {
   saveSurveySheetLink,
   validateSurveySheetLink,
   type ValidateSheetLinkResponse,
} from '@/services/surveyForm.service';
import type { SurveyFormSheetLink as SheetLinkData } from '../../types';

interface SurveyFormSheetLinkProps {
   surveyFormId: number;
   sheetLink?: SheetLinkData;
   onLinked: () => void;
}

export default function SurveyFormSheetLink({
   surveyFormId,
   sheetLink,
   onLinked,
}: SurveyFormSheetLinkProps) {
   const urlInputId = useId();
   const [isEditing, setIsEditing] = useState(false);
   const [spreadsheetUrl, setSpreadsheetUrl] = useState('');
   const [isVerifying, setIsVerifying] = useState(false);
   const [verifyError, setVerifyError] = useState('');
   const [validated, setValidated] = useState<ValidateSheetLinkResponse | null>(null);
   const [respondentColumn, setRespondentColumn] = useState('');
   const [submittedAtColumn, setSubmittedAtColumn] = useState('');
   const [isSaving, setIsSaving] = useState(false);

   const startEditing = () => {
      setSpreadsheetUrl(sheetLink?.spreadsheetUrl ?? '');
      setValidated(null);
      setVerifyError('');
      setRespondentColumn('');
      setSubmittedAtColumn('');
      setIsEditing(true);
   };

   const handleUrlChange = (value: string) => {
      setSpreadsheetUrl(value);
      setVerifyError('');
      setValidated(null);
      setRespondentColumn('');
      setSubmittedAtColumn('');
   };

   const handleVerify = async () => {
      setIsVerifying(true);
      setVerifyError('');
      try {
         const result = await validateSurveySheetLink(surveyFormId, {
            spreadsheetUrl: spreadsheetUrl.trim(),
            sheetName: null,
         });
         setValidated(result);
      } catch (err) {
         setValidated(null);
         setVerifyError(
            err instanceof ApiError
               ? err.message
               : '연결 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
         );
      } finally {
         setIsVerifying(false);
      }
   };

   const handleSelectSheet = async (sheetName: string) => {
      setIsVerifying(true);
      setVerifyError('');
      try {
         const result = await validateSurveySheetLink(surveyFormId, {
            spreadsheetUrl: spreadsheetUrl.trim(),
            sheetName,
         });
         setValidated(result);
         setRespondentColumn('');
         setSubmittedAtColumn('');
      } catch (err) {
         setVerifyError(
            err instanceof ApiError
               ? err.message
               : '시트 확인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
         );
      } finally {
         setIsVerifying(false);
      }
   };

   const canSave =
      !!validated?.selectedSheetName &&
      !!respondentColumn &&
      !!submittedAtColumn &&
      respondentColumn !== submittedAtColumn &&
      !isSaving;

   const handleSave = async () => {
      if (!validated?.selectedSheetName || !canSave) return;
      setIsSaving(true);
      try {
         await saveSurveySheetLink(surveyFormId, {
            spreadsheetUrl: spreadsheetUrl.trim(),
            sheetName: validated.selectedSheetName,
            respondentColumn,
            submittedAtColumn,
         });
         toast.success('Sheet 연결 설정을 저장했습니다.');
         setIsEditing(false);
         onLinked();
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

   if (!isEditing && sheetLink?.connected) {
      return (
         <GoogleSheetConnectedCard
            urlLabel={`스프레드시트 URL · ${sheetLink.sheetName}`}
            spreadsheetUrl={sheetLink.spreadsheetUrl}
            onEdit={startEditing}
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
                  disabled={isVerifying}
                  placeholder="https://docs.google.com/spreadsheets/..."
                  className="h-8 flex-1 rounded-xs border border-gray-200 bg-white px-3 text-sm text-gray-900 outline-none focus:border-gray-400 disabled:bg-gray-50 disabled:text-gray-400"
               />
               <button
                  type="button"
                  onClick={handleVerify}
                  disabled={spreadsheetUrl.trim().length === 0 || isVerifying}
                  className="h-8 shrink-0 cursor-pointer rounded-xs bg-brand-green px-3 text-sm font-medium text-white hover:bg-[#4D655A] disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
               >
                  {isVerifying ? '확인 중...' : '연결 확인'}
               </button>
            </div>
            {verifyError && <p className="mt-2 text-xs text-red-500">{verifyError}</p>}
            {validated && (
               <p className="mt-2 text-xs text-brand-green">
                  {validated.spreadsheetTitle}에 연결됐습니다.
               </p>
            )}
         </div>

         {validated && (
            <div className="mt-5">
               <label className="flex items-center gap-1 text-sm text-gray-700">
                  분석 대상 시트 <span className="text-brand-gold">*</span>
               </label>
               <Select
                  value={validated.selectedSheetName ?? ''}
                  onValueChange={(value) => value && handleSelectSheet(value)}
                  disabled={isVerifying}
               >
                  <SelectTrigger className="mt-2 h-10 w-full rounded-xs">
                     <SelectValue placeholder="시트 선택" />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                     {validated.sheets.map((sheet) => (
                        <SelectItem key={sheet.sheetGid} value={sheet.sheetName} className="cursor-pointer">
                           {sheet.sheetName}
                        </SelectItem>
                     ))}
                  </SelectContent>
               </Select>
            </div>
         )}

         {validated?.selectedSheetName && (
            <div className="mt-5 grid grid-cols-2 gap-4">
               <div>
                  <label className="flex items-center gap-1 text-sm text-gray-700">
                     응답자 식별 컬럼 <span className="text-brand-gold">*</span>
                  </label>
                  <Select value={respondentColumn} onValueChange={(v) => v && setRespondentColumn(v)}>
                     <SelectTrigger className="mt-2 h-10 w-full rounded-xs">
                        <SelectValue placeholder="컬럼 선택" />
                     </SelectTrigger>
                     <SelectContent alignItemWithTrigger={false}>
                        {validated.columns.map((column) => (
                           <SelectItem key={column} value={column} className="cursor-pointer">
                              {column}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>
               <div>
                  <label className="flex items-center gap-1 text-sm text-gray-700">
                     응답 일시 컬럼 <span className="text-brand-gold">*</span>
                  </label>
                  <Select value={submittedAtColumn} onValueChange={(v) => v && setSubmittedAtColumn(v)}>
                     <SelectTrigger className="mt-2 h-10 w-full rounded-xs">
                        <SelectValue placeholder="컬럼 선택" />
                     </SelectTrigger>
                     <SelectContent alignItemWithTrigger={false}>
                        {validated.columns.map((column) => (
                           <SelectItem key={column} value={column} className="cursor-pointer">
                              {column}
                           </SelectItem>
                        ))}
                     </SelectContent>
                  </Select>
               </div>
               {respondentColumn && submittedAtColumn && respondentColumn === submittedAtColumn && (
                  <p className="col-span-2 text-xs text-red-500">
                     응답자 식별 컬럼과 응답 일시 컬럼은 서로 달라야 합니다.
                  </p>
               )}
            </div>
         )}

         <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-4">
            {sheetLink?.connected && (
               <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="cursor-pointer rounded-xs border border-gray-200 px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
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
