import { Navbar } from '@/components/Navbar';
import { GamesList } from '@/components/GamesList';
import { Footer } from '@/components/Footer';
import { getGames } from '@/lib/games-server';
import { SITE_URL } from '@/lib/site-config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Nova Hub - Keyless',
  alternates: {
    canonical: `${SITE_URL}/games`,
  },
};

export default async function GamesPage() {
  const games = await getGames({ forceFresh: true });

  return (
    <main className="min-h-screen">
      <Navbar />
      <GamesList games={games} />
      <Footer />
    </main>
  );
}
