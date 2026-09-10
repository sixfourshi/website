import { Navbar } from '@/components/Navbar';
import { SuggestionForm } from '@/components/SuggestionForm';
import { Footer } from '@/components/Footer';

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
