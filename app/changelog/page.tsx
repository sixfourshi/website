import { Navbar } from '@/components/Navbar';
import { Changelog } from '@/components/Changelog';
import { Footer } from '@/components/Footer';
import { getChangelogReleases } from '@/lib/changelog';
import { SITE_URL } from '@/lib/site-config';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Nova Hub - Keyless',
  alternates: {
    canonical: `${SITE_URL}/changelog`,
  },
};

export default async function ChangelogPage() {
  const releases = await getChangelogReleases({ forceFresh: true });

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
