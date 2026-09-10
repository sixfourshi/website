import { Navbar } from '@/components/Navbar';
import { Changelog } from '@/components/Changelog';
import { Footer } from '@/components/Footer';
import { getChangelogReleases } from '@/lib/changelog';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Sour Hub - Keyless',
  alternates: {
    canonical: 'https://sourhub.vercel.app/changelog',
  },
};

export default async function ChangelogPage() {
  const releases = await getChangelogReleases();

  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-16">
        <Changelog releases={releases} />
      </div>
      <Footer />
    </main>
  );
}
