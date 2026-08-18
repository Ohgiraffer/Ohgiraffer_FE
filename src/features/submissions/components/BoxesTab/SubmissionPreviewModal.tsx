'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { getSubmissionItemPreview, type SubmissionItemPreview } from '@/services/submissionBox.service';
import { ApiError } from '@/lib/http';

interface SubmissionPreviewModalProps {
   submissionItemValueId: number;
   onClose: () => void;
}

export default function SubmissionPreviewModal({
   submissionItemValueId,
   onClose,
}: SubmissionPreviewModalProps) {
   const [preview, setPreview] = useState<SubmissionItemPreview | null>(null);
   const [isLoading, setIsLoading] = useState(true);
   const [errorMessage, setErrorMessage] = useState<string | null>(null);

   useEffect(() => {
      let isMounted = true;
      getSubmissionItemPreview(submissionItemValueId)
         .then((data) => {
            if (isMounted) setPreview(data);
         })
         .catch((err) => {
            if (!isMounted) return;
            setErrorMessage(
               err instanceof ApiError && err.code === 'SUBMISSION_019'
                  ? '미리보기를 지원하지 않는 파일입니다. 다운로드해 주세요.'
                  : err instanceof ApiError
                    ? err.message
                    : '미리보기를 불러오지 못했습니다.',
            );
         })
         .finally(() => {
            if (isMounted) setIsLoading(false);
         });
      return () => {
         isMounted = false;
      };
   }, [submissionItemValueId]);

   return (
      <Modal onClose={onClose} ariaLabel="파일 미리보기" panelClassName="w-full max-w-3xl">
         <div className="flex items-center justify-between">
            <h2 className="truncate pr-4 text-base font-bold text-gray-900">
               {preview?.originalFileName ?? '미리보기'}
            </h2>
            <button
               type="button"
               onClick={onClose}
               aria-label="닫기"
               className="shrink-0 cursor-pointer rounded-xs p-1 text-gray-400 hover:bg-gray-100"
            >
               <X size={18} />
            </button>
         </div>

         <div className="mt-4 flex h-[70vh] items-center justify-center overflow-hidden rounded-sm bg-gray-50">
            {isLoading ? (
               <p className="text-sm text-gray-400">불러오는 중...</p>
            ) : errorMessage || !preview ? (
               <p className="px-6 text-center text-sm text-gray-400">{errorMessage}</p>
            ) : preview.contentType === 'application/pdf' ? (
               // 크롬 내장 PDF 뷰어는 sandbox 속성이 붙어있으면 어떤 allow-* 조합을 줘도 아예
               // 활성화되지 않고 빈 화면만 뜬다(직접 확인함 - allow-scripts allow-same-origin을
               // 줘도 load 이벤트는 정상 발생하지만 화면엔 아무것도 안 그려짐). 그래서 sandbox
               // 없이 렌더링한다 - previewUrl은 항상 S3 등 다른 origin이고, 브라우저의 동일 출처
               // 정책 자체가(sandbox와 무관하게) 이 프레임이 우리 앱 origin의 쿠키/스토리지/DOM에
               // 접근하는 걸 막아준다. sandbox가 막아주던 나머지(최상위 창 네비게이션 탈취, 팝업 등)는
               // 이제 못 막지만, previewUrl은 우리 백엔드가 만든 presigned URL이라 임의 사용자가
               // 그 안의 콘텐츠를 바꿔치기할 수 없다
               <iframe
                  src={preview.previewUrl}
                  className="h-full w-full"
                  title={preview.originalFileName}
               />
            ) : preview.contentType.startsWith('video/') ? (
               <video src={preview.previewUrl} controls className="max-h-full max-w-full" />
            ) : preview.contentType.startsWith('image/') ? (
               // eslint-disable-next-line @next/next/no-img-element -- 동적 S3 presigned URL이라 next/image 설정 없이 바로 사용
               <img
                  src={preview.previewUrl}
                  alt={preview.originalFileName}
                  className="max-h-full max-w-full object-contain"
               />
            ) : (
               <p className="px-6 text-center text-sm text-gray-400">
                  미리보기를 지원하지 않는 파일입니다. 다운로드해 주세요.
               </p>
            )}
         </div>
      </Modal>
   );
}
