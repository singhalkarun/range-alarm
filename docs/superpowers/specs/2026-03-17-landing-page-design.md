# Range Alarm Landing Page Website — Design Spec

**Date:** 2026-03-17
**Status:** Final

## Context

Range Alarm needs a public web presence: a landing page to promote the app and direct users to app store downloads, plus legally required privacy policy and terms of service pages. These pages will be a separate static website in the `website/` directory, built with Next.js 15 and styled to match the app's dark navy/cyan theme.

## Architecture

- **Framework:** Next.js 15 (App Router, TypeScript)
- **Styling:** TailwindCSS v4, dark-mode only, colors ported from the app's `src/global.css`
- **Output:** Static export (`output: 'export'`) — no Node.js server needed
- **Location:** `website/` at the project root
- **Font:** Inter (via `next/font/google`)
- **Pages:** `/` (landing), `/privacy` (privacy policy), `/terms` (terms & conditions)

## Next.js Configuration

**`next.config.ts`:**
- `output: 'export'` — static site generation
- `images: { unoptimized: true }` — required for static export (no image optimization server)

**`postcss.config.mjs`:**
```js
export default { plugins: { '@tailwindcss/postcss': {} } }
```

**`tailwind.css`** (Tailwind v4 theme entry):
Uses `@theme` block to define custom color tokens (see Color Theme section below). Imported in `layout.tsx`.

## Project Structure

```
website/
├── public/
│   ├── favicon.ico
│   └── og-image.png
├── src/
│   ├── app/
│   │   ├── layout.tsx            # Root layout (font, metadata, header, footer)
│   │   ├── page.tsx              # Landing page
│   │   ├── privacy/
│   │   │   └── page.tsx          # Privacy policy
│   │   └── terms/
│   │       └── page.tsx          # Terms & conditions
│   ├── components/
│   │   ├── header.tsx            # Sticky nav
│   │   ├── footer.tsx            # Site footer
│   │   ├── hero-section.tsx      # Landing hero
│   │   ├── features-section.tsx  # Feature cards grid
│   │   ├── how-it-works.tsx      # 3-step explainer
│   │   ├── intensity-tiers.tsx   # Tier progression visual
│   │   └── cta-section.tsx       # Bottom call-to-action
│   └── lib/
│       └── constants.ts          # Centralized strings and URLs
├── src/app/
│   ├── robots.ts                 # SEO: robots.txt generation
│   ├── sitemap.ts                # SEO: sitemap.xml generation
│   └── not-found.tsx             # Custom 404 page (dark theme)
├── next.config.ts
├── tailwind.css                  # Tailwind v4 theme entry
├── postcss.config.mjs
├── tsconfig.json
└── package.json
```

## Color Theme

Ported from the app's `src/global.css`:

| Token | Value | Usage |
|-------|-------|-------|
| navy-900 | `#060b14` | Header, alternating sections |
| navy-800 | `#0D1B2A` | Primary page background |
| navy-700 | `#1B2838` | Cards, panels |
| navy-600 | `#243447` | Muted backgrounds |
| cyan-400 | `#00D4FF` | Primary accent, CTAs, logo |
| cyan-500 | `#00bfe6` | Hover states |
| cyan-600 | `#00a8cc` | Active states |
| charcoal-50 | `#F2F2F2` | Headings |
| charcoal-300 | `#B0B0B0` | Body text |
| charcoal-400 | `#969696` | Muted text |

## Landing Page Sections

