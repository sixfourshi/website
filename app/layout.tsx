import type { Metadata } from 'next';
import './globals.css';
import { AppBackground } from '@/components/AppBackground';
import { ToastContainer } from '@/components/Toast';

export const metadata: Metadata = {
  metadataBase: new URL('https://novahub.vercel.app'),
  title: {
    default: 'Nova Hub - Keyless',
    template: 'Nova Hub - Keyless',
    absolute: 'Nova Hub - Keyless',
  },
  description: 'Free, keyless scripts for the games we build - no ads, checkpoints.',
  alternates: {
    canonical: 'https://novahub.vercel.app',
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '512x512' },
      { url: '/favicon-32x32.png', type: 'image/png', sizes: '32x32' },
      { url: '/favicon-16x16.png', type: 'image/png', sizes: '16x16' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  openGraph: {
    title: 'Nova Hub - Best Keyless Script Hub',
    description: 'Free, keyless scripts for the games we build - no ads, checkpoints.',
    url: 'https://novahub.vercel.app',
    siteName: 'Nova Hub',
    type: 'website',
    images: [
      {
        url: 'https://novahub.vercel.app/icon.png',
        width: 512,
        height: 512,
        alt: 'Nova Hub - Best Keyless Script Hub',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    card: 'summary',
    title: 'Nova Hub - Best Keyless Script Hub',
    description: 'Free, keyless scripts for the games we build - no ads, checkpoints.',
    images: ['https://novahub.vercel.app/icon.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  function patchFetch() {
                    var current = window;
                    var desc = null;
                    while (current && !desc) {
                      desc = Object.getOwnPropertyDescriptor(current, 'fetch');
                      if (!desc) current = Object.getPrototypeOf(current);
                    }
                    if (desc && (!desc.set && (desc.get || desc.writable === false))) {
                      var origGet = desc.get;
                      var origFetch = window.fetch;
                      var customFetch = null;
                      var def = {
                        get: function() {
                          return customFetch || (origGet ? origGet.call(window) : origFetch);
                        },
                        set: function(val) {
                          customFetch = val;
                        },
                        configurable: true,
                        enumerable: desc.enumerable !== false
                      };
                      try { Object.defineProperty(window, 'fetch', def); } catch(e) {}
                      if (current && current !== window) {
                        try { Object.defineProperty(current, 'fetch', def); } catch(e) {}
                      }
                    }
                  }
                  patchFetch();

                  var origDefineProperty = Object.defineProperty;
                  Object.defineProperty = function(obj, prop, descriptor) {
                    if ((obj === window || (typeof Window !== 'undefined' && obj === Window.prototype)) && prop === 'fetch') {
                      if (descriptor && descriptor.get && !descriptor.set) {
                        var custom = null;
                        var originalGetter = descriptor.get;
                        descriptor.set = function(val) { custom = val; };
                        var oldGetter = descriptor.get;
                        descriptor.get = function() { return custom || oldGetter.call(this); };
                      }
                    }
                    return origDefineProperty.apply(this, arguments);
                  };
                } catch(e) {}
              })();
            `,
          }}
        />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
      </head>
      <body className="font-body bg-base text-ink antialiased relative min-h-screen" suppressHydrationWarning>
        <AppBackground />
        <div className="relative z-10">{children}</div>
        <ToastContainer />
      </body>
    </html>
  );
}
