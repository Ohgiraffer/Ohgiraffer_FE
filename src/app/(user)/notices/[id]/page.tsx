import NoticeDetailClient from '@/features/notices/components/NoticeDetail/NoticeDetailClient';

type Props = {
   params: Promise<{ id: string }>;
};

export default async function NoticeDetailPage({ params }: Props) {
   const { id } = await params;
   return <NoticeDetailClient noticeId={id} />;
}
