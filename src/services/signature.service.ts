import { apiFetch } from '@/lib/http';

export interface SignatureResponse {
   signatureId: number;
   signatureImage: string;
   originalFileName: string;
   fileSizeBytes: number;
   fileType: string;
   active: boolean;
   updatedAt: string;
}

// 로그인한 사용자의 전자서명 조회
export function getSignature() {
   return apiFetch<SignatureResponse>('/signatures');
}

// 전자서명 등록
export function registerSignature(file: File) {
   const formData = new FormData();
   formData.append('file', file);
   return apiFetch<SignatureResponse>('/signatures', {
      method: 'POST',
      body: formData,
   });
}

// 전자서명 삭제
export function deleteSignature() {
   return apiFetch<void>('/signatures', {
      method: 'DELETE',
   });
}
