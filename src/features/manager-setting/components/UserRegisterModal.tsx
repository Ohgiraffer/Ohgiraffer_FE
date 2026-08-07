'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import { registerUsers } from '@/services/user.service';
import ManualEntryTab from '../userRegisterModal/ManualEntryTab';
import FileUploadTab from '../userRegisterModal/FileUploadTab';
import type { ManagerSettingUser, UserDraftRow } from '../types';

type RegisterModalTab = 'manual' | 'file';

type Props = {
   open: boolean;
   onClose: () => void;
   onRegister: (users: ManagerSettingUser[]) => void;
};

function createEmptyDraftRow(): UserDraftRow {
   return { id: crypto.randomUUID(), name: '', email: '', phone: '', role: '훈련생' };
}

function getApiErrorMessage(err: unknown, fallback: string) {
   return err instanceof ApiError ? err.message : fallback;
}

// "사용자 등록" 모달. 이 페이지에서만 쓰는 모달이라 셸(오버레이/닫기 버튼)과 내용을
// 하나의 파일에 같이 둠 - 다른 화면에서 재사용할 모달이 생기면 그때 공용 셸로 다시 분리
export default function UserRegisterModal({ open, onClose, onRegister }: Props) {
   const [activeTab, setActiveTab] = useState<RegisterModalTab>('manual');
   const [rows, setRows] = useState<UserDraftRow[]>([]);
   const [selectedFile, setSelectedFile] = useState<File | null>(null);
   const [isRegistering, setIsRegistering] = useState(false);
   // 더블클릭으로 인한 중복 등록 방지 - state는 비동기라 클릭 시점에 바로 막아줄 동기 가드가 필요
   const isRegisteringRef = useRef(false);

   const addRow = () => setRows((prev) => [...prev, createEmptyDraftRow()]);
   const removeRow = (id: string) => setRows((prev) => prev.filter((row) => row.id !== id));
   const updateRow = (id: string, field: keyof Omit<UserDraftRow, 'id'>, value: string) => {
      setRows((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
   };

   const isManualValid =
      rows.length > 0 &&
      rows.every((row) => row.name.trim() && row.email.trim() && row.phone.trim() && row.role);

   const resetAndClose = () => {
      setActiveTab('manual');
      setRows([]);
      setSelectedFile(null);
      onClose();
   };

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

         // 회원 목록 조회 API는 아직 준비되지 않아(하드코딩) 등록된 값을 화면에도 바로 반영해둔다
         const newUsers: ManagerSettingUser[] = rows.map((row) => ({
            id: crypto.randomUUID(),
            name: row.name,
            email: row.email,
            role: row.role,
            team: null,
            status: '활성',
         }));

         toast.success(`${newUsers.length}명이 등록되었습니다.`);
         onRegister(newUsers);
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

   // open은 항상 false로 시작해서(useState(false)) 최초 서버 렌더링 시엔 이 아래로 내려가지 않음 -
   // document.body를 쓰는 포탈은 open이 true가 된 이후(=클라이언트 상호작용 이후)에만 실행됨
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
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [open]);

   if (!open) return null;

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
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-sm bg-white p-8 shadow-lg"
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
               {activeTab === 'manual' ? (
                  <ManualEntryTab
                     rows={rows}
                     onAddRow={addRow}
                     onRemoveRow={removeRow}
                     onUpdateRow={updateRow}
                     disabled={isRegistering}
                  />
               ) : (
                  <FileUploadTab selectedFile={selectedFile} onFileSelect={setSelectedFile} />
               )}
            </div>

            <div className="mt-6 rounded-xs border border-[#F3DFA0] bg-[#FFF9EC] px-4 py-3 text-sm text-gray-700">
               초기 비밀번호는 <span className="font-bold">1234</span>로 설정되며, 최초 로그인 시
               비밀번호 재설정이 필요합니다.
            </div>

            <div className="mt-6 flex justify-end ">
               {activeTab === 'manual' ? (
                  <button
                     type="button"
                     disabled={!isManualValid || isRegistering}
                     onClick={handleManualRegister}
                     className={`rounded-xs px-5 py-2 text-sm font-semibold transition-colors ${
                        isManualValid && !isRegistering
                           ? 'cursor-pointer bg-brand-green text-white hover:bg-[#4D655A]'
                           : 'cursor-not-allowed bg-[#E5E7EB] text-[#9CA3AF]'
                     }`}
                  >
                     {/* 이 버튼도 파일 업로드 처럼 등록 명 수 반영 버튼으로 교체 예정 */}
                     {isRegistering ? '등록 중...' : '등록'}
                  </button>
               ) : (
                  <button
                     type="button"
                     disabled
                     // TODO: 실제 파일 파싱/검증 붙으면 유효한 행 수로 라벨과 활성화 여부 연결
                     className="cursor-not-allowed rounded-xs bg-[#E5E7EB] px-5 py-2 text-sm font-semibold text-[#9CA3AF]"
                  >
                     0명 등록
                  </button>
               )}
            </div>
         </div>
      </div>,
      document.body,
   );
}
