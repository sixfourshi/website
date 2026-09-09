import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ArrowLeft, Clock, Tag } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Icon } from '@/components/Icon';
import { CodeViewer } from '@/components/CodeViewer';
import { LoaderActions } from '@/components/LoaderActions';
import { GameDetailView } from '@/components/GameDetailView';
import { getScript, getScripts, getScriptsByGame } from '@/lib/scripts';
import { getGames, getGameBySlug } from '@/lib/games-server';

export async function generateStaticParams() {
  const [scripts, games] = await Promise.all([getScripts(), getGames()]);
  const gameParams = games.map((g) => ({ slug: g.slug }));
  const scriptParams = scripts.map((s) => ({ slug: s.slug }));
  return [...gameParams, ...scriptParams];
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const game = await getGameBySlug(params.slug);
  if (game) {
    return {
      title: `${game.name} Scripts — Sour Hub`,
      description: game.description,
    };
  }

  const script = await getScript(params.slug);
  if (script) {
    return {
      title: `${script.name} — Sour Hub`,
      description: script.description,
    };
  }

  return {
    title: 'Scripts — Sour Hub',
  };
}

export default async function ScriptOrGamePage({
  params,
}: {
  params: { slug: string };
}) {
  // Check if requested slug is a game (e.g. volleyball-legends, rivals, etc.)
  const game = await getGameBySlug(params.slug);
  if (game) {
    const scripts = await getScriptsByGame(game.slug);
    return (
      <main className="min-h-screen">
        <Navbar />
        <GameDetailView game={game} scripts={scripts} />
        <Footer />
      </main>
    );
  }

  // Fallback: Check if requested slug is an individual script
  const script = await getScript(params.slug);
  if (!script) notFound();

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-3xl px-5 pb-24 pt-32">
        <Link
          href="/scripts"
          className="mb-8 inline-flex items-center gap-1.5 text-sm text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft size={15} />
          Back to library
        </Link>

        <div className="mb-8 flex items-start gap-4">
          <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl border border-line bg-surface/60 text-azure-300">
            <Icon name={script.icon} size={22} />
          </span>
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink sm:text-3xl">
              {script.name}
            </h1>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">
              {script.description}
            </p>
          </div>
        </div>

        <div className="mb-8 flex flex-wrap items-center gap-2 text-xs text-ink-muted">
          <span className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5">
            <Tag size={12} />
            {script.category}
          </span>
          <span className="rounded-full border border-line px-3 py-1.5">
            v{script.version}
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5">
            <Clock size={12} />
            Updated {script.updatedAt}
          </span>
        </div>

        <LoaderActions slug={script.slug} />

        <div className="mt-6">
          <CodeViewer code={script.code} />
        </div>
      </div>
      <Footer />
    </main>
  );
}

