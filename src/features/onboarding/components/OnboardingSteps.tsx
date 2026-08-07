import { Check } from 'lucide-react';

type OnboardingStep = {
   step: number;
   title: string;
   description: string;
};

const ONBOARDING_STEPS: OnboardingStep[] = [
   { step: 1, title: '조직·과정 정보', description: '기관 및 부트캠프 과정 기본 정보' },
   { step: 2, title: '출결 단위기간 기준', description: '출결률 집계 기준 기간 설정' },
   { step: 3, title: '경고·제적 기준', description: '출석률 기반 경고 및 제적 기준' },
   { step: 4, title: '최종 확인', description: '입력 내용 검토 및 완료' },
];

export default function OnboardingSteps({ currentStep }: { currentStep: number }) {
   return (
      <aside className="w-72 shrink-0 border-r border-gray-200 bg-white px-4 py-5">
         <div className="sticky top-19">
            <p className="mb-4 text-md font-semibold text-gray-500">설정 단계</p>

            <ol className="flex flex-col gap-1">
               {ONBOARDING_STEPS.map(({ step, title, description }) => {
                  const isActive = step === currentStep;
                  const isCompleted = step < currentStep;

                  return (
                     <li
                        key={step}
                        className={`flex items-center gap-3 rounded-sm px-3.5 py-3.5 ${
                           isActive ? 'bg-brand-green' : isCompleted ? 'bg-[#F0F4F1]' : ''
                        }`}
                     >
                        <span
                           className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                              isActive
                                 ? 'bg-white/20 text-white'
                                 : isCompleted
                                   ? 'bg-brand-sage text-white'
                                   : 'bg-[#E5E7EB] text-[#9CA3AF]'
                           }`}
                        >
                           {isCompleted ? <Check size={16} strokeWidth={4} /> : step}
                        </span>
                        <span className="flex flex-col">
                           <span
                              className={`text-sm font-semibold mb-0.5 ${
                                 isActive
                                    ? 'text-white'
                                    : isCompleted
                                      ? 'text-brand-green'
                                      : 'text-[#9CA3AF]'
                              }`}
                           >
                              {title}
                           </span>
                           <span
                              className={`text-xs ${
                                 isActive
                                    ? 'text-white/80'
                                    : isCompleted
                                      ? 'text-brand-sage'
                                      : 'text-[#C4C9CE]'
                              }`}
                           >
                              {description}
                           </span>
                        </span>
                     </li>
                  );
               })}
            </ol>
         </div>
      </aside>
   );
}
