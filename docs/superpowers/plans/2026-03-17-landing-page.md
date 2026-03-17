# Range Alarm Landing Page Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone Next.js static website in `website/` with a marketing landing page, privacy policy, and terms & conditions for the Range Alarm mobile app.

**Architecture:** Next.js 15 App Router with static export (`output: 'export'`). TailwindCSS v4 with the app's dark navy/cyan theme. Three pages: `/`, `/privacy`, `/terms`. Shared header/footer layout. All content is static — no API calls, no dynamic data.

**Tech Stack:** Next.js 15, React 19, TypeScript, TailwindCSS v4, `@tailwindcss/postcss`

**Spec:** `docs/superpowers/specs/2026-03-17-landing-page-design.md`

---

## File Map

| File | Responsibility |
|------|---------------|
| `website/package.json` | Dependencies and scripts |
| `website/next.config.ts` | Static export config |
| `website/postcss.config.mjs` | Tailwind v4 PostCSS plugin |
| `website/tsconfig.json` | TypeScript config |
| `website/tailwind.css` | Tailwind v4 theme with color tokens |
| `website/src/lib/constants.ts` | Centralized app name, URLs, strings |
| `website/src/app/layout.tsx` | Root layout: Inter font, metadata, header + footer |
| `website/src/app/page.tsx` | Landing page: composes all section components |
| `website/src/app/privacy/page.tsx` | Privacy policy content |
| `website/src/app/terms/page.tsx` | Terms & conditions content |
| `website/src/app/not-found.tsx` | Custom 404 page |
| `website/src/app/robots.ts` | robots.txt generation |
| `website/src/app/sitemap.ts` | sitemap.xml generation |
| `website/src/components/header.tsx` | Sticky nav with logo + links |
| `website/src/components/footer.tsx` | Footer with copyright + links |
| `website/src/components/hero-section.tsx` | Hero: heading, tagline, CTA buttons, phone placeholder |
| `website/src/components/how-it-works.tsx` | 3-step explainer cards |
| `website/src/components/features-section.tsx` | 6 feature cards in responsive grid |
| `website/src/components/intensity-tiers.tsx` | 4-tier intensity progression visual |
| `website/src/components/cta-section.tsx` | Bottom CTA with download buttons |

---

### Task 1: Initialize Next.js Project

**Files:**
- Create: `website/package.json`
- Create: `website/next.config.ts`
- Create: `website/postcss.config.mjs`
- Create: `website/tsconfig.json`
- Create: `website/tailwind.css`
- Create: `website/src/lib/constants.ts`

- [ ] **Step 1: Scaffold the Next.js project**

```bash
cd /home/ubuntu/projects/alarm
npx create-next-app@latest website --typescript --app --src-dir --no-tailwind --no-eslint --no-import-alias --use-pnpm
```

Select defaults when prompted. We skip `--tailwind` because we'll configure TailwindCSS v4 manually.

- [ ] **Step 2: Install TailwindCSS v4 dependencies**

```bash
cd /home/ubuntu/projects/alarm/website
pnpm add -D tailwindcss@^4.1.0 @tailwindcss/postcss@^4.1.0
```

- [ ] **Step 3: Configure `next.config.ts` for static export**

Replace `website/next.config.ts` with:

```ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
};

export default nextConfig;
```

- [ ] **Step 4: Create `postcss.config.mjs`**

Replace `website/postcss.config.mjs` with:

```js
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

- [ ] **Step 5: Create `tailwind.css` with the app's theme**

Replace `website/src/app/globals.css` with `website/tailwind.css`:

```css
@import 'tailwindcss';

