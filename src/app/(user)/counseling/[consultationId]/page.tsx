import CounselingDetailClient from '@/features/counseling/components/CounselingDetailClient';

type Props = {
   params: Promise<{ consultationId: string }>;
};

export default async function CounselingDetailPage({ params }: Props) {
   const { consultationId } = await params;
   return <CounselingDetailClient consultationId={consultationId} />;
}
