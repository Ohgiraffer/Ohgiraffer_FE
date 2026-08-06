'use client';

import { useEffect, useRef, useState } from 'react';
import { Trash2, Upload, User, X } from 'lucide-react';
import { Button } from '@/components/ui/shadcn/button';
import { deleteProfileImage, uploadProfileImage } from '@/services/auth.service';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';

// 화면 시안 기준 5MB. 백엔드 에러 문구엔 100MB, 이전 정책 문서엔 50MB로 각각 다르게 적혀있어
// 실제 제한값이 무엇인지 백엔드 확인이 필요하다 (일단 시안에 맞춰 5MB로 클라이언트 검증한다).
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_TYPES = ['image/jpeg', 'image/png'];

function revokeIfBlobUrl(url: string | null) {
   if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
}

interface ProfileImageModalProps {
   currentImageUrl: string | null;
   onClose: () => void;
   onUploaded: (url: string | null) => void;
}

export default function ProfileImageModal({
   currentImageUrl,
   onClose,
   onUploaded,
}: ProfileImageModalProps) {
   const fileInputRef = useRef<HTMLInputElement>(null);
   const [file, setFile] = useState<File | null>(null);
   const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl);
   const [fileError, setFileError] = useState('');
   const [isSaving, setIsSaving] = useState(false);
   const [isDeleting, setIsDeleting] = useState(false);
   const isSavingRef = useRef(false);
   const isDeletingRef = useRef(false);
   // 언마운트 시에도 마지막 blob URL을 해제할 수 있도록 최신 값을 ref로도 들고 있는다
   const previewUrlRef = useRef(previewUrl);
   useEffect(() => {
      previewUrlRef.current = previewUrl;
   }, [previewUrl]);

   useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
         if (event.key === 'Escape') onClose();
      };
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      return () => {
         document.removeEventListener('keydown', handleKeyDown);
         document.body.style.overflow = '';
         revokeIfBlobUrl(previewUrlRef.current);
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const selected = e.target.files?.[0] ?? null;
      e.target.value = ''; // 같은 파일을 다시 선택해도 onChange가 뜨도록 초기화

      if (!selected) return;

      if (!ACCEPTED_TYPES.includes(selected.type)) {
         resetToCurrentImage();
         setFileError('JPG, PNG 형식만 업로드할 수 있습니다.');
         return;
      }
      if (selected.size > MAX_FILE_SIZE) {
         resetToCurrentImage();
         setFileError('파일 용량은 5MB를 초과할 수 없습니다.');
         return;
      }

      revokeIfBlobUrl(previewUrl);
      setFileError('');
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
   };

   // file/previewUrl만 되돌린다 (fileError는 호출하는 쪽에서 각자 상황에 맞게 처리)
   const resetToCurrentImage = () => {
      revokeIfBlobUrl(previewUrl);
      setFile(null);
      setPreviewUrl(currentImageUrl);
   };

   const handleRemoveSelection = () => {
      resetToCurrentImage();
      setFileError('');
   };

   const handleDelete = async () => {

      if (file) {
         handleRemoveSelection();
         return;
      }

      if (!currentImageUrl || isDeletingRef.current) return;

      isDeletingRef.current = true;
      setIsDeleting(true);
      try {
         await deleteProfileImage();
         toast.success('프로필 사진이 삭제되었습니다.');
         setPreviewUrl(null);
         onUploaded(null);
      } catch (err) {
         toast.error(
            err instanceof ApiError
               ? err.message
               : '삭제 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
         );
      } finally {
         isDeletingRef.current = false;
         setIsDeleting(false);
      }
   };

   const handleSave = async () => {
      if (!file || isSavingRef.current) return;

      isSavingRef.current = true;
      setIsSaving(true);
      try {
         const data = await uploadProfileImage(file);
         toast.success('프로필 사진이 변경되었습니다.');
         onUploaded(data.profileImgUrl);
         onClose();
      } catch (err) {
         toast.error(
            err instanceof ApiError
               ? err.message
               : '업로드 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
         );
      } finally {
         isSavingRef.current = false;
         setIsSaving(false);
      }
   };

   return (
      <div
         className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
         onClick={onClose}
      >
         <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-image-modal-title"
            className="w-full max-w-sm rounded-sm bg-white p-6"
            onClick={(e) => e.stopPropagation()}
         >
            <div className="mb-6 flex items-center justify-between">
               <h2 id="profile-image-modal-title" className="text-base font-bold text-gray-900">
                  프로필 사진 등록
               </h2>
               <button type="button" onClick={onClose} aria-label="닫기" className="cursor-pointer">
                  <X size={18} className="text-gray-400" />
               </button>
            </div>

            <div className="flex flex-col items-center">
               <span className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-2 text-gray-300 bg-white">
                  {previewUrl ? (
                     // eslint-disable-next-line @next/next/no-img-element
                     <img
                        src={previewUrl}
                        alt="프로필 사진 미리보기"
                        className="h-full w-full object-cover"
                     />
                  ) : (
                     <User size={60} strokeWidth={1.5} />
                  )}
               </span>
               {previewUrl && (
                  <button
                     type="button"
                     onClick={handleDelete}
                     disabled={isDeleting}
                     className="mt-4 -mb-1 flex cursor-pointer items-center gap-1 text-xs text-brand-red transition-all hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                  >
                     <Trash2 size={12} />
                     {isDeleting ? '삭제 중...' : '등록 사진 삭제'}
                  </button>
               )}
            </div>

            <button
               type="button"
               onClick={() => fileInputRef.current?.click()}
               className="mt-6 flex w-full cursor-pointer flex-col items-center gap-1.5 rounded-sm border border-gray-200 py-6 text-sm text-gray-500 transition-colors hover:border-gray-300 hover:bg-gray-50"
            >
               <Upload size={20} className="text-gray-400" />
               클릭하여 이미지 업로드
               <span className="text-xs text-gray-400">JPG, PNG · 최대 5MB</span>
            </button>
            <input
               ref={fileInputRef}
               type="file"
               accept="image/jpeg,image/png"
               onChange={handleFileChange}
               className="hidden"
            />
            {fileError && <p className="mt-2 text-xs text-brand-red">{fileError}</p>}

            <Button
               type="button"
               onClick={handleSave}
               disabled={!file || isSaving || isDeleting}
               className={`mt-6 h-10 w-full text-sm ${
                  file
                     ? 'bg-brand-green text-white hover:bg-[#4D655A]'
                     : 'bg-gray-200 text-gray-400'
               }`}
            >
               {isSaving ? '저장 중...' : '저장'}
            </Button>
         </div>
      </div>
   );
}
