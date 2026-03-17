import Link from 'next/link';
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/constants';

export function CtaSection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl text-center">
        <h2 className="mb-4 text-3xl font-bold text-white sm:text-4xl">
          Ready to Wake Up Better?
        </h2>
        <p className="mb-8 text-lg text-charcoal-300">
          Download Range Alarm and start your mornings the right way.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href={APP_STORE_URL}
            className="rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-navy-900 transition-colors hover:bg-cyan-500"
          >
            Download for iOS
          </Link>
          <Link
            href={PLAY_STORE_URL}
            className="rounded-xl border border-cyan-400 px-6 py-3 font-semibold text-cyan-400 transition-colors hover:bg-cyan-400/10"
          >
            Download for Android
          </Link>
        </div>
        <div className="mt-8 flex justify-center gap-6">
          <Link href="/privacy" className="text-sm text-muted-foreground transition-colors hover:text-white">
            Privacy Policy
          </Link>
          <Link href="/terms" className="text-sm text-muted-foreground transition-colors hover:text-white">
            Terms &amp; Conditions
          </Link>
        </div>
      </div>
    </section>
  );
}
