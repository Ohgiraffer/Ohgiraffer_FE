interface AttendanceStatRowProps {
   present: number;
   late: number;
   earlyLeave: number;
   outing: number;
   absent: number;
   vacation: number;
   sickLeave: number;
   // 훈련생 본인 화면은 "일" 단위(출석 87일), 상세 화면 등은 회차 위주라 단위 텍스트만 다르게 받는다
   presentUnit?: string;
   absentUnit?: string;
}

// 출석/지각/조퇴/외출/결석/휴가/병결 7칸 통계 행 - 훈련생 본인 화면과 관리자 상세 화면이 공용으로 쓴다
export default function AttendanceStatRow({
   present,
   late,
   earlyLeave,
   outing,
   absent,
   vacation,
   sickLeave,
   presentUnit = '일',
   absentUnit = '회',
}: AttendanceStatRowProps) {
   const stats = [
      { label: '출석', value: `${present}${presentUnit}` },
      { label: '지각', value: `${late}회` },
      { label: '조퇴', value: `${earlyLeave}회` },
      { label: '외출', value: `${outing}회` },
      { label: '결석', value: `${absent}${absentUnit}` },
      { label: '휴가', value: `${vacation}일` },
      { label: '병결', value: `${sickLeave}일` },
   ];

   return (
      <div className="grid grid-cols-7 divide-x divide-gray-100 rounded-sm border border-gray-200 bg-white">
         {stats.map((stat) => (
            <div key={stat.label} className="flex flex-col items-center gap-1.5 py-4">
               <span className="text-xs text-gray-400">{stat.label}</span>
               <span className="text-lg font-bold text-gray-900">{stat.value}</span>
            </div>
         ))}
      </div>
   );
}
