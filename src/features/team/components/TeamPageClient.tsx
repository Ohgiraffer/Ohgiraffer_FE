'use client';

import { useAuth } from '@/components/auth/AuthContext';
import ManagerTeamBoard from './ManagerTeamBoard';
import StudentTeamView from './StudentTeamView';

export default function TeamPageClient() {
   const { role } = useAuth();

   if (role === 'STUDENT') return <StudentTeamView />;
   return <ManagerTeamBoard />;
}
