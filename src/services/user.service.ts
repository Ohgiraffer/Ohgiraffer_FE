import { apiFetch } from '@/lib/http';
import type { UserRole } from '@/services/auth.service';

export interface Me {
   userId: number;
   name: string;
   phone: string;
   email: string;
   role: UserRole;
   profileImgUrl: string | null;
   joinDate: string;
   status: string;
   notificationOn: boolean;
}

export function getMe() {
   return apiFetch<Me>('/user/me');
}
