import Link from 'next/link';
import { APP_TAGLINE, APP_STORE_URL, PLAY_STORE_URL } from '@/lib/constants';
import { PhoneMockup } from './phone-mockup';

export function HeroSection() {
  return (
    <section className="px-4 py-20 sm:px-6 sm:py-28 lg:px-8 lg:py-36">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col items-center gap-12 md:flex-row md:gap-16">
          <div className="flex-1 text-center md:text-left">
            <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-cyan-400">
              {APP_TAGLINE}
            </p>
            <h1 className="mb-6 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Wake Up Gradually,{' '}
              <span className="text-cyan-400">Not Abruptly</span>
            </h1>
            <p className="mb-8 max-w-lg text-lg text-charcoal-300">
              Range Alarm sends a sequence of notifications at increasing
              intensity over your chosen time window. Set a start time, pick
              your duration, and let the app guide you awake.
            </p>
            <div id="download" className="flex flex-wrap justify-center gap-4 md:justify-start">
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
          </div>
          <div className="flex flex-1 items-center justify-center">
            <PhoneMockup />
          </div>
        </div>
      </div>
    </section>
  );
}
