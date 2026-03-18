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
| Nexus7API33 (Nexus 7 profile) | 7-inch tablet | To be created |
| GenericTablet10API33 | 10-inch tablet | Exists |

Note: The existing `PixelTabletAPI33` (~11") is not used because it doesn't map to standard Play Store tablet categories. We use `GenericTablet10API33` for 10" and create a new Nexus 7 AVD for 7". While the Play Store currently has a single "Tablet" screenshot slot, having both sizes gives flexibility for marketing materials and future store requirements.

### Build Variant

Use the **development** build variant (`APP_ID=com.singhalkarun.rangealarm`) for screenshot capture. Run `APP_ENV=development pnpm prebuild` if needed, then install via `adb install`. The development variant is sufficient for screenshots since the UI is identical to production.

### Screens to Capture

Seven Maestro flow files, each capturing one screen. Flows are reused across all three devices.

| # | Screen | Flow File | Output Filename |
|---|--------|-----------|-----------------|
| 1 | Home (empty) | capture-home-empty.yaml | `01-home-empty.png` |
| 2 | Home (with alarms) | capture-home-with-alarms.yaml | `02-home-with-alarms.png` |
| 3 | Create step 1 — Time | capture-create-step1.yaml | `03-create-time.png` |
| 4 | Create step 2 — Range | capture-create-step2.yaml | `04-create-range.png` |
| 5 | Create step 3 — Sound | capture-create-step3.yaml | `05-create-sound.png` |
| 6 | Create step 4 — Preview | capture-create-step4.yaml | `06-create-preview.png` |
| 7 | Ringing | capture-ringing.yaml | `07-ringing.png` |

Maestro flows receive the output directory via the `SCREENSHOT_DIR` environment variable (passed via `maestro test -e SCREENSHOT_DIR=...`). The orchestration script creates the per-device directories before running flows.

### Ringing Screen Strategy

Rather than scheduling a real alarm and waiting, use `adb shell am broadcast` to trigger the alarm BroadcastReceiver directly:

```bash
adb shell am broadcast -a com.singhalkarun.rangealarm.ALARM_FIRED \
  -n com.singhalkarun.rangealarm/expo.modules.alarmfullscreen.AlarmReceiver \
  --es label "Morning Alarm" --ei intensity 2
```

If the BroadcastReceiver requires specific extras or the intent filter doesn't support direct triggering, fall back to scheduling a 15-second alarm with an explicit Maestro timeout override (`timeout: 30000`).

### Home Screen with Alarms

The `capture-home-with-alarms.yaml` flow creates sample alarms by navigating through the create wizard. This is slow but reliable since Maestro has testIDs available (`fab-create`, `btn-next`, `btn-save`). Each alarm creation takes ~10 seconds, so 2-3 alarms adds ~30 seconds per device.

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
   - Screenshot embedded inside the frame, scaled with `object-fit: contain` to handle aspect ratio differences (e.g., Pixel 4a is 19.5:9 but Play Store expects 16:9 — screenshot is centered within the frame with dark padding)
   - Marketing headline text above in Inter font (loaded via Google Fonts CDN `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700')`) with cyan accent color
3. Puppeteer captures each rendered page as PNG at Play Store dimensions
4. Script creates output directories (`mkdir -p`) before writing

### Play Store Dimensions

| Device | Output Dimensions |
|--------|-------------------|
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
   - Wait for boot complete with polling loop:
     ```bash
     adb -s $SERIAL wait-for-device
     while [ "$(adb -s $SERIAL shell getprop sys.boot_completed 2>/dev/null)" != "1" ]; do sleep 1; done
     ```
   - Capture emulator serial from `adb devices` to target correct device with `adb -s $SERIAL` and `maestro --device $SERIAL`
   - Install the pre-built APK via `adb -s $SERIAL install`
   - Run Maestro flows with `maestro test -e SCREENSHOT_DIR=<output_dir> --device $SERIAL`
   - Kill emulator via `adb -s $SERIAL emu kill`
   - On failure: log which step failed, ensure emulator is killed (trap handler), exit with error
3. Run Puppeteer script to generate framed versions

### File Structure

```
scripts/playstore-assets/
├── generate.sh                  # Master orchestration script
├── generate-framed.js           # Puppeteer framing script
├── template.html                # HTML template for framed screenshots
├── screenshots/                 # Raw screenshots (Maestro output, gitignored)
│   ├── phone/
│   ├── tablet-7/
│   └── tablet-10/
├── framed/                      # Framed marketing screenshots (Puppeteer output, gitignored)
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

The `screenshots/` and `framed/` directories are gitignored (generated binary output). Individual pieces can be run standalone (e.g., just the Maestro flows, or just the framing script).

## Dependencies

- Android SDK with emulator (already installed)
- Maestro CLI (`pnpm install-maestro`)
- Puppeteer (to be added as devDependency)
- Inter font (loaded via Google Fonts CDN in template.html)

## Out of Scope

- Feature graphics (1024x500) — separate task
- Promotional graphics — separate task
- iOS screenshots — app is Android-first
- Localized screenshots — English only for now
