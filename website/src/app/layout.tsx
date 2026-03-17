import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { APP_NAME, APP_DESCRIPTION, WEBSITE_URL } from '@/lib/constants';
import '../../tailwind.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Wake Up Gradually`,
    template: `%s — ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  metadataBase: new URL(WEBSITE_URL),
  openGraph: {
    title: `${APP_NAME} — Wake Up Gradually`,
    description: APP_DESCRIPTION,
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: `${APP_NAME} — Wake Up Gradually`,
    description: APP_DESCRIPTION,
    images: ['/og-image.png'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
