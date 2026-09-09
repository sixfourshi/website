import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getScripts } from '@/lib/scripts';
import { getGames } from '@/lib/games-server';
import { DashboardClient } from '@/components/DashboardClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const authed = await isAuthenticated();
  if (!authed) redirect('/login');

  const [scripts, games] = await Promise.all([getScripts(), getGames()]);

  return <DashboardClient initialScripts={scripts} initialGames={games} />;
}
