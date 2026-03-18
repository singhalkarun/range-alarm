# Play Store Screenshot Generation — Design Spec

## Overview

Automated pipeline to capture screenshots of the RangeAlarm app across three device form factors (phone, 7-inch tablet, 10-inch tablet), then generate framed marketing assets with captions for Play Store listing.

Two output types:
- **Raw screenshots** — unframed emulator captures saved per device
- **Framed screenshots** — raw screenshots placed inside CSS device frames with marketing text on a dark/cyan themed background

## Screenshot Capture (Maestro)

### Emulator Setup

Three Android Virtual Devices (API 33, x86_64):

| AVD Name | Form Factor | Status |
|----------|-------------|--------|
| Pixel4aAPI33 | Phone | Exists |
| New 7" AVD (Nexus 7 profile) | 7-inch tablet | To be created |
| GenericTablet10API33 | 10-inch tablet | Exists |

### Screens to Capture

Seven Maestro flow files, each capturing one screen. Flows are reused across all three devices.

| # | Screen | Flow File | Description |
|---|--------|-----------|-------------|
| 1 | Home (empty) | capture-home-empty.yaml | Launch app, capture empty alarm list |
| 2 | Home (with alarms) | capture-home-with-alarms.yaml | Create 2-3 sample alarms, capture populated list |
| 3 | Create step 1 — Time | capture-create-step1.yaml | Open create screen, capture time picker |
| 4 | Create step 2 — Range | capture-create-step2.yaml | Advance to range settings, capture |
| 5 | Create step 3 — Sound | capture-create-step3.yaml | Advance to sound selector, capture |
| 6 | Create step 4 — Preview | capture-create-step4.yaml | Advance to sequence preview, capture |
| 7 | Ringing | capture-ringing.yaml | Schedule short-fuse alarm, wait for it to fire, capture ringing screen |

### Ringing Screen Strategy

The ringing screen requires an actual alarm to fire. The Maestro flow will:
1. Create an alarm set 1 minute in the future
2. Save and return to home
3. Wait for the alarm to trigger
4. Capture the ringing screen

### Output

Raw PNGs saved to `scripts/playstore-assets/screenshots/{phone,tablet-7,tablet-10}/`

## Framed Marketing Assets (Puppeteer)

### Script

`scripts/playstore-assets/generate-framed.js` — a Node.js script using Puppeteer.

### Process

1. Reads raw screenshots from `screenshots/{phone,tablet-7,tablet-10}/`
2. For each screenshot, renders an HTML template (`template.html`) with:
   - Dark background matching app theme
   - CSS-only device frame (rounded rect with bezel, no external frame images)
   - Screenshot embedded inside the frame
   - Marketing headline text above in Inter font, cyan accent color
3. Puppeteer captures each rendered page as PNG at Play Store dimensions

### Play Store Dimensions

| Device | Dimensions |
|--------|-----------|
| Phone | 1080x1920 |
| 7-inch tablet | 1200x1920 |
| 10-inch tablet | 1200x1920 |

### Marketing Captions

Derived from the landing page (website/) copy:

| Screen | Caption |
|--------|---------|
| Home (empty) | "Set Once. Wake Up Right." |
| Home (with alarms) | "Manage All Your Alarms" |
| Create step 1 — Time | "Pick Your Wake-Up Time" |
| Create step 2 — Range | "Set Your Range" |
| Create step 3 — Sound | "Choose Your Intensity" |
| Create step 4 — Preview | "Preview Your Alarm Sequence" |
| Ringing | "Wake Up Gradually, Not Abruptly" |

### Output

Framed PNGs saved to `scripts/playstore-assets/framed/{phone,tablet-7,tablet-10}/`

## Orchestration

### Master Script

`scripts/playstore-assets/generate.sh` runs the full pipeline:

1. Create 7-inch tablet AVD if it doesn't exist
2. For each device (phone, tablet-7, tablet-10):
   - Boot emulator (headless with `-no-window`)
   - Wait for boot complete (`adb wait-for-device && adb shell getprop sys.boot_completed`)
   - Build and install the app
   - Run Maestro flows, capturing screenshots
   - Kill emulator
3. Run Puppeteer script to generate framed versions

### File Structure

```
scripts/playstore-assets/
├── generate.sh                  # Master orchestration script
├── generate-framed.js           # Puppeteer framing script
├── template.html                # HTML template for framed screenshots
├── screenshots/                 # Raw screenshots (Maestro output)
│   ├── phone/
│   ├── tablet-7/
│   └── tablet-10/
├── framed/                      # Framed marketing screenshots (Puppeteer output)
│   ├── phone/
│   ├── tablet-7/
│   └── tablet-10/
└── maestro/                     # Maestro flow files
    ├── capture-home-empty.yaml
    ├── capture-home-with-alarms.yaml
    ├── capture-create-step1.yaml
    ├── capture-create-step2.yaml
    ├── capture-create-step3.yaml
    ├── capture-create-step4.yaml
    └── capture-ringing.yaml
```

Individual pieces can also be run standalone (e.g., just the Maestro flows, or just the framing script).

## Dependencies

- Android SDK with emulator (already installed)
- Maestro CLI (`pnpm install-maestro`)
- Puppeteer (to be added as devDependency)
- Inter font (already used by the app)

## Out of Scope

- Feature graphics (1024x500) — separate task
- Promotional graphics — separate task
- iOS screenshots — app is Android-first
- Localized screenshots — English only for now
