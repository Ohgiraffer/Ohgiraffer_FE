import { apiFetch } from '@/lib/http';

export interface NoticeCategory {
   categoryId: number;
   name: string;
}

// 카테고리 목록 조회 - 전체 role 공용, 없으면 빈 배열
export function getNoticeCategories() {
   return apiFetch<NoticeCategory[]>('/notice-categories');
}

// 카테고리 등록 - 운영진(강사·매니저)만 가능
export function createNoticeCategory(name: string) {
   return apiFetch<NoticeCategory>('/notice-categories', {
      method: 'POST',
      body: JSON.stringify({ name }),
   });
}

// 카테고리 삭제
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
   authorName: string | null;
   pinned: boolean;
   confirmedByMe: boolean;
   createdAt: string;
}

// 공지 목록 조회
export function getNotices(categoryId?: number) {
   const query = categoryId !== undefined ? `?categoryId=${categoryId}` : '';
   return apiFetch<NoticeListItem[]>(`/notices${query}`);
}

export interface NoticeAttachment {
   noticeAttachmentId: number;
   fileName: string;
   fileSizeBytes: number;
   fileType: string;
   downloadUrl: string;
   uploadedAt: string;
}

export interface NoticeDetail {
   noticeId: number;
   categoryId: number;
   categoryName: string;
   title: string;
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
   aiCalendarRegistered: boolean;
}

// 공지 상세 조회
export function getNoticeDetail(noticeId: number) {
   return apiFetch<NoticeDetail>(`/notices/${noticeId}`);
}

export interface UploadedNoticeAttachment {
   fileKey: string;
   fileName: string;
   fileSizeBytes: number;
   fileType: string;
}

// 공지 첨부파일 업로드 - 공지당 최대 5개/파일당 10MB
export function uploadNoticeAttachments(files: File[]) {
   const formData = new FormData();
   files.forEach((file) => formData.append('files', file));
   return apiFetch<UploadedNoticeAttachment[]>('/notices/attachments', {
      method: 'POST',
      body: formData,
   });
}

// 이미 저장된 공지의 첨부파일 삭제
export function deleteNoticeAttachment(noticeId: number, noticeAttachmentId: number) {
   return apiFetch<void>(`/notices/${noticeId}/attachments/${noticeAttachmentId}`, {
      method: 'DELETE',
   });
}

// 이미 저장된 공지에 새 첨부파일 바로 추가
export function addNoticeAttachments(noticeId: number, files: File[]) {
   const formData = new FormData();
   files.forEach((file) => formData.append('files', file));
   return apiFetch<NoticeAttachment[]>(`/notices/${noticeId}/attachments`, {
      method: 'POST',
      body: formData,
   });
}

export interface UploadNoticeImageResponse {
   imageUrl: string;
}

// 본문 이미지 업로드
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
   content: string;
   pinned?: boolean;
   visibleToTrainee?: boolean;
   attachments?: UploadedNoticeAttachment[];
}

export interface CreateNoticeResponse {
   noticeId: number;
   title: string;
   pinned: boolean;
   createdAt: string;
   updatedAt: string;
}

// 공지 등록
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
   pinned: boolean;
   visibleToTrainee: boolean;
}

export interface UpdateNoticeResponse {
   noticeId: number;
   title: string;
   pinned: boolean;
   createdAt: string;
   updatedAt: string;
}

// 공지 수정 - 작성자 본인만
export function updateNotice(noticeId: number, body: UpdateNoticeRequest) {
   return apiFetch<UpdateNoticeResponse>(`/notices/${noticeId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
   });
}

// 공지 삭제 - 작성자 본인만
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

// 공지 확인 처리
export function confirmNotice(noticeId: number) {
   return apiFetch<ConfirmNoticeResponse>(`/notices/${noticeId}/confirmation`, {
      method: 'POST',
   });
}

export type NoticeEventType = 'CLASS' | 'PRESENTATION' | 'ASSIGNMENT' | 'EVENT';

export interface ExtractedScheduleCandidate {
   title: string;
   eventType: NoticeEventType | null;
   startDate: string;
   startTime: string | null;
   endDate: string;
   endTime: string | null;
   location: string | null;
}

// 공지에서 AI로 일정 후보를 추출
export function extractNoticeSchedules(noticeId: number) {
   return apiFetch<ExtractedScheduleCandidate[]>(`/notices/${noticeId}/schedule-extraction`, {
      method: 'POST',
      signal: AbortSignal.timeout(30_000),
   });
}

export interface CalendarEventInput {
   title: string;
   eventType: NoticeEventType;
   startDate: string;
   startTime: string | null;
   endDate: string;
   endTime: string | null;
   location: string | null;
}

export interface RegisterCalendarEventsResponse {
   registeredCount: number;
}

// 모달에서 [이 일정 포함] 캘린더에 등록
export function registerNoticeCalendarEvents(noticeId: number, schedules: CalendarEventInput[]) {
   return apiFetch<RegisterCalendarEventsResponse>(`/notices/${noticeId}/calendar-events`, {
      method: 'POST',
      body: JSON.stringify({ schedules }),
   });
}

export interface AiRewriteKeyResponse {
   apiKey: string;
   model: string;
}

// [AI 문장 개선] 클릭 시 호출
export function getAiRewriteKey() {
   return apiFetch<AiRewriteKeyResponse>('/notices/ai-rewrite-key');
}
