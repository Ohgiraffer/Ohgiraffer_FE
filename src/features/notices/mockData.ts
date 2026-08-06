import type { NoticeCategory, NoticeEntry } from './types';

// 백엔드 API 연동 전까지 화면 확인용으로 쓰는 더미 데이터
export const MOCK_NOTICE_CATEGORIES: NoticeCategory[] = [
   { id: 'category-1', name: '수업' },
   { id: 'category-2', name: '과제' },
   { id: 'category-3', name: '운영' },
   { id: 'category-4', name: '지원' },
];

export const MOCK_NOTICES: NoticeEntry[] = [
   {
      id: 'notice-1',
      title: '7월 중간 평가 일정 안내',
      category: '수업',
      author: '박강사',
      createdAt: '2025.07.30',
      isPinned: true,
      confirmStatus: '완료',
      visibility: 'public',
      contentHtml:
         '<p>안녕하세요, 수강생 여러분.</p>' +
         '<p>7월 중간 평가 일정을 아래와 같이 안내 드립니다. 반드시 확인하시고 준비해주시기 바랍니다.</p>' +
         '<p><strong>■ 평가 일정</strong></p>' +
         '<ul>' +
         '<li><p>1차 개인 코딩 테스트 — 2025년 8월 5일 (화) 오전 10:00~12:00</p></li>' +
         '<li><p>2차 팀 발표 — 2025년 8월 7일 (목) 오후 14:00~17:00</p></li>' +
         '<li><p>자기 평가 및 동료 평가 — 2025년 8월 8일 (금) 오전 중</p></li>' +
         '</ul>' +
         '<p>평가 관련 문의사항이 있으시면 채팅으로 연락주시기 바랍니다.</p>',
      attachments: [
         { name: '중간평가_안내문.pdf', sizeBytes: 238 * 1024 },
         { name: '평가기준표.xlsx', sizeBytes: 94 * 1024 },
      ],
      confirmedCount: 11,
   },
   {
      id: 'notice-2',
      title: '8월 휴강일 공지',
      category: '운영',
      author: '이매니저',
      createdAt: '2025.07.28',
      isPinned: true,
      confirmStatus: '미완료',
      visibility: 'public',
      contentHtml:
         '<p>8월 15일(금)은 광복절 휴일로 휴강입니다.</p>' +
         '<p>해당 주차 커리큘럼은 다음 주로 순연되니 일정 참고 부탁드립니다.</p>',
      attachments: [],
      confirmedCount: 6,
   },
   {
      id: 'notice-3',
      title: '발표자료 제출 마감 연장 안내',
      category: '과제',
      author: '박강사',
      createdAt: '2025.07.29',
      isPinned: false,
      confirmStatus: '미완료',
      visibility: 'public',
      contentHtml:
         '<p>팀 프로젝트 발표자료 제출 마감을 7월 31일(목) 오후 6시로 연장합니다.</p>' +
         '<p>제출 방법은 기존 안내와 동일합니다.</p>',
      attachments: [{ name: '발표자료_제출가이드.docx', sizeBytes: 156 * 1024 }],
      confirmedCount: 4,
   },
   {
      id: 'notice-4',
      title: '팀 프로젝트 발표 순서 공지',
      category: '수업',
      author: '박강사',
      createdAt: '2025.07.26',
      isPinned: false,
      confirmStatus: '완료',
      visibility: 'public',
      contentHtml:
         '<p>팀 프로젝트 발표 순서를 아래와 같이 안내드립니다.</p>' +
         '<ul>' +
         '<li><p>1팀 → 2팀 → 3팀 → 4팀 순으로 진행됩니다.</p></li>' +
         '<li><p>팀당 발표 15분, 질의응답 5분입니다.</p></li>' +
         '</ul>',
      attachments: [],
      confirmedCount: 12,
   },
   {
      id: 'notice-5',
      title: '7월 넷째 주 주간 회의록',
      category: '운영',
      author: '이매니저',
      createdAt: '2025.07.25',
      isPinned: false,
      confirmStatus: '완료',
      visibility: 'public',
      contentHtml: '<p>7월 넷째 주 운영진 회의록을 공유드립니다. 첨부파일을 확인해주세요.</p>',
      attachments: [{ name: '주간회의록_0725.pdf', sizeBytes: 312 * 1024 }],
      confirmedCount: 5,
   },
   {
      id: 'notice-6',
      title: 'AWS 크레딧 신청 안내',
      category: '지원',
      author: '이매니저',
      createdAt: '2025.07.22',
      isPinned: false,
      confirmStatus: '미완료',
      visibility: 'public',
      contentHtml:
         '<p>실습용 AWS 크레딧 신청을 받습니다. 필요하신 분은 첨부된 신청서를 작성해 제출해주세요.</p>',
      attachments: [{ name: 'AWS_크레딧_신청서.xlsx', sizeBytes: 48 * 1024 }],
      confirmedCount: 9,
   },
   {
      id: 'notice-7',
      title: '알고리즘 특강 일정 변경 안내',
      category: '수업',
      author: '박강사',
      createdAt: '2025.07.18',
      isPinned: false,
      confirmStatus: '완료',
      visibility: 'public',
      contentHtml:
         '<p>알고리즘 특강 일정이 8월 4일(월) 오후 2시로 변경되었습니다. 참고 부탁드립니다.</p>',
      attachments: [],
      confirmedCount: 13,
   },
   {
      id: 'notice-8',
      title: '노트북 대여 신청 안내',
      category: '지원',
      author: '이매니저',
      createdAt: '2025.07.15',
      isPinned: false,
      confirmStatus: '미완료',
      visibility: 'public',
      contentHtml:
         '<p>개인 노트북 지참이 어려운 분들을 위해 대여용 노트북을 운영합니다.</p>' +
         '<p>대여를 원하시는 분은 첨부된 신청서를 작성해 제출해주세요.</p>',
      attachments: [{ name: '노트북_대여신청서.hwp', sizeBytes: 62 * 1024 }],
      confirmedCount: 3,
   },
];
