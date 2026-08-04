import OnboardingHeader from '@/features/onboarding/components/OnboardingHeader';
import OnboardingWizardClient from '@/features/onboarding/components/OnboardingWizardClient';

export default function OnboardingWizardPage() {
   return (
      <div className="flex min-h-screen flex-col">
         <OnboardingHeader />
         <OnboardingWizardClient />
      </div>
   );
}
