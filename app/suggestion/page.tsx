import type { Metadata } from 'next';
import { Navbar } from '@/components/Navbar';
import { SuggestionForm } from '@/components/SuggestionForm';
import { Footer } from '@/components/Footer';

export const metadata: Metadata = {
  title: 'Suggest a Game or Feature — Sour Hub',
  description:
    'Have a game you want us to support or a feature you would like added? Send us your suggestion and we’ll review it for a future Sour Hub update.',
};

export default function SuggestionPage() {
  return (
    <main className="min-h-screen flex flex-col justify-between">
      <Navbar />
      <div className="pt-28 pb-20 px-5 flex-1 flex items-center justify-center">
        <SuggestionForm />
      </div>
      <Footer />
    </main>
  );
}
