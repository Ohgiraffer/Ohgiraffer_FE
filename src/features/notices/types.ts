export type NoticeCategory = {
   id: string;
   name: string;
};

export type ConfirmStatus = '완료' | '미완료';

export type NoticeAttachment = {
   name: string;
   sizeBytes: number;
};

export type NoticeEntry = {
   id: string;
   title: string;
   category: string;
   author: string;
   createdAt: string;
   isPinned: boolean;
   confirmStatus: ConfirmStatus;
   // 상세 조회 페이지 전용 필드 - 목록에서는 사용하지 않음
   contentHtml: string;
   attachments: NoticeAttachment[];
   confirmedCount: number;
   visibility: NoticeVisibility;
};

export type NoticeVisibility = 'public' | 'private';

export type NoticeDraft = {
   title: string;
   category: string;
   isRequired: boolean;
   visibility: NoticeVisibility;
   contentHtml: string;
   attachedFiles: File[];
};
