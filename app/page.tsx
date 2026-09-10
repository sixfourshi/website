import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { Stats } from '@/components/Stats';
import { Demo } from '@/components/Demo';
import { Faq } from '@/components/Faq';
import { Footer } from '@/components/Footer';
import { getGames } from '@/lib/games-server';
import {
  getChangelogReleases,
  getActiveLatestRelease,
  formatChangelogDateDDMMYYYY,
} from '@/lib/changelog';
import { getStoredExecutions } from '@/lib/executions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  const [games, releases, executionsStore] = await Promise.all([
    getGames({ forceFresh: true }),
    getChangelogReleases({ forceFresh: true }),
    getStoredExecutions(),
  ]);

  // Filter out Universal Scripts; count real individual games only
  const realGames = (games || []).filter(
    (g) => !g.isUniversal && g.slug.toLowerCase() !== 'universal'
  );
  const gameCount = realGames.length;

  // Resolve newest published changelog entry (preferring LATEST, otherwise newest by date)
  const activeRelease = getActiveLatestRelease(releases || []);
  const lastUpdated = activeRelease ? formatChangelogDateDDMMYYYY(activeRelease.date) : '—';
  const currentVersion = activeRelease?.version?.trim() ? activeRelease.version.trim() : '—';

  return (
    <main>
      <Navbar />
      <Hero />
      <Stats
        lastUpdated={lastUpdated}
        gameCount={gameCount}
        totalExecutions={executionsStore.totalExecutions}
        version={currentVersion}
      />
      <Demo />
      <Faq />
      <Footer />
    </main>
  );
}
