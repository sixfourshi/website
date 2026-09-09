import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { GamesList } from '@/components/GamesList';
import { Footer } from '@/components/Footer';
import { getScripts } from '@/lib/scripts';
import { ROBLOX_GAMES } from '@/lib/games';

export const metadata: Metadata = {
  title: 'Roblox Scripts & Games — Sour Hub',
  description:
    'Browse keyless Roblox scripts grouped by game with live player counts, instant loaders, and individual versioning.',
};

export default async function ScriptsPage() {
  const scripts = await getScripts();

  // Calculate script counts per game slug
  const scriptCounts: Record<string, number> = {};
  for (const s of scripts) {
    const gameKey = s.game.toLowerCase();
    scriptCounts[gameKey] = (scriptCounts[gameKey] || 0) + 1;
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <GamesList games={ROBLOX_GAMES} scriptCounts={scriptCounts} />
      <Footer />
    </main>
  );
}