@theme {
  --font-family-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;

  /* Navy palette (backgrounds) */
  --color-navy-900: #060b14;
  --color-navy-800: #0D1B2A;
  --color-navy-700: #1B2838;
  --color-navy-600: #243447;

  /* Cyan accent */
  --color-cyan-400: #00D4FF;
  --color-cyan-500: #00bfe6;
  --color-cyan-600: #00a8cc;

  /* Charcoal (text) */
  --color-charcoal-50: #F2F2F2;
  --color-charcoal-100: #E5E5E5;
  --color-charcoal-200: #C9C9C9;
  --color-charcoal-300: #B0B0B0;
  --color-charcoal-400: #969696;
  --color-charcoal-500: #7D7D7D;

  /* Semantic tokens (dark mode is the default and only mode) */
  --color-background: #0D1B2A;
  --color-foreground: #f0f0f0;
  --color-card: #1B2838;
  --color-card-foreground: #f0f0f0;
  --color-muted: #243447;
  --color-muted-foreground: #8892A0;
  --color-border: #2A3A4E;
}
```

Delete the generated `website/src/app/globals.css` file. Update the import in `layout.tsx` (next step handles that).

- [ ] **Step 6: Create `src/lib/constants.ts`**

```ts
export const APP_NAME = 'Range Alarm';
export const APP_BRAND = 'RangeAlarm';
export const APP_TAGLINE = 'Set once. Wake up right.';
export const APP_DESCRIPTION =
  'A mobile alarm app that wakes you gradually with a sequence of notifications at increasing intensity.';
export const DEVELOPER_NAME = 'singhalkarun';
export const DEVELOPER_EMAIL = 'placeholder@example.com';
export const APP_STORE_URL = '#';
export const PLAY_STORE_URL = '#';
export const WEBSITE_URL = 'https://rangealarm.app';
export const EFFECTIVE_DATE = 'March 17, 2026';
```

- [ ] **Step 7: Create placeholder public assets**

Copy the existing favicon from the app or create a minimal placeholder:

```bash
mkdir -p /home/ubuntu/projects/alarm/website/public
# Copy the app's favicon as a starting point
cp /home/ubuntu/projects/alarm/assets/favicon.png /home/ubuntu/projects/alarm/website/public/favicon.ico
```

For `og-image.png`, create a simple placeholder (will be replaced later with a proper branded image). This can be any small PNG for now — the important thing is the file exists so the OG meta tag doesn't point to a broken URL.

- [ ] **Step 8: Verify project builds**

```bash
cd /home/ubuntu/projects/alarm/website && pnpm build
```

Expected: Build succeeds (may have a default page, that's fine).

- [ ] **Step 9: Commit**

```bash
git add website/
git commit -m "feat(website): scaffold Next.js project with Tailwind v4 theme"
```

---

### Task 2: Shared Layout — Header and Footer

**Files:**
- Create: `website/src/components/header.tsx`
- Create: `website/src/components/footer.tsx`
- Modify: `website/src/app/layout.tsx`

- [ ] **Step 1: Create `src/components/header.tsx`**

```tsx
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
```

- [ ] **Step 2: Create `src/components/footer.tsx`**

```tsx
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
              Terms & Conditions
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
```

- [ ] **Step 3: Update `src/app/layout.tsx`**

Replace the generated layout with:

```tsx
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
```

- [ ] **Step 4: Add `@` path alias to `tsconfig.json`**

Ensure `tsconfig.json` has:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

(The `create-next-app` scaffold may already include this; verify and add if missing.)

- [ ] **Step 5: Verify dev server renders the layout**

```bash
cd /home/ubuntu/projects/alarm/website && pnpm dev
```

Check that the page loads with the dark background, header with "RangeAlarm" logo, and footer.

- [ ] **Step 6: Commit**

```bash
git add website/src/components/header.tsx website/src/components/footer.tsx website/src/app/layout.tsx
git commit -m "feat(website): add shared layout with header and footer"
```

---

### Task 3: Landing Page — Hero and How It Works

**Files:**
- Create: `website/src/components/hero-section.tsx`
- Create: `website/src/components/how-it-works.tsx`
- Modify: `website/src/app/page.tsx`

- [ ] **Step 1: Create `src/components/hero-section.tsx`**

```tsx
import Link from 'next/link';
import { APP_TAGLINE, APP_STORE_URL, PLAY_STORE_URL } from '@/lib/constants';

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
            <div className="flex h-[500px] w-[260px] items-center justify-center rounded-[3rem] border-2 border-border bg-navy-700 p-4">
              <p className="text-center text-sm text-muted-foreground">
                App Screenshot
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `src/components/how-it-works.tsx`**

