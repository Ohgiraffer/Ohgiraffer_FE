import TraineeDetailClient from '@/features/tracker/components/TraineeDetail/TraineeDetailClient';

type Props = {
   params: Promise<{ traineeId: string }>;
};

export default async function TraineeDetailPage({ params }: Props) {
   const { traineeId } = await params;
   return <TraineeDetailClient traineeId={traineeId} />;
}
