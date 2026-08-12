import SyncLogDetailClient from '@/features/evaluations/components/SyncLogDetailClient';

type Props = {
   params: Promise<{ syncLogId: string }>;
};

export default async function SyncLogDetailPage({ params }: Props) {
   const { syncLogId } = await params;
   return <SyncLogDetailClient syncLogId={syncLogId} />;
}
