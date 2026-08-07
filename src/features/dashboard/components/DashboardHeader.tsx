'use client';

import { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { getBootcampSettings } from '@/services/bootcampSettings.service';

export default function DashboardHeader() {
   const [bootcampName, setBootcampName] = useState('');

   useEffect(() => {
      let isMounted = true;

      getBootcampSettings()
         .then((data) => {
            if (!isMounted) return;
            setBootcampName(`${data.orgName} - ${data.proName}`);
         })
         .catch(() => {
            // 조회 실패해도 대시보드 전체가 깨지면 안 되니 빈 제목으로 유지
         });

      return () => {
         isMounted = false;
      };
   }, []);

   return (
      <div className="mb-4 ml-1">
         <h1 className="text-xl font-extrabold text-gray-900">{bootcampName}</h1>
         <p className="mt-1 ml-1 flex items-center gap-1.5 text-sm text-gray-500">
            <CalendarDays size={14} />
            {format(new Date(), 'yyyy년 M월 d일 EEEE', { locale: ko })}
         </p>
      </div>
   );
}
