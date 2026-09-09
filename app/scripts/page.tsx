import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { ScriptsGrid } from '@/components/ScriptsGrid';
import { Footer } from '@/components/Footer';
import { getScripts } from '@/lib/scripts';

export const metadata: Metadata = {
  title: 'Scripts Library — Sour Hub',
  description:
    'Browse our curated collection of keyless Roblox scripts with single-line loaders, versioning, and raw endpoints.',
};

export default async function ScriptsPage() {
  const scripts = await getScripts();

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-16">
        <ScriptsGrid scripts={scripts} />
      </div>
      <Footer />
    </main>
  );
}
