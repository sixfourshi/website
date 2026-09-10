import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getScripts } from '@/lib/scripts';
import { getGames } from '@/lib/games-server';
import { getStoredLoaderConfig } from '@/lib/storage';
import { DashboardClient } from '@/components/DashboardClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const authed = await isAuthenticated();
  if (!authed) redirect('/login');

  const [scripts, games, loaderConfig] = await Promise.all([
    getScripts(),
    getGames(),
    getStoredLoaderConfig(),
  ]);

  return (
    <DashboardClient
      initialScripts={scripts}
      initialGames={games}
      initialLoaderConfig={loaderConfig}
    />
  );
}
