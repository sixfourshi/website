import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { Changelog } from '@/components/Changelog';
import { Footer } from '@/components/Footer';
import { getScripts } from '@/lib/scripts';

export const metadata: Metadata = {
  title: 'Changelog — Sour Hub',
  description:
    'Stay updated with the latest releases, performance improvements, and fixes for Sour Hub scripts.',
};

export default async function ChangelogPage() {
  const scripts = await getScripts();
  const latest = [...scripts].sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))[0];

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-16">
        <Changelog
          version={latest?.version ?? '1.2.4'}
          date={latest?.updatedAt ?? 'Recent'}
        />
      </div>
      <Footer />
    </main>
  );
}
