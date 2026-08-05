import type { AttendanceUnitData, OrgInfoData, WarningCriteriaData } from '../types';

type Props = {
   orgInfo: OrgInfoData;
   attendanceUnit: AttendanceUnitData;
   warningCriteria: WarningCriteriaData;
};

function SummaryField({ label, value }: { label: string; value: string }) {
   return (
      <div className="rounded-xs border border-[#E5E7EB] bg-[#F9FAFB] px-4 py-3">
         <p className="text-[13px] text-[#6B7280]">{label}</p>
         <p className="mt-1 text-[14px] font-semibold text-[#111827]">{value}</p>
      </div>
   );
}

export default function Step4FinalCheckForm({ orgInfo, attendanceUnit, warningCriteria }: Props) {
   return (
      <div className="rounded-sm border border-[#E5E7EB] bg-white px-8 py-10">
         <h2 className="text-xl font-bold text-black">최종 확인</h2>
         <p className="mt-1 text-[14px] text-[#6B7280]">
            입력하신 내용을 확인하고 완료 버튼을 눌러주세요. 이후 관리자 설정에서 수정할 수
            있습니다.
         </p>

         <div className="mt-7">
            <p className="text-[14px] font-semibold text-[#6B7280]">조직·과정 정보</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
               <SummaryField label="조직명" value={orgInfo.orgName || '-'} />
               <SummaryField label="과정명" value={orgInfo.courseName || '-'} />
               <SummaryField label="부트캠프 시작일" value={orgInfo.startDate || '-'} />
               <SummaryField label="부트캠프 종료일" value={orgInfo.endDate || '-'} />
            </div>
         </div>

         <div className="mt-5.5">
            <p className="text-sm font-semibold text-[#6B7280]">출결 단위기간 기준</p>
            <div className="mt-2 grid grid-cols-2 gap-3">
               <SummaryField
                  label="단위기간 수"
                  value={`${attendanceUnit.periods.length}개 설정됨`}
               />
               <SummaryField label="지각·조퇴 환산" value="3회 = 결석 1회 (고정)" />
            </div>
         </div>

         <div className="mt-5.5">
            <p className="text-sm font-semibold text-[#6B7280]">경고·제적 기준</p>
            <div className="mt-2 grid grid-cols-3 gap-3">
               <SummaryField
                  label="주의 기준 출석률"
                  value={warningCriteria.cautionRate ? `${warningCriteria.cautionRate}%` : '-'}
               />
               <SummaryField
                  label="경고 기준 출석률"
                  value={warningCriteria.warningRate ? `${warningCriteria.warningRate}%` : '-'}
               />
               <SummaryField
                  label="제적위험 기준 출석률"
                  value={
                     warningCriteria.expulsionRiskRate
                        ? `${warningCriteria.expulsionRiskRate}%`
                        : '-'
                  }
               />
            </div>
         </div>
      </div>
   );
}