```tsx
const steps = [
  {
    number: '01',
    title: 'Set Your Range',
    description:
      'Pick a start time and duration from 2 to 120 minutes. Choose how often alarms fire — every 2, 5, 10, 15, or 20 minutes.',
  },
  {
    number: '02',
    title: 'Choose Your Intensity',
    description:
      'Alarms automatically progress from Gentle to Moderate to Strong to Aggressive, with distinct sounds and vibration at each tier.',
  },
  {
    number: '03',
    title: 'Wake Up Right',
    description:
      'Snooze individual alarms or dismiss them all. Set repeating schedules for specific days or use one-time alarms.',
  },
];

export function HowItWorks() {
  return (
    <section className="bg-navy-900 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-4 text-center text-3xl font-bold text-white sm:text-4xl">
          How It Works
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-charcoal-300">
          Three simple steps to better mornings.
        </p>
        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className="rounded-2xl border border-border bg-card p-8"
            >
              <span className="mb-4 inline-block text-3xl font-bold text-cyan-400">
                {step.number}
              </span>
              <h3 className="mb-3 text-xl font-semibold text-white">
                {step.title}
              </h3>
              <p className="text-charcoal-300">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Update `src/app/page.tsx`**

Replace the generated page with:

```tsx
import { HeroSection } from '@/components/hero-section';
import { HowItWorks } from '@/components/how-it-works';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorks />
    </>
  );
}
```

- [ ] **Step 4: Verify in dev server**

```bash
cd /home/ubuntu/projects/alarm/website && pnpm dev
```

Confirm hero section and how-it-works render with correct styling.

- [ ] **Step 5: Commit**

```bash
git add website/src/components/hero-section.tsx website/src/components/how-it-works.tsx website/src/app/page.tsx
git commit -m "feat(website): add hero section and how-it-works"
```

---

### Task 4: Landing Page — Features Grid, Intensity Tiers, and CTA

**Files:**
- Create: `website/src/components/features-section.tsx`
- Create: `website/src/components/intensity-tiers.tsx`
- Create: `website/src/components/cta-section.tsx`
- Modify: `website/src/app/page.tsx`

- [ ] **Step 1: Create `src/components/features-section.tsx`**

```tsx
const features = [
  {
    title: 'Intensity Progression',
    description:
      'Four tiers — Gentle, Moderate, Strong, Aggressive — with distinct sounds and vibration patterns at each level.',
  },
  {
    title: 'Flexible Duration',
    description:
      'Set alarm windows from 2 to 120 minutes. Perfect for quick naps or gradual morning wake-ups.',
  },
  {
    title: 'Configurable Intervals',
    description:
      'Alarms fire every 2, 5, 10, 15, or 20 minutes throughout your chosen duration.',
  },
  {
    title: 'Smart Snooze',
    description:
      'Snooze for 2, 5, or 10 minutes per notification. Set a max snooze limit from 1 to 10.',
  },
  {
    title: 'Repeating Schedules',
    description:
      'Set alarms for specific days of the week or use one-time alarms for naps and special occasions.',
  },
  {
    title: 'Full-Screen Alarm',
    description:
      'Alarms display over the lock screen and turn on the display so you never miss a wake-up call.',
  },
];

