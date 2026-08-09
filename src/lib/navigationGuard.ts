// 저장하지 않은 변경사항이 있는 페이지(예: 팀 관리)를 벗어나려 할 때 확인을 받기 위한 전역 훅
// 해당 페이지가 마운트되어 있고 변경사항이 있는 동안에만 checker가 등록됨
let checker: (() => boolean) | null = null;

export function setUnsavedChangesChecker(next: (() => boolean) | null) {
   checker = next;
}

export function hasUnsavedChanges() {
   return checker ? checker() : false;
}
