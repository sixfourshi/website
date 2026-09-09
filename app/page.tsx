import { Navbar } from '@/components/Navbar';
import { Hero } from '@/components/Hero';
import { Stats } from '@/components/Stats';
import { Demo } from '@/components/Demo';
import { Faq } from '@/components/Faq';
import { Footer } from '@/components/Footer';
import { getScripts } from '@/lib/scripts';

export default async function Home() {
  const scripts = await getScripts();
  const gameSet = new Set(scripts.map((s) => s.game).filter((g) => g !== 'Universal'));
  const latest = [...scripts].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))[0];

  return (
    <main>
      <Navbar />
      <Hero />
      <Stats
        scriptCount={scripts.length}
        gameCount={gameSet.size}
        featureCount={18}
        version={latest?.version ?? '1.0.0'}
      />
      <Demo />
      <Faq />
      <Footer />
    </main>
  );
}
