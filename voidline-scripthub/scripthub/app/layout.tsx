import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Voidline — Roblox Script Hub',
  description:
    'Voidline is a curated collection of Roblox scripts with a clean, always-updated library and a simple raw-script API for your executor.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-body bg-base text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