### 1. Hero Section
- **Heading:** "Wake Up Gradually, Not Abruptly"
- **Secondary tagline:** "Set once. Wake up right." (matching the app's branding)
- **Subtext:** Explains the concept — set a time range, choose intensity progression, wake gradually
- **CTAs:** App Store + Google Play buttons (placeholder `#` links)
- **Visual:** Phone mockup placeholder area
- **Layout:** Stacked on mobile, side-by-side on `md:`+

### 2. How It Works
Three numbered cards:
1. **Set Your Range** — Pick start time and duration (2-120 minutes), choose alarm interval
2. **Choose Your Intensity** — Alarms progress from Gentle → Moderate → Strong → Aggressive
3. **Wake Up Right** — Snooze individual alarms or dismiss all, set repeating schedules

### 3. Features Grid
Six cards in responsive grid (`sm:grid-cols-2`, `lg:grid-cols-3`):
- Intensity Progression — 4 tiers with distinct sounds and vibration
- Flexible Duration — 2 to 120 minute alarm windows
- Configurable Intervals — Every 2, 5, 10, 15, or 20 minutes
- Smart Snooze — Snooze for 2, 5, or 10 minutes with configurable snooze limits (1-10 max)
- Repeating Schedules — Set alarms for specific days or one-time
- Full-Screen Alarm — Wakes over lock screen (Android)

### 4. Intensity Tiers Visual
Horizontal progression showing the four tiers with visual indicators (progressively larger/brighter cyan elements): Gentle → Moderate → Strong → Aggressive

### 5. Bottom CTA
- **Heading:** "Ready to wake up better?"
- Repeat App Store / Google Play buttons
- Links to Privacy Policy and Terms

## Privacy Policy Page (`/privacy`)

Template content with these sections:

1. **Introduction** — App name, developer, effective date
2. **Information We Collect** — Alarm configs only; device locale (for language preferences); crypto module used only for local UUID generation. Explicitly state NO personal data, location, contacts, photos, camera, microphone collected
3. **How We Use Information** — Schedule local notifications, run background tasks, store preferences locally
4. **Data Storage and Security** — All data stored locally on device (MMKV encrypted storage), no cloud sync, no server-side storage
5. **Device Permissions** — Notifications, Exact Alarm / Schedule Exact Alarm (Android 12+, required for precise timing), Full-Screen Intent (Android, displays alarm over lock screen and turns on screen), Background Task, Battery Optimization Exemption (Android, optional)
6. **Third-Party Services** — Expo OTA updates (for delivering app updates). Note: all notifications are scheduled locally on-device; no data is sent to Expo push notification servers
7. **Children's Privacy** — Not directed at children under 13
8. **Changes to This Policy** — Communication via app update / website
9. **Contact Information** — Developer email placeholder

## Terms & Conditions Page (`/terms`)

Template content with these sections:

1. **Acceptance of Terms**
2. **Description of Service**
3. **Use License** — Personal, non-commercial, non-transferable
4. **User Responsibilities** — Grant required permissions (including Exact Alarm on Android 12+ via Settings), understand OS limitations, not for safety-critical timing
5. **Disclaimer of Warranties** — "As is", no guarantee alarms fire in every scenario (OS restrictions, DND, battery optimization)
6. **Limitation of Liability**
7. **Intellectual Property**
8. **Termination** — Developer may discontinue at any time
9. **Governing Law** — Placeholder jurisdiction
10. **Changes to Terms**
11. **Contact Information**

## SEO & Metadata

**Per-page metadata** (via Next.js `metadata` export):
- `/` — Title: "Range Alarm — Wake Up Gradually", description of the app concept, OG image
- `/privacy` — Title: "Privacy Policy — Range Alarm"
- `/terms` — Title: "Terms & Conditions — Range Alarm"

**Open Graph tags:** og:title, og:description, og:image (placeholder `og-image.png`), og:type (website), Twitter card (summary_large_image)

**`robots.ts`:** Allow all crawlers, reference sitemap
**`sitemap.ts`:** List all 3 pages with base URL from constants (placeholder until domain is set)

## Shared Layout

### Header
- Sticky top navigation with backdrop blur
- Left: "RangeAlarm" text in cyan-400, bold
- Right: Privacy, Terms links + Download CTA button
- Background: navy-900

### Footer
- App name + copyright year
- Links: Privacy Policy, Terms & Conditions
- App store link placeholders
- Muted text color

## Responsive Design
- Mobile-first with Tailwind responsive prefixes
- Container: `max-w-6xl mx-auto px-4 sm:px-6 lg:px-8`
- Hero: stacked → side-by-side at `md:`
- Features: 1 col → 2 cols at `sm:` → 3 cols at `lg:`
- Legal pages: single column, `max-w-3xl mx-auto`, generous spacing

## Dependencies

```json
{
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.1.0",
    "react-dom": "^19.1.0"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.1.0",
    "@types/react-dom": "^19.1.0",
    "tailwindcss": "^4.1.0",
    "typescript": "^5.9.0"
  }
}
```

## Key Source Files to Reference

- `src/global.css` — Color tokens to port
- `src/features/alarm/constants.ts` — Feature values for accurate marketing copy
- `src/features/alarm/types.ts` — Alarm/IntensityTier types for content accuracy
- `src/features/alarm/screens/home-screen.tsx` — Brand presentation ("RangeAlarm" logo, tagline)
- `app.config.ts` — Permission declarations for privacy policy content

## Verification

1. Run `cd website && pnpm dev` — all 3 pages render correctly
2. Run `cd website && pnpm build` — static export succeeds, produces `out/` directory
3. Verify responsive layout at mobile (375px), tablet (768px), desktop (1280px)
4. Verify all internal links work (header nav, footer links, CTA links)
5. Verify color theme matches the app's dark navy/cyan aesthetic
