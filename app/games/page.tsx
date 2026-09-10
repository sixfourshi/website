import { Navbar } from '@/components/Navbar';
import { GamesList } from '@/components/GamesList';
import { Footer } from '@/components/Footer';
import { getGames } from '@/lib/games-server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Sour Hub - Keyless',
  alternates: {
    canonical: 'https://sourhub.vercel.app/games',
  },
};

export default async function GamesPage() {
  const games = await getGames();

  return (
    <main className="min-h-screen">
      <Navbar />
      <GamesList games={games} />
      <Footer />
    </main>
  );
}
