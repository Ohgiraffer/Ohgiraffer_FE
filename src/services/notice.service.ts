import { apiFetch } from '@/lib/http';

export interface NoticeCategory {
   categoryId: number;
   name: string;
}

// 카테고리 목록 조회 - 전체 role 공용, 없으면 빈 배열
export function getNoticeCategories() {
   return apiFetch<NoticeCategory[]>('/notice-categories');
}

// 카테고리 등록 - 운영진(강사·매니저)만 가능. 이름 중복 시 409(NOTICE_005), 훈련생이 호출 시 403
export function createNoticeCategory(name: string) {
   return apiFetch<NoticeCategory>('/notice-categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
   });
}

// 카테고리 삭제 - 이 카테고리를 쓰는 공지가 하나라도 있으면 409(NOTICE_006), 204 성공
export function deleteNoticeCategory(categoryId: number) {
   return apiFetch<void>(`/notice-categories/${categoryId}`, {
      method: 'DELETE',
   });
}

export interface NoticeListItem {
   noticeId: number;
   categoryId: number;
   categoryName: string;
   title: string;
   authorId: number;
   // 작성자가 탈퇴한 경우 null
   authorName: string | null;
   pinned: boolean;
   // 로그인한 사용자 본인이 이 공지를 확인했는지
   confirmedByMe: boolean;
   createdAt: string;
}

// 공지 목록 조회 - categoryId를 생략하면 전체 조회
export function getNotices(categoryId?: number) {
   const query = categoryId !== undefined ? `?categoryId=${categoryId}` : '';
   return apiFetch<NoticeListItem[]>(`/notices${query}`);
}

export interface NoticeAttachment {
   noticeAttachmentId: number;
   fileName: string;
   fileSizeBytes: number;
   fileType: string;
   // 발급 시점으로부터 5분 후 만료되는 다운로드 주소
   downloadUrl: string;
   uploadedAt: string;
}

export interface NoticeDetail {
   noticeId: number;
   categoryId: number;
   categoryName: string;
   title: string;
   // 이미지 주소가 포함된 HTML 본문
   content: string;
   authorId: number;
   authorName: string | null;
   pinned: boolean;
   visibleToTrainee: boolean;
   confirmationCount: number;
   confirmedByMe: boolean;
   attachments: NoticeAttachment[];
   createdAt: string;
   updatedAt: string;
}

// 공지 상세 조회 - 훈련생은 비공개(visibleToTrainee: false) 공지에 접근 시 404(NOTICE_001)
export function getNoticeDetail(noticeId: number) {
   return apiFetch<NoticeDetail>(`/notices/${noticeId}`);
}

export interface UploadedNoticeAttachment {
   // 공지 등록/수정 요청에 그대로 실어 보낼 값
   fileKey: string;
   fileName: string;
   fileSizeBytes: number;
   fileType: string;
}

// 공지 첨부파일 업로드(작성 중 파일을 고르는 즉시 호출) - 운영진만, 공지당 최대 5개/파일당 10MB.
// 이 호출 하나 안에서 한 건이라도 조건에 걸리면 전부 실패(부분 업로드 없음).
// 개수 제한은 이 호출 단위로만 체크되므로, 누적 개수 제한은 프론트에서 직접 관리해야 함.
// 응답 배열은 보낸 파일 순서와 동일
export function uploadNoticeAttachments(files: File[]) {
   const formData = new FormData();
   files.forEach((file) => formData.append('files', file));
   return apiFetch<UploadedNoticeAttachment[]>('/notices/attachments', {
      method: 'POST',
      body: formData,
   });
}

// 이미 저장된 공지의 첨부파일 삭제(수정 화면에서만 사용 - 작성 중에는 로컬에서만 제거하면 됨).
// 작성자 본인만 가능, 성공 시 204
export function deleteNoticeAttachment(noticeId: number, noticeAttachmentId: number) {
   return apiFetch<void>(`/notices/${noticeId}/attachments/${noticeAttachmentId}`, {
      method: 'DELETE',
   });
}

