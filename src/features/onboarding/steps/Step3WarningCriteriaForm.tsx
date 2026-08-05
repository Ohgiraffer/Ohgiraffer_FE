'use client';

import type { WarningCriteriaData } from '../types';

type Props = {
   value: WarningCriteriaData;
   onChange: (value: WarningCriteriaData) => void;
};

const FIELDS: Array<{
   key: keyof WarningCriteriaData;
   label: string;
   helperText: string;
}> = [
   {
      key: 'cautionRate',
      label: '주의 기준 출석률',
      helperText: '해당 출석률 미만 시 주의 처리됩니다.',
   },
   {
      key: 'warningRate',
      label: '경고 기준 출석률',
      helperText: '해당 출석률 미만 시 경고 처리됩니다.',
   },
   {
      key: 'expulsionRiskRate',
      label: '제적위험 기준 출석률',
      helperText: '해당 출석률 미만 시 제적위험으로 분류됩니다.',
   },
];

export default function Step3WarningCriteriaForm({ value, onChange }: Props) {
   const updateField = (field: keyof WarningCriteriaData, fieldValue: string) => {
      // max 속성만으로는 직접 타이핑으로 100 초과 입력을 막지 못해 여기서 한 번 더 제한
      const clampedValue = fieldValue !== '' && Number(fieldValue) > 100 ? '100' : fieldValue;
      onChange({ ...value, [field]: clampedValue });
   };

   return (
      <div className="rounded-sm border border-[#E5E7EB] bg-white px-8 py-10">
         <h2 className="text-xl font-bold text-black">경고·제적 기준</h2>
         <p className="mt-1 text-[14px] text-[#6B7280]">
            출석률에 따른 주의·경고·제적위험 기준 출석률을 입력해주세요.
         </p>

         <div className="mt-7 flex flex-col gap-6">
            {FIELDS.map(({ key, label, helperText }) => (
               <div key={key}>
                  <label className="text-[15px] font-semibold text-gray-900">
                     {label} <span className="font-bold text-[16px] text-brand-gold">*</span>
                  </label>
                  <div className="mt-2 flex items-center gap-2">
                     <input
                        type="number"
                        min={0}
                        max={100}
                        value={value[key]}
                        onChange={(e) => updateField(key, e.target.value)}
                        placeholder="0"
                        className="w-30 rounded-xs border border-[#E5E7EB] px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-brand-green"
                     />
                     <span className="text-sm text-[#374151]">%</span>
                  </div>
                  <p className="mt-1 text-xs text-[#9CA3AF]">{helperText}</p>
               </div>
            ))}
         </div>
      </div>
   );
}
