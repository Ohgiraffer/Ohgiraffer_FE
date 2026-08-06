'use client';

import { Building } from 'lucide-react';
import PersonAvatar from './PersonAvatar';
import type { SpacePerson, SpaceZone } from '../types';

type Props = {
   zones: SpaceZone[];
   people: SpacePerson[];
   searchKeyword: string;
   onCheckIn: (zoneId: string) => void;
   onCheckOut: () => void;
};

const ROW_GRID = 'grid w-full grid-cols-[1fr_1fr_1fr] items-center';

export default function SpaceListView({
   zones,
   people,
   searchKeyword,
   onCheckIn,
   onCheckOut,
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
            <span>팀</span>
         </div>

         {zones.map((zone) => {
            const occupants = people.filter((person) => person.zoneId === zone.id);
            const visibleOccupants = isSearching
               ? occupants.filter((person) => person.name.includes(trimmedKeyword))
               : occupants;
            const isCurrentUserHere = occupants.some((person) => person.isCurrentUser);

            return (
               <div key={zone.id} className="border-b border-[#E5E7EB] last:border-b-0">
                  <div className="flex items-center gap-2 border-t border-[#E5E7EB] bg-[#F9FAFB] px-6 py-2.5 text-sm font-semibold text-gray-900">
                     <Building size={16} className="text-brand-green" />
                     {zone.name}
                     <span className="font-normal text-gray-400">
                        {occupants.length}/{zone.capacity}명 재실
                     </span>
                     <span className="h-1.5 w-1.5 rounded-full bg-brand-sage" />
                  </div>

                  {visibleOccupants.map((person) => {
                     const rowContent = (
                        <>
                           <div className="flex items-center gap-2">
                              <PersonAvatar
                                 name={person.name}
                                 isCurrentUser={person.isCurrentUser}
                              />
                              <span className="text-sm font-medium text-gray-900">
                                 {person.name}
                                 {person.isCurrentUser && (
                                    <span className="ml-1 text-xs font-normal text-gray-400">
                                       (나)
                                    </span>
                                 )}
                              </span>
                           </div>
                           <span className="text-sm text-gray-500">{zone.name}</span>
                           <span className="text-sm text-gray-500">{person.team}</span>
                        </>
                     );

                     // 본인 행은 클릭하면 퇴실(다른 구역으로 이동하지 않고 그냥 자리를 비움)
                     return person.isCurrentUser ? (
                        <button
                           key={person.id}
                           type="button"
                           onClick={onCheckOut}
                           aria-label={`${person.name} 퇴실`}
                           className={`${ROW_GRID} cursor-pointer border-t-[0.5px] border-b-[0.5px] border-[#E5E7EB] bg-brand-sage/10 px-6 py-3 text-left hover:bg-brand-sage/20`}
                        >
                           {rowContent}
                        </button>
                     ) : (
                        <div
                           key={person.id}
                           className={`${ROW_GRID} border-t-[0.5px] border-b-[0.5px] border-[#E5E7EB] px-6 py-3`}
                        >
                           {rowContent}
                        </div>
                     );
                  })}

                  {!isSearching && !isCurrentUserHere && (
                     <button
                        type="button"
                        onClick={() => onCheckIn(zone.id)}
                        className="block w-full h-15 cursor-pointer border-t-[0.7px] border-b-[0.7px] border-[#E5E7EB] px-8 py-3 text-left text-sm text-gray-400 hover:bg-gray-50"
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
