import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { Stats } from '@/components/Stats';
import { Demo } from '@/components/Demo';
import { Faq } from '@/components/Faq';
import { Footer } from '@/components/Footer';
import { getGames } from '@/lib/games-server';
import {
  getChangelogReleases,
  getNewestPublishedRelease,
  formatChangelogDateDDMMYYYY,
  formatChangelogVersion,
  type ChangelogRelease,
} from '@/lib/changelog';
import { getStoredExecutions } from '@/lib/executions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  let games: any[] = [];
  let releases: ChangelogRelease[] = [];
  let executionsStore: any = { totalExecutions: 0 };

  try {
    const results = await Promise.allSettled([
      getGames({ forceFresh: true }),
      getChangelogReleases({ forceFresh: true }),
      getStoredExecutions(),
    ]);

    if (results[0].status === 'fulfilled' && Array.isArray(results[0].value)) {
      games = results[0].value;
    }
    if (results[1].status === 'fulfilled' && Array.isArray(results[1].value)) {
      releases = results[1].value;
    }
    if (results[2].status === 'fulfilled' && results[2].value) {
      executionsStore = results[2].value;
    }
  } catch (err) {
    console.error('[Home] Error fetching homepage data:', err);
  }

  // Filter out Universal Scripts; count real individual games only
  const realGames = (games || []).filter(
    (g) => !g?.isUniversal && g?.slug?.toLowerCase() !== 'universal'
  );
  const gameCount = realGames.length;

  // Resolve newest published changelog entry strictly sorted by published date (newest first)
  const newestRelease = getNewestPublishedRelease(releases);
  const rawDate = newestRelease?.date || newestRelease?.publishedDate || newestRelease?.releaseDate;
  const lastUpdated = rawDate ? formatChangelogDateDDMMYYYY(rawDate) : '—';
  const rawVersion = newestRelease?.version || newestRelease?.currentVersion;
  const currentVersion = rawVersion ? formatChangelogVersion(rawVersion) : '—';

  return (
    <main>
      <Navbar />
      <Hero />
      <Stats
        lastUpdated={lastUpdated}
        gameCount={gameCount}
        totalExecutions={executionsStore?.totalExecutions || 0}
        version={currentVersion}
      />
      <Demo />
      <Faq />
      <Footer />
    </main>
  );
}
