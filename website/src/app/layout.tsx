import type { Metadata } from 'next';
import '../../tailwind.css';

export const metadata: Metadata = {
  title: 'Range Alarm',
  description: 'A mobile alarm app that wakes you gradually with a sequence of notifications at increasing intensity.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
