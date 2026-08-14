import { apiFetch } from '@/lib/http';

export interface BootcampSettingsPeriod {
   id: number;
   periodNo: number;
   periodStart: string;
   periodEnd: string;
}

export interface BootcampSettingsResponse {
   bootcampId: number;
   orgName: string;
   proName: string;
   startDate: string;
   endDate: string;
   periods: BootcampSettingsPeriod[];
}

// 관리자 설정 "조직·출결" 탭 진입 시 현재 저장된 부트캠프 정보·단위기간 조회
export function getBootcampSettings() {
   return apiFetch<BootcampSettingsResponse>('/bootcamp/settings');
}

export interface UpdateBootcampSettingsPeriod {
   periodNo: number;
   periodStart: string;
   periodEnd: string;
}

export interface UpdateBootcampSettingsPayload {
   orgName: string;
   proName: string;
   startDate: string;
   endDate: string;
   periods: UpdateBootcampSettingsPeriod[];
}

export function updateBootcampSettings(body: UpdateBootcampSettingsPayload) {
   return apiFetch<void>('/bootcamp/settings', {
      method: 'PATCH',
      body: JSON.stringify(body),
   });
}

export interface BootcampSettingsLogEntry {
   changedByName: string;
   changedAt: string;
   changedField: string;
   oldValue: string;
   newValue: string;
}

export interface BootcampSettingsLogsResponse {
   logs: BootcampSettingsLogEntry[];
}

// 관리자 설정 "변경 이력" 탭 - 조직·출결 설정이 바뀐 내역 조회
export function getBootcampSettingsLogs() {
   return apiFetch<BootcampSettingsLogsResponse>('/bootcamp/settings/logs');
}
