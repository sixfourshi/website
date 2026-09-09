import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { GamesList } from '@/components/GamesList';
import { Footer } from '@/components/Footer';
import { getScripts } from '@/lib/scripts';
import { getGames } from '@/lib/games-server';

export const metadata: Metadata = {
  title: 'Supported Games — Sour Hub',
  description:
    'Browse verified keyless Roblox games with live player counts, instant loaders, and individual features.',
};

export default async function GamesPage() {
  const [scripts, games] = await Promise.all([getScripts(), getGames()]);

  // Calculate script counts per game slug
  const scriptCounts: Record<string, number> = {};
  for (const s of scripts) {
    const gameKey = s.game.toLowerCase();
    scriptCounts[gameKey] = (scriptCounts[gameKey] || 0) + 1;
  }

  return (
    <main className="min-h-screen">
      <Navbar />
      <GamesList games={games} scriptCounts={scriptCounts} />
      <Footer />
    </main>
  );
}