export interface UploadNoticeImageResponse {
   // 상대 경로로 내려옴 - API_BASE_URL을 붙여서 <img src>에 써야 함. 만료되지 않음
   imageUrl: string;
}

// 본문 이미지 업로드(에디터에 이미지를 삽입하는 즉시 한 장씩 호출) - 운영진만, 장당 5MB, JPG/PNG만
export function uploadNoticeImage(image: File) {
   const formData = new FormData();
   formData.append('image', image);
   return apiFetch<UploadNoticeImageResponse>('/notices/images', {
      method: 'POST',
      body: formData,
   });
}

export interface CreateNoticeRequest {
   categoryId: number;
   title: string;
   // 삽입된 이미지 주소가 포함된 본문 HTML
   content: string;
   // 생략 시 false
   pinned?: boolean;
   // 생략 시 true
   visibleToTrainee?: boolean;
   // 미리 업로드해둔 첨부파일 - uploadNoticeAttachments 응답을 가공 없이 그대로 넣는다
   attachments?: UploadedNoticeAttachment[];
}

export interface CreateNoticeResponse {
   noticeId: number;
   title: string;
   pinned: boolean;
   createdAt: string;
   updatedAt: string;
}

// 공지 등록 - 운영진만. 첨부/본문 이미지는 미리 업로드해두고 그 결과(fileKey 등)만 실어 보낸다
export function createNotice(body: CreateNoticeRequest) {
   return apiFetch<CreateNoticeResponse>('/notices', {
      method: 'POST',
      body: JSON.stringify(body),
   });
}

export interface UpdateNoticeRequest {
   categoryId: number;
   title: string;
   content: string;
   // PUT 특성상 전체 교체라 생략하면 "그대로 유지"가 아니라 기본값(false)으로 저장됨 - 항상 보내야
   // 해서 선택 필드로 두지 않는다(호출부가 실수로 빠뜨리면 컴파일 시점에 바로 걸리게 함)
   pinned: boolean;
   // 생략하면 기본값(true)으로 저장됨(비공개였어도 공개로 바뀜) - 항상 보내야 함
   visibleToTrainee: boolean;
}

export interface UpdateNoticeResponse {
   noticeId: number;
   title: string;
   pinned: boolean;
   createdAt: string;
   updatedAt: string;
}

// 공지 수정 - 작성자 본인만(운영진이어도 남의 공지는 403/NOTICE_003). PUT이라 다섯 필드를 항상 다 보낸다
export function updateNotice(noticeId: number, body: UpdateNoticeRequest) {
   return apiFetch<UpdateNoticeResponse>(`/notices/${noticeId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
   });
}

// 공지 삭제 - 작성자 본인만, 하드 삭제(복구 불가), 성공 시 204
export function deleteNotice(noticeId: number) {
   return apiFetch<void>(`/notices/${noticeId}`, {
      method: 'DELETE',
   });
}

export interface NoticeSummaryItem {
   noticeId: number;
   title: string;
   pinned: boolean;
   createdAt: string;
}

// 대시보드 공지사항 카드 전용 - 최근 고정 공지(3일 이내) + 내가 아직 확인하지 않은 공지.
// 파라미터 없음, 정렬(고정 우선·최신순)과 role별 필터링(훈련생 비공개 제외)은 서버가 처리
export function getNoticeSummary() {
   return apiFetch<NoticeSummaryItem[]>('/notices/summary');
}

export interface ConfirmNoticeResponse {
   noticeId: number;
   confirmationCount: number;
   // 항상 true - 취소하는 API는 없다(한 번 확인하면 되돌릴 수 없음)
   confirmedByMe: boolean;
}

// 공지 확인 처리 - 전체 role 가능(훈련생 포함), 본문 없음. 취소 API가 없어 confirmedByMe가
// true가 되면(또는 상세 조회에서 이미 true로 내려오면) 화면에서 체크박스를 계속 잠가둬야 한다
export function confirmNotice(noticeId: number) {
   return apiFetch<ConfirmNoticeResponse>(`/notices/${noticeId}/confirmation`, {
      method: 'POST',
   });
}
