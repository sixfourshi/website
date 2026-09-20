import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Clock, Tag } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Icon } from '@/components/Icon';
import { CodeViewer } from '@/components/CodeViewer';
import { LoaderActions } from '@/components/LoaderActions';
import { getScript } from '@/lib/scripts';
import { getGameBySlug } from '@/lib/games-server';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;
export const revalidate = 0;

export const metadata = {
  title: 'Nova Hub - Keyless',
  alternates: {
    canonical: 'https://novahub.vercel.app/games',
  },
};

export default async function GameOrScriptPage({
  params,
}: {
  params: Promise<{ slug: string }> | { slug: string };
}) {
  const resolvedParams = await params;
  const slug = decodeURIComponent(resolvedParams.slug).trim();

  // If the requested slug is a game, redirect to /games directly expanded on the game card
  const game = await getGameBySlug(slug);
  if (game) {
    redirect(`/games?game=${game.slug}`);
  }

  // Fallback: Check if requested slug is an individual script
  const script = await getScript(slug);
  if (!script) notFound();

  return (
    <main className="min-h-screen">
      <Navbar />

      <div className="mx-auto max-w-4xl px-5 pt-28 pb-20">
        <Link
          href="/games"
          className="inline-flex items-center gap-1.5 text-xs text-ink-muted transition-colors hover:text-ink"
        >
          <ArrowLeft size={14} />
          Back to games
        </Link>

        {/* Script header */}
        <div className="mt-4 flex flex-col gap-4 border-b border-line pb-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3.5">
            <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-surface text-white">
              <Icon name={script.icon} size={24} />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display text-2xl font-bold text-white">
                  {script.name}
                </h1>
                {script.version && (
                  <span className="rounded-full border border-emerald-500/40 bg-emerald-950/40 px-2 py-0.5 text-[10px] text-emerald-400">
                    v{script.version}
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-ink-muted">{script.description}</p>
              <div className="mt-3 flex flex-wrap items-center gap-3 text-[11px] text-ink-muted">
                <span className="flex items-center gap-1">
                  <Tag size={12} />
                  <span className="capitalize">{script.category}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Clock size={12} />
                  Updated {script.updatedAt}
                </span>
              </div>
            </div>
          </div>

          <LoaderActions slug={script.slug} />
        </div>

        {/* Code viewer */}
        <div className="mt-6">
          <CodeViewer code={script.code} />
        </div>
      </div>

      <Footer />
    </main>
  );
}

