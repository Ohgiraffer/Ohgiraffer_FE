'use client';

import { Building } from 'lucide-react';
import { ROLE_LABELS } from '@/services/auth.service';
import PersonAvatar from './PersonAvatar';
import type { Space } from '../types';

type Props = {
   spaces: Space[];
   searchKeyword: string;
   onCheckIn: (spaceId: number) => void;
   onCheckOut: () => void;
   isChangingLocation: boolean;
};

const ROW_GRID = 'grid w-full grid-cols-[1fr_1fr_1fr] items-center';

export default function SpaceListView({
   spaces,
   searchKeyword,
   onCheckIn,
   onCheckOut,
   isChangingLocation,
}: Props) {
   const trimmedKeyword = searchKeyword.trim();
   const isSearching = trimmedKeyword.length > 0;

   return (
      <div className="rounded-sm border border-[#E5E7EB] bg-white">
         <div
            className={`${ROW_GRID} border-b border-[#E5E7EB] px-6 py-3 text-sm font-medium text-gray-500`}
         >
            <span>이름</span>
            <span>장소</span>
            <span>역할</span>
         </div>

         {spaces.map((space) => {
            const visibleOccupants = isSearching
               ? space.occupants.filter((occupant) => occupant.userName.includes(trimmedKeyword))
               : space.occupants;
            const isCurrentUserHere = space.occupants.some((occupant) => occupant.mine);

            return (
               <div key={space.spaceId} className="border-b border-[#E5E7EB] last:border-b-0">
                  <div className="flex items-center gap-2 border-t border-[#E5E7EB] bg-[#F9FAFB] px-6 py-2.5 text-sm font-semibold text-gray-900">
                     <Building size={16} className="text-brand-green" />
                     {space.spaceName}
                     <span className="font-normal text-gray-400">
                        {space.currentCount}/{space.capacity}명 재실
                     </span>
                     <span className="h-1.5 w-1.5 rounded-full bg-brand-sage" />
                  </div>

                  {visibleOccupants.map((occupant) => {
                     const rowContent = (
                        <>
                           <div className="flex items-center gap-2">
                              <PersonAvatar
                                 name={occupant.userName}
                                 profileImgUrl={occupant.profileImgUrl}
                                 isCurrentUser={occupant.mine}
                              />
                              <span className="text-sm font-medium text-gray-900">
                                 {occupant.userName}
                                 {occupant.mine && (
                                    <span className="ml-1 text-xs font-normal text-gray-400">
                                       (나)
                                    </span>
                                 )}
                              </span>
                           </div>
                           <span className="text-sm text-gray-500">{space.spaceName}</span>
                           <span className="text-sm text-gray-500">
                              {ROLE_LABELS[occupant.role]}
                           </span>
                        </>
                     );

                     // 본인 행은 클릭하면 퇴실
                     return occupant.mine ? (
                        <button
                           key={occupant.userId}
                           type="button"
                           onClick={onCheckOut}
                           disabled={isChangingLocation}
                           aria-label={`${occupant.userName} 퇴실`}
                           className={`${ROW_GRID} cursor-pointer border-t-[0.5px] border-b-[0.5px] border-[#E5E7EB] bg-brand-sage/10 px-6 py-3 text-left hover:bg-brand-sage/20 disabled:cursor-not-allowed disabled:opacity-60`}
                        >
                           {rowContent}
                        </button>
                     ) : (
                        <div
                           key={occupant.userId}
                           className={`${ROW_GRID} border-t-[0.5px] border-b-[0.5px] border-[#E5E7EB] px-6 py-3`}
                        >
                           {rowContent}
                        </div>
                     );
                  })}

                  {/* 정원이 꽉 찬 공간은 입실 버튼 자체를 숨김 */}
                  {!isSearching && !isCurrentUserHere && space.availableCount > 0 && (
                     <button
                        type="button"
                        onClick={() => onCheckIn(space.spaceId)}
                        disabled={isChangingLocation}
                        className="block w-full h-15 cursor-pointer border-t-[0.7px] border-b-[0.7px] border-[#E5E7EB] px-8 py-3 text-left text-sm text-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
                     >
                        + 입실
                     </button>
                  )}
               </div>
            );
         })}
      </div>
   );
}
