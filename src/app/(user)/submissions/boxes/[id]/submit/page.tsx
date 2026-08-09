import StudentBoxSubmitClient from '@/features/submissions/components/BoxesTab/StudentBoxSubmitClient';

export default async function SubmissionBoxSubmitPage({
   params,
}: {
   params: Promise<{ id: string }>;
}) {
   const { id } = await params;
   return <StudentBoxSubmitClient boxId={id} />;
}
