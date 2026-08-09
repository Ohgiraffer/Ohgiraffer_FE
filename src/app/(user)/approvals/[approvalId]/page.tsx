import ApprovalDetailClient from '@/features/approvals/components/ApprovalDetailClient';

type Props = {
   params: Promise<{ approvalId: string }>;
};

export default async function ApprovalDetailPage({ params }: Props) {
   const { approvalId } = await params;
   return <ApprovalDetailClient approvalId={approvalId} />;
}
