import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { ProcessingHUD } from '@/components/processing/ProcessingHUD';
import { CookieConsentBanner } from '@/components/compliance/CookieConsentBanner';

export const metadata: Metadata = {
  title: 'PRISM — Turn Diagrams into Living 3D Systems',
  description: 'PRISM transforms architecture diagrams, UML schemas, and infrastructure flows into interactive 3D spatial twins with real-time telemetry.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('diagram3d-theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (saved === 'light' || (!saved && !prefersDark)) {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  } else {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  }
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-slate-50 text-slate-900 dark:bg-[#07080B] dark:text-slate-100 antialiased min-h-screen transition-colors duration-200">
        {/* WCAG 2.1 AA: Skip to main content link */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-cyan-500 focus:text-slate-950 focus:font-mono focus:text-xs focus:font-bold focus:rounded-md focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-cyan-400"
        >
          Pular para o conteúdo principal (Skip to content)
        </a>

        <ThemeProvider>
          {children}
          <ProcessingHUD />
          <CookieConsentBanner />
        </ThemeProvider>
      </body>
    </html>
  );
}