export function FeaturesSection() {
  return (
    <section className="px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-4 text-center text-3xl font-bold text-white sm:text-4xl">
          Everything You Need
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-charcoal-300">
          Designed to work with your sleep, not against it.
        </p>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <h3 className="mb-2 text-lg font-semibold text-white">
                {feature.title}
              </h3>
              <p className="text-sm text-charcoal-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create `src/components/intensity-tiers.tsx`**

```tsx
const tiers = [
  {
    name: 'Gentle',
    description: 'Soft chime, light vibration',
    level: 1,
  },
  {
    name: 'Moderate',
    description: 'Steady tone, rhythmic vibration',
    level: 2,
  },
  {
    name: 'Strong',
    description: 'Loud alarm, persistent vibration',
    level: 3,
  },
  {
    name: 'Aggressive',
    description: 'Maximum volume, continuous vibration',
    level: 4,
  },
];

export function IntensityTiers() {
  return (
    <section className="bg-navy-900 px-4 py-20 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <h2 className="mb-4 text-center text-3xl font-bold text-white sm:text-4xl">
          Gradual Intensity
        </h2>
        <p className="mx-auto mb-12 max-w-2xl text-center text-charcoal-300">
          Your alarm starts soft and builds up only as needed.
        </p>
        <div className="flex flex-col items-center gap-4 md:flex-row md:gap-0">
          {tiers.map((tier, i) => (
            <div key={tier.name} className="flex flex-1 flex-col items-center md:flex-row">
              <div className="flex flex-col items-center text-center">
                <div
                  className="mb-4 flex items-center justify-center rounded-full border-2 border-cyan-400 bg-cyan-400/10"
                  style={{
                    width: `${48 + tier.level * 16}px`,
                    height: `${48 + tier.level * 16}px`,
                  }}
                >
                  <div
                    className="rounded-full bg-cyan-400"
                    style={{
                      width: `${12 + tier.level * 8}px`,
                      height: `${12 + tier.level * 8}px`,
                      opacity: 0.25 + tier.level * 0.25,
                    }}
                  />
                </div>
                <h3 className="mb-1 text-lg font-semibold text-white">
                  {tier.name}
                </h3>
                <p className="text-sm text-charcoal-400">{tier.description}</p>
              </div>
              {i < tiers.length - 1 && (
                <div className="mx-4 hidden h-0.5 flex-1 bg-border md:block" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create `src/components/cta-section.tsx`**

```tsx
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
            Terms & Conditions
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Update `src/app/page.tsx` with all sections**

```tsx
import { HeroSection } from '@/components/hero-section';
import { HowItWorks } from '@/components/how-it-works';
import { FeaturesSection } from '@/components/features-section';
import { IntensityTiers } from '@/components/intensity-tiers';
import { CtaSection } from '@/components/cta-section';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <HowItWorks />
      <FeaturesSection />
      <IntensityTiers />
      <CtaSection />
    </>
  );
}
```

- [ ] **Step 5: Verify in dev server**

All 5 sections render correctly with proper responsive layout.

- [ ] **Step 6: Commit**

```bash
git add website/src/components/features-section.tsx website/src/components/intensity-tiers.tsx website/src/components/cta-section.tsx website/src/app/page.tsx
git commit -m "feat(website): add features grid, intensity tiers, and CTA sections"
```

---

### Task 5: Privacy Policy Page

**Files:**
- Create: `website/src/app/privacy/page.tsx`

- [ ] **Step 1: Create `src/app/privacy/page.tsx`**

```tsx
import type { Metadata } from 'next';
import { APP_NAME, APP_BRAND, DEVELOPER_EMAIL, EFFECTIVE_DATE, WEBSITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Privacy Policy',
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">
        Privacy Policy
      </h1>
      <p className="mb-12 text-muted-foreground">
        Effective date: {EFFECTIVE_DATE}
      </p>

      <div className="space-y-10 text-charcoal-300 [&_h2]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_p]:mb-3 [&_p]:leading-relaxed [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:leading-relaxed [&_li]:mb-1">
        <section>
          <h2>1. Introduction</h2>
          <p>
            This Privacy Policy describes how {APP_NAME} (&quot;we,&quot;
            &quot;our,&quot; or &quot;the app&quot;) collects, uses, and
            protects information when you use our mobile application. We are
            committed to protecting your privacy and being transparent about
            our data practices.
          </p>
        </section>

        <section>
          <h2>2. Information We Collect</h2>
          <p>
            {APP_NAME} is designed with privacy in mind. The app collects and
            stores only the minimum information needed to function:
          </p>
          <ul>
            <li>
              <strong>Alarm configurations:</strong> Times, durations,
              intervals, intensity settings, day selections, and labels you
              create within the app.
            </li>
            <li>
              <strong>Device locale:</strong> Your device&apos;s language
              preference, used solely to display the app in your preferred
              language.
            </li>
            <li>
              <strong>Unique identifiers:</strong> The app generates random
              UUIDs locally on your device (using the device&apos;s
              cryptographic module) to identify your alarms. These are never
              transmitted externally.
            </li>
          </ul>
          <p>
            <strong>We do NOT collect:</strong> Personal information, names,
            email addresses, location data, contacts, photos, camera or
            microphone data, browsing history, or any form of analytics or
            tracking data.
          </p>
        </section>

        <section>
          <h2>3. How We Use Information</h2>
          <p>The information stored by the app is used exclusively to:</p>
          <ul>
            <li>Schedule and deliver alarm notifications at your configured times</li>
            <li>Run background tasks to re-schedule alarms when needed</li>
            <li>Store your alarm preferences locally on your device</li>
            <li>Display the app interface in your preferred language</li>
          </ul>
        </section>

        <section>
          <h2>4. Data Storage and Security</h2>
          <p>
            All alarm data is stored locally on your device using encrypted
            storage (MMKV). Your data never leaves your device for alarm
            functionality. There is no cloud sync, no server-side storage, and
            no account system. If you uninstall the app, all data is
            permanently deleted.
          </p>
        </section>

        <section>
          <h2>5. Device Permissions</h2>
          <p>
            {APP_NAME} requests the following device permissions to function
            properly:
          </p>
          <ul>
            <li>
              <strong>Notifications:</strong> Required to deliver alarm sounds
              and alerts at your scheduled times.
            </li>
            <li>
              <strong>Exact Alarm / Schedule Exact Alarm (Android 12+):</strong>{' '}
              Required for precise alarm timing. You may need to grant this
              permission in your device Settings.
            </li>
            <li>
              <strong>Full-Screen Intent (Android):</strong> Required to
              display the alarm over your lock screen and turn on the display
              when an alarm fires.
            </li>
            <li>
              <strong>Background Tasks:</strong> Required to re-schedule
              alarms when the app is not in the foreground.
            </li>
            <li>
              <strong>Battery Optimization Exemption (Android, optional):</strong>{' '}
              Recommended to prevent the operating system from suppressing
              alarm notifications.
            </li>
          </ul>
        </section>

        <section>
          <h2>6. Third-Party Services</h2>
          <p>
            {APP_NAME} uses Expo&apos;s over-the-air (OTA) update service to
            deliver app updates. This may transmit basic device information
            (device type, OS version, app version) to Expo&apos;s servers when
            checking for updates.
          </p>
          <p>
            All alarm notifications are scheduled and delivered entirely
            on-device. No alarm data is sent to Expo&apos;s push notification
            servers or any other third-party service.
          </p>
        </section>

        <section>
          <h2>7. Children&apos;s Privacy</h2>
          <p>
            {APP_NAME} is not directed at children under the age of 13. We do
            not knowingly collect any information from children. If you believe
            a child has provided data through the app, please contact us at
            the email below.
          </p>
        </section>

        <section>
          <h2>8. Changes to This Policy</h2>
          <p>
            We may update this Privacy Policy from time to time. Changes will
            be communicated through app updates or by posting the revised
            policy on our website at{' '}
            <a href={WEBSITE_URL} className="text-cyan-400 underline hover:text-cyan-500">
              {WEBSITE_URL}
            </a>
            . Your continued use of the app after changes are posted
            constitutes acceptance of the updated policy.
          </p>
        </section>

        <section>
          <h2>9. Contact Us</h2>
          <p>
            If you have questions about this Privacy Policy, please contact us
            at{' '}
            <a
              href={`mailto:${DEVELOPER_EMAIL}`}
              className="text-cyan-400 underline hover:text-cyan-500"
            >
              {DEVELOPER_EMAIL}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the page renders**

Navigate to `/privacy` in the dev server. Confirm heading, sections, and links render correctly.

- [ ] **Step 3: Commit**

```bash
git add website/src/app/privacy/
git commit -m "feat(website): add privacy policy page"
```

---

### Task 6: Terms & Conditions Page

**Files:**
- Create: `website/src/app/terms/page.tsx`

- [ ] **Step 1: Create `src/app/terms/page.tsx`**

```tsx
import type { Metadata } from 'next';
import { APP_NAME, DEVELOPER_EMAIL, EFFECTIVE_DATE, WEBSITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Terms & Conditions',
};

export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">
        Terms &amp; Conditions
      </h1>
      <p className="mb-12 text-muted-foreground">
        Effective date: {EFFECTIVE_DATE}
      </p>

      <div className="space-y-10 text-charcoal-300 [&_h2]:mb-4 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-white [&_p]:mb-3 [&_p]:leading-relaxed [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ul]:leading-relaxed [&_li]:mb-1">
        <section>
          <h2>1. Acceptance of Terms</h2>
          <p>
            By downloading, installing, or using {APP_NAME} (&quot;the
            app&quot;), you agree to be bound by these Terms &amp; Conditions.
            If you do not agree to these terms, do not use the app.
          </p>
        </section>

        <section>
          <h2>2. Description of Service</h2>
          <p>
            {APP_NAME} is a mobile alarm application that sends a sequence of
            notifications at increasing intensity over a configurable time
            window. The app allows users to set start times, durations,
            intervals, intensity progressions, snooze options, and repeating
            schedules.
          </p>
        </section>

        <section>
          <h2>3. Use License</h2>
          <p>
            We grant you a personal, non-commercial, non-transferable,
            revocable license to use {APP_NAME} on your personal mobile
            device. You may not copy, modify, distribute, sell, or lease any
            part of the app, nor may you reverse-engineer or attempt to
            extract the source code.
          </p>
        </section>

        <section>
          <h2>4. User Responsibilities</h2>
          <p>As a user of {APP_NAME}, you are responsible for:</p>
          <ul>
            <li>
              Granting the necessary device permissions (notifications, exact
              alarm, full-screen intent, background tasks) for the app to
              function properly.
            </li>
            <li>
              On Android 12 and above, granting the Exact Alarm permission
              through your device&apos;s Settings when prompted.
            </li>
            <li>
              Understanding that alarm delivery depends on your device&apos;s
              operating system, notification settings, battery optimization
              policies, and Do Not Disturb configuration.
            </li>
            <li>
              Not relying on the app for safety-critical, life-critical, or
              medical timing purposes.
            </li>
          </ul>
        </section>

        <section>
          <h2>5. Disclaimer of Warranties</h2>
          <p>
            {APP_NAME} is provided &quot;as is&quot; and &quot;as
            available&quot; without warranties of any kind, either express or
            implied. We do not guarantee that:
          </p>
          <ul>
            <li>Alarms will fire in every scenario or on every device.</li>
            <li>
              The app will be free from interruptions, errors, or
              compatibility issues.
            </li>
            <li>
              Notifications will not be suppressed by operating system
              restrictions, battery optimization, power-saving modes, or Do
              Not Disturb settings.
            </li>
          </ul>
        </section>

        <section>
          <h2>6. Limitation of Liability</h2>
          <p>
            To the fullest extent permitted by applicable law, the developers
            of {APP_NAME} shall not be liable for any indirect, incidental,
            special, consequential, or punitive damages, including but not
            limited to missed alarms, lost time, or any damages arising from
            the use or inability to use the app.
          </p>
        </section>

        <section>
          <h2>7. Intellectual Property</h2>
          <p>
            The {APP_NAME} name, design, code, and all associated intellectual
            property are owned by the developer. Nothing in these terms grants
            you any right to use the {APP_NAME} name or branding for any
            purpose.
          </p>
        </section>

        <section>
          <h2>8. Termination</h2>
          <p>
            We reserve the right to discontinue {APP_NAME} at any time
            without notice. Upon discontinuation, your license to use the app
            is automatically terminated. Sections regarding disclaimers,
            limitations of liability, and intellectual property survive
            termination.
          </p>
        </section>

        <section>
          <h2>9. Governing Law</h2>
          <p>
            These terms shall be governed by and construed in accordance with
            applicable law. Any disputes arising from these terms or your use
            of the app shall be resolved in accordance with applicable
            jurisdiction.
          </p>
        </section>

        <section>
          <h2>10. Changes to These Terms</h2>
          <p>
            We may update these Terms &amp; Conditions from time to time.
            Changes will be communicated through app updates or by posting the
            revised terms on our website at{' '}
            <a href={WEBSITE_URL} className="text-cyan-400 underline hover:text-cyan-500">
              {WEBSITE_URL}
            </a>
            . Your continued use of the app after changes are posted
            constitutes acceptance of the updated terms.
          </p>
        </section>

        <section>
          <h2>11. Contact Us</h2>
          <p>
            If you have questions about these Terms &amp; Conditions, please
            contact us at{' '}
            <a
              href={`mailto:${DEVELOPER_EMAIL}`}
              className="text-cyan-400 underline hover:text-cyan-500"
            >
              {DEVELOPER_EMAIL}
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify the page renders**

Navigate to `/terms` in the dev server.

- [ ] **Step 3: Commit**

```bash
git add website/src/app/terms/
git commit -m "feat(website): add terms and conditions page"
```

---

### Task 7: SEO Files and Custom 404

**Files:**
- Create: `website/src/app/robots.ts`
- Create: `website/src/app/sitemap.ts`
- Create: `website/src/app/not-found.tsx`

- [ ] **Step 1: Create `src/app/robots.ts`**

```ts
import type { MetadataRoute } from 'next';
import { WEBSITE_URL } from '@/lib/constants';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${WEBSITE_URL}/sitemap.xml`,
  };
}
```

- [ ] **Step 2: Create `src/app/sitemap.ts`**

```ts
import type { MetadataRoute } from 'next';
import { WEBSITE_URL } from '@/lib/constants';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: WEBSITE_URL, lastModified: new Date(), priority: 1.0 },
    { url: `${WEBSITE_URL}/privacy`, lastModified: new Date(), priority: 0.5 },
    { url: `${WEBSITE_URL}/terms`, lastModified: new Date(), priority: 0.5 },
  ];
}
```

- [ ] **Step 3: Create `src/app/not-found.tsx`**

```tsx
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
```

- [ ] **Step 4: Commit**

```bash
git add website/src/app/robots.ts website/src/app/sitemap.ts website/src/app/not-found.tsx
git commit -m "feat(website): add robots.txt, sitemap, and custom 404 page"
```

---

### Task 8: Final Build Verification

- [ ] **Step 1: Run production build**

```bash
cd /home/ubuntu/projects/alarm/website && pnpm build
```

Expected: Build succeeds, `out/` directory is created with static HTML files.

- [ ] **Step 2: Verify static output contains all pages**

```bash
ls website/out/
ls website/out/privacy/
ls website/out/terms/
```

Expected: `index.html` in each directory, plus `robots.txt` and `sitemap.xml` in `out/`.

- [ ] **Step 3: Test with local static server**

```bash
cd /home/ubuntu/projects/alarm/website && npx serve out
```

Visit all 3 pages + a non-existent URL (triggers 404). Verify:
- All internal links work (header, footer, CTAs)
- Responsive layout at 375px, 768px, 1280px widths
- Dark navy/cyan theme renders correctly
- Legal pages have proper typography and spacing

- [ ] **Step 4: Update root `.gitignore`**

Add to the project root `.gitignore`:

```
# Website
website/.next/
website/out/
website/node_modules/
```

- [ ] **Step 5: Final commit**

```bash
git add .gitignore
git commit -m "chore: add website build artifacts to gitignore"
```
