import type { Metadata } from 'next';
import './globals.css';
import { AppBackground } from '@/components/AppBackground';

export const metadata: Metadata = {
  title: 'Sour Hub — Roblox Script Hub',
  description:
    'Sour Hub is a curated collection of keyless Roblox scripts with a clean, always-updated library and a simple raw-script API for your executor.',
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
      <body className="font-body bg-base text-ink antialiased relative min-h-screen" suppressHydrationWarning>
        <AppBackground />
        <div className="relative z-10">{children}</div>
      </body>
    </html>
  );
}
