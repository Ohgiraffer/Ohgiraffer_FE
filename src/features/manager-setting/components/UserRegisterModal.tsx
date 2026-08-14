'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import {
   downloadUserRegisterTemplate,
   extractUsersFromFile,
   registerUsers,
   type ExtractedUserRow,
} from '@/services/user.service';
import ManualEntryTab from '../userRegisterModal/ManualEntryTab';
import FileUploadTab from '../userRegisterModal/FileUploadTab';
import type { UserDraftRow } from '../types';

type RegisterModalTab = 'manual' | 'file';

type Props = {
   open: boolean;
   onClose: () => void;
   // 직접 입력/파일 업로드 등록에 성공하면 호출
   onRegistered: () => void;
};

function createEmptyDraftRow(): UserDraftRow {
   return { id: crypto.randomUUID(), name: '', email: '', phone: '', role: '훈련생' };
}

function getApiErrorMessage(err: unknown, fallback: string) {
   return err instanceof ApiError ? err.message : fallback;
}

function triggerBlobDownload(blob: Blob, filename: string) {
   const url = URL.createObjectURL(blob);
   const a = document.createElement('a');
   a.href = url;
   a.download = filename;
   a.click();
   URL.revokeObjectURL(url);
}

// "사용자 등록" 모달
export default function UserRegisterModal({ open, onClose, onRegistered }: Props) {
   const [activeTab, setActiveTab] = useState<RegisterModalTab>('manual');

   // 직접 입력 탭 상태
   const [rows, setRows] = useState<UserDraftRow[]>([]);

   // 파일 업로드 탭 상태 - 파일을 고르면 즉시 추출 API 호출
   const [selectedFile, setSelectedFile] = useState<File | null>(null);
   const [extractedRows, setExtractedRows] = useState<ExtractedUserRow[] | null>(null);
   const [isExtracting, setIsExtracting] = useState(false);
   const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
   const [selectedRowNumbers, setSelectedRowNumbers] = useState<Set<number>>(new Set());

   const [isRegistering, setIsRegistering] = useState(false);

   const isRegisteringRef = useRef(false);
   
   const extractionRequestIdRef = useRef(0);

   const [fileInputResetKey, setFileInputResetKey] = useState(0);

   const addRow = () => setRows((prev) => [...prev, createEmptyDraftRow()]);
   const removeRow = (id: string) => setRows((prev) => prev.filter((row) => row.id !== id));
   const updateRow = (id: string, field: keyof Omit<UserDraftRow, 'id'>, value: string) => {
      setRows((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
   };

   const isManualValid =
      rows.length > 0 &&
      rows.every((row) => row.name.trim() && row.email.trim() && row.phone.trim() && row.role);

   const validFileRows = (extractedRows ?? []).filter((row) => row.valid);
   const selectedFileRows = validFileRows.filter((row) => selectedRowNumbers.has(row.rowNumber));

   const resetAndClose = () => {
      setActiveTab('manual');
      setRows([]);
      setSelectedFile(null);
      setExtractedRows(null);
      setSelectedRowNumbers(new Set());
      onClose();
   };

   const handleFileSelect = async (file: File | null) => {
      const requestId = ++extractionRequestIdRef.current;
      setSelectedFile(file);
      setExtractedRows(null);
      setSelectedRowNumbers(new Set());
      if (!file) return;

      setIsExtracting(true);
      try {
         const result = await extractUsersFromFile(file);
         if (extractionRequestIdRef.current !== requestId) return; 
         setExtractedRows(result.rows);
         setSelectedRowNumbers(
            new Set(result.rows.filter((row) => row.valid).map((row) => row.rowNumber)),
         );
      } catch (err) {
         if (extractionRequestIdRef.current !== requestId) return;
         toast.error(
            getApiErrorMessage(
               err,
               '파일에서 사용자 정보를 추출하지 못했습니다. 파일을 확인해주세요.',
            ),
         );
         setSelectedFile(null);
         
         setFileInputResetKey((key) => key + 1);
      } finally {
         if (extractionRequestIdRef.current === requestId) setIsExtracting(false);
      }
   };

   const toggleRowSelected = (rowNumber: number) => {
      setSelectedRowNumbers((prev) => {
         const next = new Set(prev);
         if (next.has(rowNumber)) {
            next.delete(rowNumber);
         } else {
            next.add(rowNumber);
         }
         return next;
      });
   };

   const toggleAllRowsSelected = () => {
      setSelectedRowNumbers((prev) =>
         prev.size === validFileRows.length
            ? new Set()
            : new Set(validFileRows.map((row) => row.rowNumber)),
      );
   };

   const handleDownloadTemplate = async () => {
      if (isDownloadingTemplate) return;
      setIsDownloadingTemplate(true);
      try {
         const { blob, filename } = await downloadUserRegisterTemplate();
         triggerBlobDownload(blob, filename ?? '사용자_등록_템플릿.xlsx');
      } catch (err) {
         toast.error(
            getApiErrorMessage(err, '템플릿 다운로드에 실패했습니다. 잠시 후 다시 시도해주세요.'),
         );
      } finally {
         setIsDownloadingTemplate(false);
      }
   };

   // "직접 입력" 탭 등록
   const handleManualRegister = async () => {
      if (!isManualValid) return;
      if (isRegisteringRef.current) return;
      isRegisteringRef.current = true;
      setIsRegistering(true);

      try {
         await registerUsers({
            rows: rows.map((row) => ({
               name: row.name,
               email: row.email,
               phone: row.phone,
               role: row.role,
            })),
         });

         toast.success(`${rows.length}명이 등록되었습니다.`);
         onRegistered();
         resetAndClose();
      } catch (err) {
         toast.error(
            getApiErrorMessage(
               err,
               '사용자 등록 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            ),
         );
      } finally {
         isRegisteringRef.current = false;
         setIsRegistering(false);
      }
   };

   // "파일 업로드" 탭 등록
   const handleFileRegister = async () => {
      if (selectedFileRows.length === 0) return;
      if (isRegisteringRef.current) return;
      isRegisteringRef.current = true;
      setIsRegistering(true);

      try {
         await registerUsers({
            rows: selectedFileRows.map((row) => ({
               name: row.name,
               email: row.email,
               phone: row.phone,
               role: row.rawRole,
            })),
         });

         toast.success(`${selectedFileRows.length}명이 등록되었습니다.`);
         onRegistered();
         resetAndClose();
      } catch (err) {
         toast.error(
            getApiErrorMessage(
               err,
               '사용자 등록 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            ),
         );
      } finally {
         isRegisteringRef.current = false;
         setIsRegistering(false);
      }
   };

   useEffect(() => {
      if (!open) return;

      const handleKeyDown = (event: KeyboardEvent) => {
         if (event.key === 'Escape' && !isRegisteringRef.current) resetAndClose();
      };

      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      return () => {
         document.removeEventListener('keydown', handleKeyDown);
         document.body.style.overflow = '';
      };
   }, [open]);

   if (!open) return null;

   const isManualTab = activeTab === 'manual';
   const canSubmit = isManualTab
      ? isManualValid && !isRegistering
      : selectedFileRows.length > 0 && !isRegistering && !isExtracting;

   return createPortal(
      <div
         className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
         onClick={() => {
            if (!isRegistering) resetAndClose();
         }}
      >
         <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-register-modal-title"
            onClick={(event) => event.stopPropagation()}
            className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-sm bg-white p-8 shadow-lg"
         >
            <div className="flex items-center justify-between">
               <h2 id="user-register-modal-title" className="text-xl font-bold text-gray-900">
                  사용자 등록
               </h2>
               <button
                  type="button"
                  onClick={resetAndClose}
                  disabled={isRegistering}
                  aria-label="닫기"
                  className="cursor-pointer rounded-sm p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
               >
                  <X size={20} />
               </button>
            </div>

            <div className="mt-4 flex gap-6 border-b border-[#E5E7EB]">
               <button
                  type="button"
                  onClick={() => setActiveTab('manual')}
                  disabled={isRegistering}
                  className={`cursor-pointer border-b-2 pb-3 text-sm transition-colors disabled:cursor-not-allowed ${
                     activeTab === 'manual'
                        ? 'border-brand-green font-bold text-gray-900'
                        : 'border-transparent font-medium text-gray-400 hover:text-gray-700'
                  }`}
               >
                  직접 입력
               </button>
               <button
                  type="button"
                  onClick={() => setActiveTab('file')}
                  disabled={isRegistering}
                  className={`cursor-pointer border-b-2 pb-3 text-sm transition-colors disabled:cursor-not-allowed ${
                     activeTab === 'file'
                        ? 'border-brand-green font-bold text-gray-900'
                        : 'border-transparent font-medium text-gray-400 hover:text-gray-700'
                  }`}
               >
                  파일 업로드
               </button>
            </div>

            <div className="mt-6">
               {isManualTab ? (
                  <ManualEntryTab
                     rows={rows}
                     onAddRow={addRow}
                     onRemoveRow={removeRow}
                     onUpdateRow={updateRow}
                     disabled={isRegistering}
                  />
               ) : (
                  <FileUploadTab
                     selectedFile={selectedFile}
                     onFileSelect={handleFileSelect}
                     extractedRows={extractedRows}
                     isExtracting={isExtracting}
                     onDownloadTemplate={handleDownloadTemplate}
                     isDownloadingTemplate={isDownloadingTemplate}
                     selectedRowNumbers={selectedRowNumbers}
                     onToggleRow={toggleRowSelected}
                     onToggleAll={toggleAllRowsSelected}
                     fileInputResetKey={fileInputResetKey}
                  />
               )}
            </div>

            <div className="mt-6 rounded-xs border border-[#F3DFA0] bg-[#FFF9EC] px-4 py-3 text-sm text-gray-700">
               초기 비밀번호는 <span className="font-bold">1234</span>로 설정되며, 최초 로그인 시
               비밀번호 재설정이 필요합니다.
            </div>

            <div className="mt-6 flex justify-end ">
               <button
                  type="button"
                  disabled={!canSubmit}
                  onClick={isManualTab ? handleManualRegister : handleFileRegister}
                  className={`rounded-xs px-5 py-2 text-sm font-semibold transition-colors ${
                     canSubmit
                        ? 'cursor-pointer bg-brand-green text-white hover:bg-[#4D655A]'
                        : 'cursor-not-allowed bg-[#E5E7EB] text-[#9CA3AF]'
                  }`}
               >
                  {isRegistering
                     ? '등록 중...'
                     : isManualTab
                       ? '등록'
                       : `${selectedFileRows.length}명 등록`}
               </button>
            </div>
         </div>
      </div>,
      document.body,
   );
}
