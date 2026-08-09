'use client';

import { useEffect, useRef, useState } from 'react';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import { deleteSignature, getSignature, registerSignature } from '@/services/signature.service';

type Props = {
   // 마운트 시 조회 결과 / 등록·삭제 이후 최신 상태를 상위(신청 폼)에 알려줌 - "신청하기" 활성화 조건으로 씀
   onStatusChange?: (hasSignature: boolean) => void;
};

const MAX_FILE_SIZE_BYTES = 1024 * 1024; // 1MB
const ACCEPTED_MIME_TYPES = ['image/png', 'image/jpeg'];

function getApiErrorMessage(err: unknown, fallback: string) {
   return err instanceof ApiError ? err.message : fallback;
}

// 훈련생 휴가 신청 / 강사 구매 예산 신청 등 여러 결재 서류 폼이 공통으로 쓰는 전자 서명 컴포넌트.
// 서명은 서류마다 새로 첨부하는 게 아니라 계정에 하나만 등록해두는 자산이라(활성 서명이 있으면
// 재등록 불가 - 먼저 삭제해야 함), 여기서 조회·등록·삭제 API를 전부 직접 들고 있는다.
export default function SignatureUpload({ onStatusChange }: Props) {
   const inputRef = useRef<HTMLInputElement>(null);
   const [signatureImage, setSignatureImage] = useState<string | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [isSaving, setIsSaving] = useState(false);
   // 더블클릭으로 인한 중복 요청 방지 - state는 비동기라 클릭 시점에 바로 막아줄 동기 가드가 필요
   const isSavingRef = useRef(false);

   useEffect(() => {
      let isMounted = true;

      getSignature()
         .then((data) => {
            if (!isMounted) return;
            setSignatureImage(data.signatureImage);
            onStatusChange?.(true);
         })
         .catch((err) => {
            if (!isMounted) return;
            // 등록된 서명이 없는 것(404)은 정상적인 상태라 에러로 안내하지 않는다
            if (!(err instanceof ApiError && err.status === 404)) {
               toast.error(
                  getApiErrorMessage(
                     err,
                     '전자서명을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
                  ),
               );
            }
            onStatusChange?.(false);
         })
         .finally(() => {
            if (isMounted) setIsLoading(false);
         });

      return () => {
         isMounted = false;
      };
      // 마운트 시 한 번만 조회하면 되고, onStatusChange 참조가 매 렌더 바뀌어도 다시 조회할 필요는 없음
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   const handleRegisterClick = () => inputRef.current?.click();

   const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      event.target.value = ''; // 같은 파일을 다시 선택해도 onChange가 뜨도록 초기화
      if (!file) return;

      if (!ACCEPTED_MIME_TYPES.includes(file.type)) {
         toast.error('전자서명 이미지는 PNG 또는 JPEG 형식만 업로드할 수 있습니다.');
         return;
      }
      if (file.size > MAX_FILE_SIZE_BYTES) {
         toast.error('전자서명 이미지 파일은 1MB 이하만 업로드할 수 있습니다.');
         return;
      }

      if (isSavingRef.current) return;
      isSavingRef.current = true;
      setIsSaving(true);

      try {
         const data = await registerSignature(file);
         setSignatureImage(data.signatureImage);
         onStatusChange?.(true);
      } catch (err) {
         toast.error(
            getApiErrorMessage(
               err,
               '전자서명 등록 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            ),
         );
      } finally {
         isSavingRef.current = false;
         setIsSaving(false);
      }
   };

   const handleDelete = async () => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      setIsSaving(true);

      try {
         await deleteSignature();
         setSignatureImage(null);
         onStatusChange?.(false);
      } catch (err) {
         toast.error(
            getApiErrorMessage(
               err,
               '전자서명 삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            ),
         );
      } finally {
         isSavingRef.current = false;
         setIsSaving(false);
      }
   };

   const isBusy = isLoading || isSaving;

   return (
      <div>
         <label className="text-[15px] font-semibold text-gray-900">
            전자 서명 <span className="font-bold text-[16px] text-brand-gold">*</span>
         </label>

         <div className="mt-2 flex h-35 items-center justify-center overflow-hidden rounded-sm border border-dashed border-[#E5E7EB] bg-[#F9FAFB]">
            {isLoading ? (
               <span className="text-sm text-gray-400">불러오는 중...</span>
            ) : signatureImage ? (
               // eslint-disable-next-line @next/next/no-img-element -- 백엔드가 base64 data URI로 내려줘서 next/image 최적화 대상이 아님
               <img
                  src={signatureImage}
                  alt="등록된 서명 미리보기"
                  className="h-full w-full object-contain"
               />
            ) : (
               <span className="text-sm text-gray-400">서명 파일을 등록해주세요.</span>
            )}
         </div>

         <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-gray-500">
               등록된 서명 파일을 확인하거나 신규 서명 파일을 등록해주세요.
            </p>
            <button
               type="button"
               onClick={signatureImage ? handleDelete : handleRegisterClick}
               disabled={isBusy}
               className={`cursor-pointer rounded-sm px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60 ${
                  signatureImage
                     ? 'bg-brand-maroon text-white hover:bg-brand-red'
                     : 'bg-white border border-brand-green text-brand-green hover:bg-gray-50'
               }`}
            >
               {isSaving ? '처리 중...' : signatureImage ? '삭제' : '신규 등록'}
            </button>
         </div>

         <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg"
            onChange={handleFileChange}
            className="hidden"
         />
      </div>
   );
}
