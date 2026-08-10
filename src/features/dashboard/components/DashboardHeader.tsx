'use client';

import { useEffect, useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { ApiError } from '@/lib/http';
import { getBootcampBasicInfo } from '@/services/bootcamp.service';

export default function DashboardHeader() {
   const [bootcampName, setBootcampName] = useState('');
   const [loadError, setLoadError] = useState<string | null>(null);

   useEffect(() => {
      let isMounted = true;

      getBootcampBasicInfo()
         .then((data) => {
            if (!isMounted) return;
            setBootcampName(`${data.orgName} - ${data.proName}`);
         })
         .catch((err) => {
            if (!isMounted) return;
            setLoadError(
               err instanceof ApiError
                  ? err.message
                  : '정보를 불러오지 못했습니다. 다시 한번 시도해주세요.',
            );
         });

      return () => {
         isMounted = false;
      };
   }, []);

   return (
      <div className="mb-4 ml-1">
         <h1
            className={`text-xl font-extrabold ${bootcampName ? 'text-gray-900' : 'text-gray-400'}`}
         >
            {bootcampName || loadError}
         </h1>
         <p className="mt-1 ml-1 flex items-center gap-1.5 text-sm text-gray-500">
            <CalendarDays size={14} />
            {format(new Date(), 'yyyy년 M월 d일 EEEE', { locale: ko })}
         </p>
      </div>
   );
}
