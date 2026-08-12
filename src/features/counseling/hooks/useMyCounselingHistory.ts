'use client';

import { useEffect, useState } from 'react';
import { ApiError } from '@/lib/http';
import { toast } from '@/lib/toast';
import {
   getConsultationDetail,
   getMyConsultations,
   type ConsultationDetail,
   type MyConsultationSummary,
} from '@/services/counseling.service';

function getApiErrorMessage(err: unknown, fallback: string) {
   return err instanceof ApiError ? err.message : fallback;
}

// 훈련생 "내 상담 이력" - 목록 조회 + 행 클릭 시 상세 조회
export function useMyCounselingHistory() {
   const [items, setItems] = useState<MyConsultationSummary[]>([]);
   const [isLoading, setIsLoading] = useState(true);
   const [loadError, setLoadError] = useState<string | null>(null);

   const [detail, setDetail] = useState<ConsultationDetail | null>(null);
   const [isLoadingDetail, setIsLoadingDetail] = useState(false);

   useEffect(() => {
      let isMounted = true;

      getMyConsultations()
         .then((data) => {
            if (isMounted) setItems(data);
         })
         .catch((err) => {
            if (!isMounted) return;
            setLoadError(
               getApiErrorMessage(
                  err,
                  '상담 이력을 불러오지 못했습니다. 잠시 후 다시 시도해주세요.',
               ),
            );
         })
         .finally(() => {
            if (isMounted) setIsLoading(false);
         });

      return () => {
         isMounted = false;
      };
   }, []);

   const openDetail = async (consultationId: number) => {
      if (isLoadingDetail) return;
      setIsLoadingDetail(true);
      try {
         const data = await getConsultationDetail(consultationId);
         setDetail(data);
      } catch (err) {
         toast.error(getApiErrorMessage(err, '상담 상세 정보를 불러오지 못했습니다.'));
      } finally {
         setIsLoadingDetail(false);
      }
   };

   const closeDetail = () => setDetail(null);

   return { items, isLoading, loadError, detail, isLoadingDetail, openDetail, closeDetail };
}
