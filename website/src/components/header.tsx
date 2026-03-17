import Link from 'next/link';
import { APP_BRAND } from '@/lib/constants';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-navy-900/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-xl font-bold text-cyan-400">
          {APP_BRAND}
        </Link>
        <nav className="flex items-center gap-6">
          <Link
            href="/privacy"
            className="text-sm text-charcoal-300 transition-colors hover:text-white"
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            className="text-sm text-charcoal-300 transition-colors hover:text-white"
          >
            Terms
          </Link>
          <Link
            href="#download"
            className="rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-navy-900 transition-colors hover:bg-cyan-500"
          >
            Download
          </Link>
        </nav>
      </div>
    </header>
  );
}
