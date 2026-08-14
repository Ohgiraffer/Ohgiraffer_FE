'use client';

import { useEffect, useRef, useState } from 'react';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import { deleteSignature, getSignature, registerSignature } from '@/services/signature.service';

type Props = {
   onStatusChange?: (hasSignature: boolean) => void;
};

const MAX_FILE_SIZE_BYTES = 1024 * 1024; // 1MB
const ACCEPTED_MIME_TYPES = ['image/png', 'image/jpeg'];

function getApiErrorMessage(err: unknown, fallback: string) {
   return err instanceof ApiError ? err.message : fallback;
}

// 전자 서명(학생-휴가신청/강사-구매예산신청)
export default function SignatureUpload({ onStatusChange }: Props) {
   const inputRef = useRef<HTMLInputElement>(null);
   const [signatureImage, setSignatureImage] = useState<string | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [isSaving, setIsSaving] = useState(false);
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
   }, []);

   const handleRegisterClick = () => inputRef.current?.click();

   const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null;
      event.target.value = '';
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
               <img
                  src={signatureImage}
                  alt="등록된 서명 미리보기"
                  className="h-full w-full object-contain"
               />
            ) : (
               <span className="text-sm text-gray-400">서명 파일을 등록해주세요.</span>
            )}
         </div>

         <div className="mt-1.5 flex items-center justify-between">
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
