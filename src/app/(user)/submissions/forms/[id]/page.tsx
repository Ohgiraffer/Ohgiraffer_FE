import FormDetailClient from '@/features/submissions/components/FormsTab/FormDetailClient';

type Props = {
   params: Promise<{ id: string }>;
};

export default async function SubmissionFormDetailPage({ params }: Props) {
   const { id } = await params;
   return <FormDetailClient formId={id} />;
}
