'use client';

import { Check, ChevronLeft, ChevronRight } from 'lucide-react';
import { ONBOARDING_TOTAL_STEPS } from '../types';
import { useOnboardingWizard } from '../hooks/useOnboardingWizard';
import Step1OrgInfoForm from '../steps/Step1OrgInfoForm';
import Step2AttendanceUnitForm from '../steps/Step2AttendanceUnitForm';
import Step3WarningCriteriaForm from '../steps/Step3WarningCriteriaForm';
import Step4FinalCheckForm from '../steps/Step4FinalCheckForm';
import OnboardingSteps from './OnboardingSteps';

export default function OnboardingWizardClient() {
   const {
      currentStep,
      isCurrentStepValid,
      goToNextStep,
      goToPreviousStep,
      orgInfo,
      setOrgInfo,
      attendanceUnit,
      setAttendanceUnit,
      warningCriteria,
      setWarningCriteria,
      orgInfoDateError,
      attendanceUnitDateErrors,
   } = useOnboardingWizard();

   const isLastStep = currentStep === ONBOARDING_TOTAL_STEPS;

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
                        dateOrderErrors={attendanceUnitDateErrors}
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
                           onClick={goToPreviousStep}
                           className="flex cursor-pointer items-center gap-1 rounded-sm bg-white border border-[#E5E7EB] px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#F7F8FA]"
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
                        disabled={!isCurrentStepValid}
                        // TODO: 백엔드 준비되면 완료 클릭 시 실제 제출 액션 연결
                        onClick={isLastStep ? undefined : goToNextStep}
                        className={`flex items-center gap-1 rounded-sm px-4 py-2 text-sm font-semibold transition-colors ${
                           isCurrentStepValid
                              ? 'cursor-pointer bg-brand-green text-white hover:bg-[#4D655A]'
                              : 'cursor-not-allowed bg-[#E5E7EB] text-[#9CA3AF]'
                        }`}
                     >
                        {isLastStep ? '완료' : '다음'}
                        {isLastStep ? <Check size={16} /> : <ChevronRight size={16} />}
                     </button>
                  </div>
               </div>
            </div>
         </main>
      </div>
   );
}
