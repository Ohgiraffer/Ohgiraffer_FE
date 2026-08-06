import NoticeWriteClient from '@/features/notices/components/NoticeWrite/NoticeWriteClient';

type Props = {
   params: Promise<{ id: string }>;
};

export default async function NoticeEditPage({ params }: Props) {
   const { id } = await params;
   return <NoticeWriteClient noticeId={id} />;
}
