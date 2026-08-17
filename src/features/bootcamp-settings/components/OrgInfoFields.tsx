'use client';

import { DatePicker } from '@/components/ui/date-picker';
import type { BootcampOrgInfo } from '../types';

type Props = {
   value: BootcampOrgInfo;
   onChange: (value: BootcampOrgInfo) => void;
   dateOrderError?: boolean;
};

export default function OrgInfoFields({ value, onChange, dateOrderError }: Props) {
   const updateField = (field: keyof BootcampOrgInfo, fieldValue: string) => {
      onChange({ ...value, [field]: fieldValue });
   };

   return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
         <div>
            <label className="text-[15px] font-semibold text-gray-900">
               조직명 <span className="font-bold text-[16px] text-brand-gold">*</span>
            </label>
            <input
               type="text"
               value={value.orgName}
               onChange={(e) => updateField('orgName', e.target.value)}
               placeholder="조직명을 입력해주세요"
               className="mt-2 w-full rounded-sm border border-[#E5E7EB] px-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-green"
            />
         </div>
         <div>
            <label className="text-[15px] font-semibold text-gray-900">
               과정명 <span className="font-bold text-[16px] text-brand-gold">*</span>
            </label>
            <input
               type="text"
               value={value.courseName}
               onChange={(e) => updateField('courseName', e.target.value)}
               placeholder="부트캠프 과정명을 입력해주세요."
               className="mt-2 w-full rounded-sm border border-[#E5E7EB] px-4 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-brand-green"
            />
         </div>
         <div>
            <label className="text-[15px] font-semibold text-gray-900">
               부트캠프 시작일 <span className="font-bold text-[16px] text-brand-gold">*</span>
            </label>
            <DatePicker
               value={value.startDate}
               onChange={(nextValue) => updateField('startDate', nextValue)}
               className="mt-2"
            />
         </div>
         <div>
            <label className="text-[15px] font-semibold text-gray-900">
               부트캠프 종료일 <span className="font-bold text-[16px] text-brand-gold">*</span>
            </label>
            <DatePicker
               value={value.endDate}
               onChange={(nextValue) => updateField('endDate', nextValue)}
               className="mt-2"
            />
            <p
               className={`mt-1 text-xs text-brand-red ${dateOrderError ? 'visible' : 'invisible'}`}
            >
               종료일은 시작일보다 빠를 수 없습니다.
            </p>
         </div>
      </div>
   );
}
