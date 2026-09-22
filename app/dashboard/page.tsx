import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import { getScripts } from '@/lib/scripts';
import { getGames } from '@/lib/games-server';
import { getStoredLoaderConfig, getStoredSuggestions } from '@/lib/storage';
import { getStoredExecutions, computeAnalytics } from '@/lib/executions';
import { getChangelogReleases } from '@/lib/changelog';
import { DashboardClient } from '@/components/DashboardClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function DashboardPage() {
  const authed = await isAuthenticated();
  if (!authed) redirect('/login');

  const [scripts, games, loaderConfig, suggestions, executionsStore, changelog] = await Promise.all([
    getScripts({ forceFresh: true }),
    getGames({ forceFresh: true }),
    getStoredLoaderConfig(),
    getStoredSuggestions(),
    getStoredExecutions(),
    getChangelogReleases({ forceFresh: true }),
  ]);

  const initialAnalytics = computeAnalytics(executionsStore);

  return (
    <DashboardClient
      initialScripts={scripts}
      initialGames={games}
      initialLoaderConfig={loaderConfig}
      initialSuggestions={suggestions}
      initialAnalytics={initialAnalytics}
      initialExecutionLogs={executionsStore.recentLogs}
      initialChangelog={changelog}
    />
  );
}
