import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { Stats } from '@/components/Stats';
import { Demo } from '@/components/Demo';
import { Faq } from '@/components/Faq';
import { Footer } from '@/components/Footer';
import { getScripts } from '@/lib/scripts';
import { getStoredExecutions } from '@/lib/executions';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function Home() {
  const [scripts, executionsStore] = await Promise.all([
    getScripts(),
    getStoredExecutions(),
  ]);
  const gameSet = new Set(scripts.map((s) => s.game).filter((g) => g !== 'Universal'));
  const latest = [...scripts].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))[0];

  return (
    <main>
      <Navbar />
      <Hero />
      <Stats
        scriptCount={scripts.length}
        gameCount={gameSet.size}
        totalExecutions={executionsStore.totalExecutions}
        version={latest?.version ?? '1.0.0'}
      />
      <Demo />
      <Faq />
      <Footer />
    </main>
  );
}
