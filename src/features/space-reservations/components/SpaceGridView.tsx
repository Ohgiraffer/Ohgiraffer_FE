'use client';

import { Building } from 'lucide-react';
import { ROLE_LABELS } from '@/services/auth.service';
import PersonAvatar from './PersonAvatar';
import DensityBar from './DensityBar';
import type { Space } from '../types';

type Props = {
   spaces: Space[];
   searchKeyword: string;
   searchTrigger: number;
   onCheckIn: (spaceId: number) => void;
   onCheckOut: () => void;
};

// 그리드 뷰 - 구역 카드들을 배치(좁은 화면에서는 1열, 그 외엔 2열), 카드마다 재실 인원 칩 +
// (본인 미입실 시)입실 버튼 + 정도표시바. 본인 카드는 다시 클릭하면 퇴실됨
export default function SpaceGridView({
   spaces,
   searchKeyword,
   searchTrigger,
   onCheckIn,
   onCheckOut,
}: Props) {
   const trimmedKeyword = searchKeyword.trim();

   return (
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
         {spaces.map((space) => {
            const isCurrentUserHere = space.occupants.some((occupant) => occupant.mine);

            return (
               <div key={space.spaceId} className="rounded-sm border border-[#E5E7EB] bg-white p-5">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-sm bg-gray-100 text-gray-500">
                           <Building size={18} />
                        </span>
                        <div>
                           <p className="font-semibold text-gray-900">{space.spaceName}</p>
                           <p className="text-xs text-gray-400">수용 {space.capacity}명</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-1.5 text-sm text-gray-500">
                        {space.currentCount}/{space.capacity}명 재실
                        <span className="h-2 w-2 shrink-0 rounded-full bg-brand-sage" />
                     </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-3">
                     {space.occupants.map((occupant) => {
                        const isMatch =
                           trimmedKeyword.length > 0 && occupant.userName.includes(trimmedKeyword);

                        const cardClassName = `flex h-20 items-center gap-2 rounded-xs border px-3 py-2.5 text-left ${
                           isMatch
                              ? 'space-match-blink border-2 border-brand-green bg-white'
                              : occupant.mine
                                ? 'border-[#8FA888]/30 bg-[#8FA888]/10 hover:bg-[#8FA888]/20'
                                : 'border-[#E5E7EB] bg-[#FAFAF9]'
                        }`;

                        const cardContent = (
                           <>
                              <PersonAvatar
                                 name={occupant.userName}
                                 isCurrentUser={occupant.mine}
                              />
                              <div className="min-w-0">
                                 <p className="truncate text-sm font-medium text-gray-900">
                                    {occupant.userName}
                                    {occupant.mine && (
                                       <span className="ml-1 text-xs font-normal text-gray-400">
                                          (나)
                                       </span>
                                    )}
                                 </p>
                                 <p className="truncate text-xs text-gray-400">
                                    {ROLE_LABELS[occupant.role]}
                                 </p>
                              </div>
                           </>
                        );

                        // 매칭된 카드는 검색 트리거가 바뀔 때마다 새로 마운트되어 깜빡임 애니메이션이 다시 재생됨
                        const key = isMatch
                           ? `${occupant.userId}-blink-${searchTrigger}`
                           : occupant.userId;

                        // 본인 카드는 클릭하면 퇴실(다른 구역으로 이동하지 않고 그냥 자리를 비움)
                        return occupant.mine ? (
                           <button
                              key={key}
                              type="button"
                              onClick={onCheckOut}
                              aria-label={`${occupant.userName} 퇴실`}
                              className={`cursor-pointer ${cardClassName}`}
                           >
                              {cardContent}
                           </button>
                        ) : (
                           <div key={key} className={cardClassName}>
                              {cardContent}
                           </div>
                        );
                     })}

                     {!isCurrentUserHere && (
                        <button
                           type="button"
                           onClick={() => onCheckIn(space.spaceId)}
                           className="flex h-20 cursor-pointer items-center justify-center rounded-xs border border-dashed border-[#E5E7EB] px-3 py-2.5 text-sm text-gray-400 hover:bg-gray-50"
                        >
                           + 입실
                        </button>
                     )}
                  </div>

                  <div className="mt-4">
                     <DensityBar occupied={space.currentCount} capacity={space.capacity} />
                  </div>
               </div>
            );
         })}
      </div>
   );
}
