import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { GamesList } from '@/components/GamesList';
import { Footer } from '@/components/Footer';
import { getGames } from '@/lib/games-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata: Metadata = {
  title: 'Supported Games — Sour Hub',
  description:
    'Browse verified keyless Roblox games with live player counts, features, and tabs.',
};

export default async function ScriptsPage() {
  const games = await getGames();

  return (
    <main className="min-h-screen">
      <Navbar />
      <GamesList games={games} />
      <Footer />
    </main>
  );
}
