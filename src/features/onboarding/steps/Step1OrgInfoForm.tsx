'use client';

import { DatePicker } from '@/components/ui/date-picker';
import type { OrgInfoData } from '../types';

type Props = {
   value: OrgInfoData;
   onChange: (value: OrgInfoData) => void;
   dateOrderError?: boolean;
};

export default function Step1OrgInfoForm({ value, onChange, dateOrderError }: Props) {
   const updateField = (field: keyof OrgInfoData, fieldValue: string) => {
      onChange({ ...value, [field]: fieldValue });
   };

   return (
      <div className="rounded-sm border border-[#E5E7EB] bg-white px-8 py-10">
         <h2 className="text-xl font-bold text-black">조직·과정 정보</h2>
         <p className="mt-1 text-[14px] text-[#6B7280]">
            운영 기관과 부트캠프 과정의 기본 정보를 입력해주세요.
         </p>

         <div className="mt-7 grid grid-cols-2 gap-6">
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
                  과정명 <span className="font-bold text-[16px]  text-brand-gold">*</span>
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
      </div>
   );
}
