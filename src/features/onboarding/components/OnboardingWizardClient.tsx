'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthContext';
import { ONBOARDING_TOTAL_STEPS } from '../types';
import { useOnboardingWizard } from '../hooks/useOnboardingWizard';
import Step1OrgInfoForm from '../steps/Step1OrgInfoForm';
import Step2AttendanceUnitForm from '../steps/Step2AttendanceUnitForm';
import Step3WarningCriteriaForm from '../steps/Step3WarningCriteriaForm';
import Step4FinalCheckForm from '../steps/Step4FinalCheckForm';
import OnboardingSteps from './OnboardingSteps';

export default function OnboardingWizardClient() {
   const router = useRouter();
   const { bootcampId, isInitializing } = useAuth();
   const isAlreadyOnboarded = !isInitializing && bootcampId !== null;

   useEffect(() => {
      if (isAlreadyOnboarded) router.replace('/');
   }, [isAlreadyOnboarded, router]);

   const {
      currentStep,
      isCurrentStepValid,
      goToNextStep,
      goToPreviousStep,
      completeOnboarding,
      isSavingOrgInfo,
      isCompleting,
      orgInfo,
      setOrgInfo,
      attendanceUnit,
      setAttendanceUnit,
      warningCriteria,
      setWarningCriteria,
      orgInfoDateError,
      attendanceUnitPeriodErrors,
   } = useOnboardingWizard();

   if (isInitializing || isAlreadyOnboarded) return null;

   const isLastStep = currentStep === ONBOARDING_TOTAL_STEPS;
   const isSubmitting = isSavingOrgInfo || isCompleting;

   return (
      <div className="flex flex-1">
         <OnboardingSteps currentStep={currentStep} />

         <main className="flex flex-1 items-center justify-center bg-[#F7F8FA] px-10 py-8">
            <div className="flex w-full max-w-3xl flex-col">
               <div className="flex-1">
                  {currentStep === 1 && (
                     <Step1OrgInfoForm
                        value={orgInfo}
                        onChange={setOrgInfo}
                        dateOrderError={orgInfoDateError}
                     />
                  )}
                  {currentStep === 2 && (
                     <Step2AttendanceUnitForm
                        value={attendanceUnit}
                        onChange={setAttendanceUnit}
                        periodErrors={attendanceUnitPeriodErrors}
                     />
                  )}
                  {currentStep === 3 && (
                     <Step3WarningCriteriaForm
                        value={warningCriteria}
                        onChange={setWarningCriteria}
                     />
                  )}
                  {currentStep === 4 && (
                     <Step4FinalCheckForm
                        orgInfo={orgInfo}
                        attendanceUnit={attendanceUnit}
                        warningCriteria={warningCriteria}
                     />
                  )}
               </div>

               <div className="mt-5 flex items-center justify-between">
                  <div>
                     {currentStep > 1 && (
                        <button
                           type="button"
                           disabled={isSubmitting}
                           onClick={goToPreviousStep}
                           className="flex cursor-pointer items-center gap-1 rounded-xs bg-white border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F7F8FA] disabled:cursor-not-allowed disabled:opacity-60"
                        >
                           <ChevronLeft size={16} />
                           이전
                        </button>
                     )}
                  </div>

                  <div className="flex items-center gap-4">
                     <span className="text-sm text-gray-400">
                        {currentStep} / {ONBOARDING_TOTAL_STEPS}
                     </span>
                     <button
                        type="button"
                        disabled={!isCurrentStepValid || isSubmitting}
                        onClick={isLastStep ? completeOnboarding : goToNextStep}
                        className={`flex items-center gap-1 rounded-xs px-4 py-2 text-sm font-semibold transition-colors ${
                           isCurrentStepValid && !isSubmitting
                              ? 'cursor-pointer bg-brand-green text-white hover:bg-[#4D655A]'
                              : 'cursor-not-allowed bg-[#E5E7EB] text-[#9CA3AF]'
                        }`}
                     >
                        {isSubmitting ? '처리 중...' : isLastStep ? '완료' : '다음'}
                        {!isSubmitting &&
                           (isLastStep ? <Check size={16} /> : <ChevronRight size={16} />)}
                     </button>
                  </div>
               </div>
            </div>
         </main>
      </div>
   );
}
