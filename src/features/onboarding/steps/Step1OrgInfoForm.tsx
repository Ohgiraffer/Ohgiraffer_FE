'use client';

import OrgInfoFields from '@/features/bootcamp-settings/components/OrgInfoFields';
import type { OrgInfoData } from '../types';

type Props = {
   value: OrgInfoData;
   onChange: (value: OrgInfoData) => void;
   dateOrderError?: boolean;
};

export default function Step1OrgInfoForm({ value, onChange, dateOrderError }: Props) {
   return (
      <div className="rounded-sm border border-[#E5E7EB] bg-white px-8 py-10">
         <h2 className="text-xl font-bold text-black">조직·과정 정보</h2>
         <p className="mt-1 text-[14px] text-[#6B7280]">
            운영 기관과 부트캠프 과정의 기본 정보를 입력해주세요.
         </p>

         <div className="mt-7">
            <OrgInfoFields value={value} onChange={onChange} dateOrderError={dateOrderError} />
         </div>
      </div>
   );
}
