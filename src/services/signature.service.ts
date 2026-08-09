import { apiFetch } from '@/lib/http';

export interface SignatureResponse {
   signatureId: number;
   // Base64 Data URI 형식 (예: "data:image/png;base64,...")
   signatureImage: string;
   originalFileName: string;
   fileSizeBytes: number;
   fileType: string;
   active: boolean;
   updatedAt: string;
}

// 로그인한 사용자의 활성 전자서명 조회 - 등록된 서명이 없으면 404
export function getSignature() {
   return apiFetch<SignatureResponse>('/signatures');
}

// 전자서명 등록 - 활성 서명이 없을 때만 가능(있으면 409), 재등록하려면 먼저 삭제해야 함
export function registerSignature(file: File) {
   const formData = new FormData();
   formData.append('file', file);
   return apiFetch<SignatureResponse>('/signatures', {
      method: 'POST',
      body: formData,
   });
}

// 전자서명 삭제(실제로는 비활성화 처리) - 성공 시 204
export function deleteSignature() {
   return apiFetch<void>('/signatures', {
      method: 'DELETE',
   });
}
