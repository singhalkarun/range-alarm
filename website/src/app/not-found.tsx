import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <h1 className="mb-4 text-6xl font-bold text-cyan-400">404</h1>
      <p className="mb-8 text-xl text-charcoal-300">
        This page doesn&apos;t exist.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-cyan-400 px-6 py-3 font-semibold text-navy-900 transition-colors hover:bg-cyan-500"
      >
        Go Home
      </Link>
    </div>
  );
}
