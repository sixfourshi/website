import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { Executors } from '@/components/Executors';
import { HowToUse } from '@/components/HowToUse';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Executor Compatibility — Sour Hub',
  description:
    'Check executor compatibility status for Solara, Wave, Codex, Volcano, Nihon, and Cryptic on Sour Hub.',
};

export default function ExecutorsPage() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <div className="pt-16">
        <Executors />
        <HowToUse />
      </div>
      <Footer />
    </main>
  );
}
