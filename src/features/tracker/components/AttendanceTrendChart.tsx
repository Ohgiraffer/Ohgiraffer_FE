import type { PresentAbsentCountPoint } from '@/services/attendance.service';

// 이 프로젝트엔 별도 차트 라이브러리가 없어(recharts 등 미설치), 다른 화면들처럼 손으로 그린
// SVG로 간단히 표현한다. 데이터가 많아지면 그때 라이브러리 도입을 검토
export default function AttendanceTrendChart({ data }: { data: PresentAbsentCountPoint[] }) {
   const width = 900;
   const height = 220;
   const paddingX = 32;
   const paddingY = 24;
   // 전체 훈련생 수에 따라 그래프 상한이 달라지므로, 실제 값 중 최댓값을 기준으로 5칸 격자를 만든다
   const rawMax = Math.max(1, ...data.flatMap((point) => [point.presentCount, point.absentCount]));
   const maxY = Math.ceil(rawMax / 5) * 5 || 5;
   const gridValues = [0, 1, 2, 3, 4].map((step) => (maxY / 4) * step);

   const xStep = data.length > 1 ? (width - paddingX * 2) / (data.length - 1) : 0;
   const yScale = (value: number) =>
      height - paddingY - (Math.min(value, maxY) / maxY) * (height - paddingY * 2);

   const toPoints = (accessor: (point: PresentAbsentCountPoint) => number) =>
      data.map((point, index) => `${paddingX + index * xStep},${yScale(accessor(point))}`).join(' ');

   const formatDateLabel = (date: string) => date.slice(5).replace('-', '/');

   return (
      <div>
         <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1.5">
               <span className="h-2 w-2 rounded-full bg-gray-900" />
               출석
            </span>
            <span className="flex items-center gap-1.5">
               <span className="h-2 w-2 rounded-full bg-brand-red" />
               결석
            </span>
         </div>

         <svg
            viewBox={`0 0 ${width} ${height}`}
            className="mt-3 h-auto w-full"
            preserveAspectRatio="none"
            role="img"
            aria-label="일별 출석/결석 추이"
         >
            {gridValues.map((value) => (
               <g key={value}>
                  <line
                     x1={paddingX}
                     x2={width - paddingX}
                     y1={yScale(value)}
                     y2={yScale(value)}
                     stroke="#F3F4F6"
                  />
                  <text x={4} y={yScale(value) + 4} fontSize={11} fill="#9CA3AF">
                     {Math.round(value)}
                  </text>
               </g>
            ))}

            <polyline points={toPoints((p) => p.absentCount)} fill="none" stroke="#C0392B" strokeWidth={2} />
            <polyline points={toPoints((p) => p.presentCount)} fill="none" stroke="#111827" strokeWidth={2} />

            {data.map((point, index) => (
               <circle
                  key={`present-${point.date}`}
                  cx={paddingX + index * xStep}
                  cy={yScale(point.presentCount)}
                  r={3}
                  fill="#111827"
               />
            ))}
            {data.map((point, index) => (
               <circle
                  key={`absent-${point.date}`}
                  cx={paddingX + index * xStep}
                  cy={yScale(point.absentCount)}
                  r={3}
                  fill="#C0392B"
               />
            ))}
            {data.map((point, index) => (
               <text
                  key={`label-${point.date}`}
                  x={paddingX + index * xStep}
                  y={height - 6}
                  fontSize={10}
                  textAnchor="middle"
                  fill="#9CA3AF"
               >
                  {formatDateLabel(point.date)}
               </text>
            ))}
         </svg>
      </div>
   );
}
