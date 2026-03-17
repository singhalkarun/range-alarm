import Link from 'next/link';
import { APP_BRAND, APP_STORE_URL, PLAY_STORE_URL } from '@/lib/constants';

export function Footer() {
  return (
    <footer className="border-t border-border bg-navy-900">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div>
            <p className="text-sm text-muted-foreground">
              &copy; {new Date().getFullYear()} {APP_BRAND}. All rights reserved.
            </p>
          </div>
          <nav className="flex flex-wrap justify-center gap-6">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground transition-colors hover:text-white"
            >
              Privacy Policy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground transition-colors hover:text-white"
            >
              Terms &amp; Conditions
            </Link>
            <Link
              href={APP_STORE_URL}
              className="text-sm text-muted-foreground transition-colors hover:text-white"
            >
              App Store
            </Link>
            <Link
              href={PLAY_STORE_URL}
              className="text-sm text-muted-foreground transition-colors hover:text-white"
            >
              Google Play
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
