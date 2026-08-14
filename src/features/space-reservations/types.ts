import type { UserRole } from '@/services/auth.service';

export type SpaceOccupant = {
   userId: number;
   userName: string;
   role: UserRole;
   mine: boolean;
   profileImgUrl?: string | null;
};

export type Space = {
   spaceId: number;
   spaceName: string;
   capacity: number;
   currentCount: number;
   availableCount: number;
   occupants: SpaceOccupant[];
};

export type MyLocationResult = {
   userId: number;
   userName: string;
   role: UserRole;
   spaceId: number | null;
   spaceName: string | null;
};

export type SpaceWriteRequest = {
   spaceName: string;
   capacity: number;
};
