# Play Store Screenshot Generation — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Automated pipeline to capture screenshots across phone/7"/10" emulators with Maestro and generate framed Play Store marketing assets with Puppeteer.

**Architecture:** Maestro E2E flows navigate the app and capture raw screenshots per device. A Node.js/Puppeteer script reads those screenshots, renders them inside CSS device frames with marketing captions on a dark/cyan themed background, and exports final PNGs at Play Store dimensions.

**Tech Stack:** Maestro (E2E screenshot capture), Puppeteer (HTML-to-PNG rendering), Android SDK emulator, bash orchestration.

**Spec:** `docs/superpowers/specs/2026-03-18-playstore-screenshots-design.md`

---

## File Structure

```
scripts/playstore-assets/
├── generate.sh                      # Master orchestration script
├── generate-framed.js               # Puppeteer framing script
├── template.html                    # HTML template for framed screenshots
├── screenshots/                     # Raw Maestro output (gitignored)
│   ├── phone/
│   ├── tablet-7/
│   └── tablet-10/
├── framed/                          # Framed Puppeteer output (gitignored)
│   ├── phone/
│   ├── tablet-7/
│   └── tablet-10/
└── maestro/                         # Maestro flow files
    ├── capture-home-empty.yaml
    ├── capture-home-with-alarms.yaml
    ├── capture-create-step1.yaml
    ├── capture-create-step2.yaml
    ├── capture-create-step3.yaml
    ├── capture-create-step4.yaml
    └── capture-ringing.yaml
```

---

### Task 1: Environment Setup

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Create 7-inch tablet AVD**

```bash
avdmanager create avd \
  --name Nexus7API33 \
  --package "system-images;android-33;default;x86_64" \
  --device "Nexus 7 2013" \
  --sdcard 512M
```

Expected: AVD created. Verify with `avdmanager list avd` — should show `Nexus7API33`.

- [ ] **Step 2: Install Maestro CLI**

```bash
cd /home/ubuntu/projects/alarm && pnpm install-maestro
```

Expected: Maestro installed. Verify with `~/.maestro/bin/maestro --version`.

- [ ] **Step 3: Install Puppeteer**

```bash
cd /home/ubuntu/projects/alarm && pnpm add -D puppeteer
```

Expected: `puppeteer` added to devDependencies in package.json.

- [ ] **Step 4: Update .gitignore**

Add these lines to `/home/ubuntu/projects/alarm/.gitignore`:

```
# Play Store generated assets
scripts/playstore-assets/screenshots/
scripts/playstore-assets/framed/
```

Note: The `screenshots/{phone,tablet-7,tablet-10}/` directories already exist in the repo (empty). This gitignore will ignore their contents but preserve the directories via the existing `.gitkeep` or empty state.

- [ ] **Step 5: Create framed output directories**

```bash
mkdir -p scripts/playstore-assets/framed/{phone,tablet-7,tablet-10}
```

- [ ] **Step 6: Commit**

```bash
git add .gitignore package.json pnpm-lock.yaml
git commit -m "chore: add puppeteer, update gitignore for playstore assets"
```

---

### Task 2: Maestro Flows — Home Screens

**Files:**
- Create: `scripts/playstore-assets/maestro/capture-home-empty.yaml`
- Create: `scripts/playstore-assets/maestro/capture-home-with-alarms.yaml`

**Context:** The app launches to the home screen showing a list of alarms (or empty state). testIDs: `fab-create` (create button). The app package is `com.singhalkarun.rangealarm`. Maestro `takeScreenshot` saves to the path provided. The `SCREENSHOT_DIR` env var is passed via `maestro test -e SCREENSHOT_DIR=...`.

- [ ] **Step 1: Write capture-home-empty.yaml**

```yaml
appId: com.singhalkarun.rangealarm
---
- launchApp:
    clearState: true
- waitForAnimationToEnd
- takeScreenshot: ${SCREENSHOT_DIR}/01-home-empty
```

- [ ] **Step 2: Test the flow on phone emulator**

```bash
# Boot phone emulator
$ANDROID_HOME/emulator/emulator -avd Pixel4aAPI33 -no-window -no-audio -no-boot-anim &
adb wait-for-device
while [ "$(adb shell getprop sys.boot_completed 2>/dev/null)" != "1" ]; do sleep 1; done

# Make sure app is installed (build first if needed)
# adb install <path-to-apk>

# Run flow
mkdir -p /tmp/test-screenshots
~/.maestro/bin/maestro test scripts/playstore-assets/maestro/capture-home-empty.yaml \
  -e SCREENSHOT_DIR=/tmp/test-screenshots

# Verify screenshot exists
ls -la /tmp/test-screenshots/01-home-empty.png
```

Expected: Screenshot file created showing empty alarm list.

- [ ] **Step 3: Write capture-home-with-alarms.yaml**

This flow creates 2 sample alarms by navigating the 4-step create wizard, then screenshots the home screen. testIDs used: `fab-create`, `btn-next`, `btn-save`.

```yaml
appId: com.singhalkarun.rangealarm
---
- launchApp:
    clearState: true
- waitForAnimationToEnd

# Create first alarm (use default time, just advance through steps)
- tapOn:
    id: "fab-create"
- waitForAnimationToEnd
- tapOn:
    id: "btn-next"
- waitForAnimationToEnd
- tapOn:
    id: "btn-next"
- waitForAnimationToEnd
- tapOn:
    id: "btn-next"
- waitForAnimationToEnd
- tapOn:
    id: "btn-save"
- waitForAnimationToEnd

# Create second alarm (change time slightly)
- tapOn:
    id: "fab-create"
- waitForAnimationToEnd
- tapOn:
    id: "hour-up"
- tapOn:
    id: "btn-next"
- waitForAnimationToEnd
- tapOn:
    id: "btn-next"
- waitForAnimationToEnd
- tapOn:
    id: "btn-next"
- waitForAnimationToEnd
- tapOn:
    id: "btn-save"
- waitForAnimationToEnd

# Screenshot the populated home screen
- takeScreenshot: ${SCREENSHOT_DIR}/02-home-with-alarms
```

- [ ] **Step 4: Test the flow**

```bash
~/.maestro/bin/maestro test scripts/playstore-assets/maestro/capture-home-with-alarms.yaml \
  -e SCREENSHOT_DIR=/tmp/test-screenshots
ls -la /tmp/test-screenshots/02-home-with-alarms.png
```

Expected: Screenshot showing home screen with 2 alarm cards.

- [ ] **Step 5: Commit**

```bash
git add scripts/playstore-assets/maestro/capture-home-empty.yaml \
       scripts/playstore-assets/maestro/capture-home-with-alarms.yaml
git commit -m "feat: add Maestro flows for home screen screenshots"
```

---

### Task 3: Maestro Flows — Create Wizard Steps

**Files:**
- Create: `scripts/playstore-assets/maestro/capture-create-step1.yaml`
- Create: `scripts/playstore-assets/maestro/capture-create-step2.yaml`
- Create: `scripts/playstore-assets/maestro/capture-create-step3.yaml`
- Create: `scripts/playstore-assets/maestro/capture-create-step4.yaml`

**Context:** The create screen is a 4-step wizard. Step 1 = TimePicker, Step 2 = Range/Duration/Interval/Snooze settings, Step 3 = SoundSelector, Step 4 = SequencePreview + DaySelector. Navigate with `btn-next`. Each flow launches app fresh, opens create, and navigates to the target step.

- [ ] **Step 1: Write capture-create-step1.yaml**

```yaml
appId: com.singhalkarun.rangealarm
---
- launchApp:
    clearState: true
- waitForAnimationToEnd
- tapOn:
    id: "fab-create"
- waitForAnimationToEnd
- takeScreenshot: ${SCREENSHOT_DIR}/03-create-time
```

- [ ] **Step 2: Write capture-create-step2.yaml**

```yaml
appId: com.singhalkarun.rangealarm
---
- launchApp:
    clearState: true
- waitForAnimationToEnd
- tapOn:
    id: "fab-create"
- waitForAnimationToEnd
- tapOn:
    id: "btn-next"
- waitForAnimationToEnd
- takeScreenshot: ${SCREENSHOT_DIR}/04-create-range
```

- [ ] **Step 3: Write capture-create-step3.yaml**

```yaml
appId: com.singhalkarun.rangealarm
---
- launchApp:
    clearState: true
- waitForAnimationToEnd
- tapOn:
    id: "fab-create"
- waitForAnimationToEnd
- tapOn:
    id: "btn-next"
- waitForAnimationToEnd
- tapOn:
    id: "btn-next"
- waitForAnimationToEnd
- takeScreenshot: ${SCREENSHOT_DIR}/05-create-sound
```

- [ ] **Step 4: Write capture-create-step4.yaml**

```yaml
appId: com.singhalkarun.rangealarm
---
- launchApp:
    clearState: true
- waitForAnimationToEnd
- tapOn:
    id: "fab-create"
- waitForAnimationToEnd
- tapOn:
    id: "btn-next"
- waitForAnimationToEnd
- tapOn:
    id: "btn-next"
- waitForAnimationToEnd
- tapOn:
    id: "btn-next"
- waitForAnimationToEnd
- takeScreenshot: ${SCREENSHOT_DIR}/06-create-preview
```

- [ ] **Step 5: Test all create flows**

```bash
for flow in scripts/playstore-assets/maestro/capture-create-step{1,2,3,4}.yaml; do
  echo "Testing $flow..."
  ~/.maestro/bin/maestro test "$flow" -e SCREENSHOT_DIR=/tmp/test-screenshots
done
ls -la /tmp/test-screenshots/0{3,4,5,6}-*.png
```

Expected: 4 screenshots created: `03-create-time.png`, `04-create-range.png`, `05-create-sound.png`, `06-create-preview.png`.

- [ ] **Step 6: Commit**

```bash
git add scripts/playstore-assets/maestro/capture-create-step{1,2,3,4}.yaml
git commit -m "feat: add Maestro flows for create wizard screenshots"
```

---

### Task 4: Maestro Flow — Ringing Screen

**Files:**
- Create: `scripts/playstore-assets/maestro/capture-ringing.yaml`

**Context:** The ringing screen is shown when an alarm fires. The `AlarmReceiver` is declared with `android:exported="false"` and requires a valid `entryId` in `AlarmStorage`, so `adb shell am broadcast` from outside the app won't work. Instead, we create a real alarm via the UI that fires shortly in the future and wait for the ringing screen to appear.

Strategy: Create an alarm, save it, then wait for the ringing screen elements (`btn-im-up`) to become visible. The alarm will fire based on the time set in the time picker. We use the default time (which is the current time) — since the alarm is set for "now" or the next occurrence, it should fire within ~60 seconds. Use Maestro's `assertVisible` with a long timeout to wait.

- [ ] **Step 1: Write capture-ringing.yaml**

```yaml
appId: com.singhalkarun.rangealarm
---
- launchApp:
    clearState: true
- waitForAnimationToEnd

# Create an alarm with default settings (fires at the next matching time)
- tapOn:
    id: "fab-create"
- waitForAnimationToEnd
- tapOn:
    id: "btn-next"
- waitForAnimationToEnd
- tapOn:
    id: "btn-next"
- waitForAnimationToEnd
- tapOn:
    id: "btn-next"
- waitForAnimationToEnd
- tapOn:
    id: "btn-save"
- waitForAnimationToEnd

# Wait for the ringing screen to appear (alarm fires)
# The "I'm Up" button is only visible on the ringing screen
- assertVisible:
    id: "btn-im-up"
    timeout: 120000

# Capture the ringing screen
- takeScreenshot: ${SCREENSHOT_DIR}/07-ringing

# Dismiss the alarm so it doesn't keep ringing
- tapOn:
    id: "btn-im-up"
```

- [ ] **Step 2: Test the ringing capture**

This is the trickiest flow. Test manually to verify timing works:

```bash
# With emulator already running and app installed:
mkdir -p /tmp/test-screenshots
~/.maestro/bin/maestro test scripts/playstore-assets/maestro/capture-ringing.yaml \
  -e SCREENSHOT_DIR=/tmp/test-screenshots

# Verify
ls -la /tmp/test-screenshots/07-ringing.png
```

Expected: Flow waits for alarm to fire (up to 2 minutes), captures ringing screen, then dismisses. If the default time doesn't trigger quickly enough, the flow will need adjustment — consider manipulating the time picker to set a time ~1 minute in the future before saving.

- [ ] **Step 3: Commit**

```bash
git add scripts/playstore-assets/maestro/capture-ringing.yaml
git commit -m "feat: add Maestro flow for ringing screen screenshot"
```

---

### Task 5: Orchestration Script

**Files:**
- Create: `scripts/playstore-assets/generate.sh`

**Context:** This script boots each emulator sequentially, installs the app, runs all Maestro flows, captures screenshots to the per-device directory, then kills the emulator. It uses `adb -s $SERIAL` to target the correct emulator. AVD names: `Pixel4aAPI33`, `Nexus7API33`, `GenericTablet10API33`. Output dirs map to `phone`, `tablet-7`, `tablet-10`.

- [ ] **Step 1: Write generate.sh**

```bash
#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
MAESTRO="$HOME/.maestro/bin/maestro"
EMULATOR="$ANDROID_HOME/emulator/emulator"
ADB="$ANDROID_HOME/platform-tools/adb"

# Device configurations: AVD_NAME:OUTPUT_DIR
DEVICES=(
  "Pixel4aAPI33:phone"
  "Nexus7API33:tablet-7"
  "GenericTablet10API33:tablet-10"
)

# Ensure Nexus7API33 AVD exists
if ! avdmanager list avd 2>/dev/null | grep -q "Nexus7API33"; then
  echo "Creating Nexus7API33 AVD..."
  avdmanager create avd --name Nexus7API33 \
    --package "system-images;android-33;default;x86_64" \
    --device "Nexus 7 2013" --sdcard 512M --force
fi

# Find the APK (development build)
APK_PATH=""
find_apk() {
  local candidates=(
    "$PROJECT_DIR/android/app/build/outputs/apk/debug/app-debug.apk"
    "$PROJECT_DIR/android/app/build/outputs/apk/release/app-release.apk"
  )
  for candidate in "${candidates[@]}"; do
    if [[ -f "$candidate" ]]; then
      APK_PATH="$candidate"
      return
    fi
  done
  echo "ERROR: No APK found. Run 'pnpm prebuild:development' then build."
  exit 1
}

# Wait for emulator to fully boot
wait_for_boot() {
  local serial="$1"
  echo "  Waiting for boot..."
  "$ADB" -s "$serial" wait-for-device
  while [ "$("$ADB" -s "$serial" shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" != "1" ]; do
    sleep 1
  done
  sleep 5
  echo "  Boot complete."
}

# Get emulator serial from running devices (uses process substitution to avoid subshell)
get_serial() {
  local avd_name="$1"
  while read -r serial _; do
    [[ "$serial" == emulator-* ]] || continue
    local name
    name=$("$ADB" -s "$serial" emu avd name 2>/dev/null | head -1 | tr -d '\r')
    if [[ "$name" == "$avd_name" ]]; then
      echo "$serial"
      return
    fi
  done < <("$ADB" devices | tail -n +2)
}

# Cleanup on exit
cleanup() {
  echo "Cleaning up emulators..."
  while read -r serial _; do
    [[ "$serial" == emulator-* ]] || continue
    "$ADB" -s "$serial" emu kill 2>/dev/null || true
  done < <("$ADB" devices | tail -n +2)
}
trap cleanup EXIT

echo "=== Play Store Screenshot Generator ==="
echo ""

find_apk
echo "Using APK: $APK_PATH"
echo ""

for device_config in "${DEVICES[@]}"; do
  IFS=':' read -r avd_name output_dir <<< "$device_config"
  screenshot_dir="$SCRIPT_DIR/screenshots/$output_dir"
  mkdir -p "$screenshot_dir"

  echo "--- Device: $avd_name ($output_dir) ---"

  # Boot emulator
  echo "  Booting emulator..."
  "$EMULATOR" -avd "$avd_name" -no-window -no-audio -no-boot-anim -gpu swiftshader_indirect &
  EMULATOR_PID=$!

  # Poll for emulator serial (up to 120 seconds)
  SERIAL=""
  for i in $(seq 1 60); do
    SERIAL=$(get_serial "$avd_name")
    if [[ -n "$SERIAL" ]]; then break; fi
    sleep 2
  done

  if [[ -z "$SERIAL" ]]; then
    echo "  ERROR: Could not find serial for $avd_name after 120s"
    kill "$EMULATOR_PID" 2>/dev/null || true
    continue
  fi
  echo "  Serial: $SERIAL"

  # Wait for boot
  wait_for_boot "$SERIAL"

  # Install app
  echo "  Installing app..."
  "$ADB" -s "$SERIAL" install -r "$APK_PATH"

  # Run Maestro flows
  echo "  Running Maestro flows..."
  for flow in "$SCRIPT_DIR/maestro"/capture-*.yaml; do
    flow_name=$(basename "$flow" .yaml)
    echo "    Running $flow_name..."
    "$MAESTRO" --device "$SERIAL" test "$flow" \
      -e SCREENSHOT_DIR="$screenshot_dir" || {
      echo "    WARNING: $flow_name failed, continuing..."
    }
  done

  # Kill emulator
  echo "  Shutting down emulator..."
  "$ADB" -s "$SERIAL" emu kill 2>/dev/null || true
  wait "$EMULATOR_PID" 2>/dev/null || true
  sleep 3

  echo "  Screenshots saved to: $screenshot_dir"
  ls -la "$screenshot_dir"/*.png 2>/dev/null || echo "  (no screenshots found)"
  echo ""
done

echo "=== Raw screenshots complete ==="
echo ""

# Generate framed versions
echo "=== Generating framed screenshots ==="
node "$SCRIPT_DIR/generate-framed.js"
echo "=== Done ==="
```

- [ ] **Step 2: Make it executable**

```bash
chmod +x scripts/playstore-assets/generate.sh
```

- [ ] **Step 3: Commit**

```bash
git add scripts/playstore-assets/generate.sh
git commit -m "feat: add orchestration script for screenshot generation"
```

---

### Task 6: HTML Template for Framed Screenshots

**Files:**
- Create: `scripts/playstore-assets/template.html`

**Context:** This HTML template is rendered by Puppeteer for each screenshot. It receives data via query params or JS injection: the screenshot image path, caption text, and device type (phone/tablet). Dark background (#0a0a0a), cyan accent (#22d3ee), Inter font from Google Fonts CDN. CSS-only device frame (rounded rect with subtle bezel).

- [ ] **Step 1: Write template.html**

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', sans-serif;
      background: #0a0a0a;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 40px 20px;
      overflow: hidden;
    }

    .caption {
      color: #22d3ee;
      font-size: 48px;
      font-weight: 700;
      text-align: center;
      margin-bottom: 40px;
      letter-spacing: -0.02em;
      max-width: 80%;
      line-height: 1.2;
    }

    .device-frame {
      position: relative;
      background: #1a1a2e;
      border-radius: 40px;
      padding: 12px;
      box-shadow:
        0 0 0 2px rgba(255,255,255,0.08),
        0 25px 50px rgba(0,0,0,0.5),
        0 0 100px rgba(34,211,238,0.05);
    }

    .device-frame.tablet {
      border-radius: 28px;
      padding: 10px;
    }

    .screen {
      border-radius: 30px;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #000;
    }

    .device-frame.tablet .screen {
      border-radius: 20px;
    }

    .screen img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }

    /* Screen dimensions scaled to fill viewport nicely.
       Viewport is set to Play Store output size by Puppeteer.
       Caption takes ~15% of height, frame bezel adds ~24px,
       so screen height ≈ 70% of viewport height. */

    /* Phone (viewport: 1080x1920) */
    .device-frame.phone .screen {
      width: 68vw;
      height: 72vh;
    }

    /* 7-inch tablet (viewport: 1200x1920) */
    .device-frame.tablet-7 .screen {
      width: 72vw;
      height: 68vh;
    }

    /* 10-inch tablet (viewport: 1200x1920) */
    .device-frame.tablet-10 .screen {
      width: 74vw;
      height: 68vh;
    }
  </style>
</head>
<body>
  <div class="caption" id="caption"></div>
  <div class="device-frame" id="device-frame">
    <div class="screen">
      <img id="screenshot" src="" alt="App screenshot">
    </div>
  </div>

  <script>
    // These values are injected by Puppeteer via page.evaluate()
    // They are set before the screenshot is taken
  </script>
</body>
</html>
```

- [ ] **Step 2: Commit**

```bash
git add scripts/playstore-assets/template.html
git commit -m "feat: add HTML template for framed Play Store screenshots"
```

---

### Task 7: Puppeteer Framing Script

**Files:**
- Create: `scripts/playstore-assets/generate-framed.js`

**Context:** This script reads raw screenshots from `screenshots/{phone,tablet-7,tablet-10}/`, renders each one inside the HTML template with the appropriate caption and device frame, and saves the framed output to `framed/{phone,tablet-7,tablet-10}/`.

Captions map (filename → caption):
- `01-home-empty` → "Set Once. Wake Up Right."
- `02-home-with-alarms` → "Manage All Your Alarms"
- `03-create-time` → "Pick Your Wake-Up Time"
- `04-create-range` → "Set Your Range"
- `05-create-sound` → "Choose Your Intensity"
- `06-create-preview` → "Preview Your Alarm Sequence"
- `07-ringing` → "Wake Up Gradually, Not Abruptly"

Play Store output dimensions:
- phone: 1080x1920
- tablet-7: 1200x1920
- tablet-10: 1200x1920

- [ ] **Step 1: Write generate-framed.js**

```javascript
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

const SCRIPT_DIR = __dirname;
const TEMPLATE_PATH = path.join(SCRIPT_DIR, 'template.html');

const CAPTIONS = {
  '01-home-empty': 'Set Once. Wake Up Right.',
  '02-home-with-alarms': 'Manage All Your Alarms',
  '03-create-time': 'Pick Your Wake-Up Time',
  '04-create-range': 'Set Your Range',
  '05-create-sound': 'Choose Your Intensity',
  '06-create-preview': 'Preview Your Alarm Sequence',
  '07-ringing': 'Wake Up Gradually, Not Abruptly',
};

const DEVICES = [
  { dir: 'phone', cssClass: 'phone', width: 1080, height: 1920 },
  { dir: 'tablet-7', cssClass: 'tablet tablet-7', width: 1200, height: 1920 },
  { dir: 'tablet-10', cssClass: 'tablet tablet-10', width: 1200, height: 1920 },
];

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  for (const device of DEVICES) {
    const inputDir = path.join(SCRIPT_DIR, 'screenshots', device.dir);
    const outputDir = path.join(SCRIPT_DIR, 'framed', device.dir);
    fs.mkdirSync(outputDir, { recursive: true });

    if (!fs.existsSync(inputDir)) {
      console.log(`Skipping ${device.dir}: no screenshots directory`);
      continue;
    }

    const screenshots = fs.readdirSync(inputDir).filter(f => f.endsWith('.png'));
    if (screenshots.length === 0) {
      console.log(`Skipping ${device.dir}: no screenshots found`);
      continue;
    }

    console.log(`Processing ${device.dir} (${screenshots.length} screenshots)...`);

    for (const filename of screenshots) {
      const baseName = path.basename(filename, '.png');
      const caption = CAPTIONS[baseName] || baseName;
      const screenshotPath = path.join(inputDir, filename);
      const outputPath = path.join(outputDir, filename);

      const page = await browser.newPage();
      await page.setViewport({
        width: device.width,
        height: device.height,
        deviceScaleFactor: 1,
      });

      // Load the template
      await page.goto(`file://${TEMPLATE_PATH}`, { waitUntil: 'networkidle0' });

      // Inject the screenshot and caption
      const screenshotDataUrl = `data:image/png;base64,${fs.readFileSync(screenshotPath).toString('base64')}`;

      await page.evaluate(({ caption, screenshotDataUrl, cssClass }) => {
        document.getElementById('caption').textContent = caption;
        document.getElementById('screenshot').src = screenshotDataUrl;
        const frame = document.getElementById('device-frame');
        frame.className = `device-frame ${cssClass}`;
      }, { caption, screenshotDataUrl, cssClass: device.cssClass });

      // Wait for font and image to load
      await page.waitForFunction(() => {
        return document.fonts.ready.then(() => {
          const img = document.getElementById('screenshot');
          return img.complete && img.naturalWidth > 0;
        });
      }, { timeout: 10000 });

      // Take screenshot
      await page.screenshot({ path: outputPath, type: 'png' });
      await page.close();

      console.log(`  ${baseName} → ${outputPath}`);
    }
  }

  await browser.close();
  console.log('Done!');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
```

- [ ] **Step 2: Test with a dummy screenshot**

Create a dummy screenshot to verify the framing works:

```bash
# Create a simple test image (solid color, phone-sized)
convert -size 1080x2340 xc:'#0a0a0a' /tmp/test-phone.png 2>/dev/null || \
  python3 -c "
from PIL import Image
img = Image.new('RGB', (1080, 2340), (10, 10, 10))
img.save('/tmp/test-phone.png')
" 2>/dev/null || \
  echo "No image tool available, skip visual test"

# If we have a test image, copy it and run
if [[ -f /tmp/test-phone.png ]]; then
  cp /tmp/test-phone.png scripts/playstore-assets/screenshots/phone/01-home-empty.png
  node scripts/playstore-assets/generate-framed.js
  ls -la scripts/playstore-assets/framed/phone/01-home-empty.png
  rm scripts/playstore-assets/screenshots/phone/01-home-empty.png
  rm scripts/playstore-assets/framed/phone/01-home-empty.png
fi
```

Expected: Framed PNG created at the correct dimensions (1080x1920).

- [ ] **Step 3: Commit**

```bash
git add scripts/playstore-assets/generate-framed.js
git commit -m "feat: add Puppeteer script for framed Play Store screenshots"
```

---

### Task 8: End-to-End Test Run

**Context:** Run the full pipeline on one device (phone) to verify everything works end-to-end before running all three devices.

- [ ] **Step 1: Build the development APK**

```bash
cd /home/ubuntu/projects/alarm
pnpm prebuild:development
cd android && ./gradlew assembleDebug
cd ..
```

Expected: APK at `android/app/build/outputs/apk/debug/app-debug.apk`.

- [ ] **Step 2: Run single-device test**

```bash
# Boot phone emulator
$ANDROID_HOME/emulator/emulator -avd Pixel4aAPI33 -no-window -no-audio -no-boot-anim -gpu swiftshader_indirect &
sleep 15
adb wait-for-device
while [ "$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r')" != "1" ]; do sleep 1; done

# Install
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Run one flow to verify (use absolute path for SCREENSHOT_DIR)
SCREENSHOT_DIR="$(pwd)/scripts/playstore-assets/screenshots/phone"
mkdir -p "$SCREENSHOT_DIR"
~/.maestro/bin/maestro test scripts/playstore-assets/maestro/capture-home-empty.yaml \
  -e SCREENSHOT_DIR="$SCREENSHOT_DIR"

# Check output
ls -la scripts/playstore-assets/screenshots/phone/

# Kill emulator
adb emu kill
```

Expected: `01-home-empty.png` exists in the screenshots directory.

- [ ] **Step 3: Run framing on the captured screenshot**

```bash
node scripts/playstore-assets/generate-framed.js
ls -la scripts/playstore-assets/framed/phone/
```

Expected: `01-home-empty.png` in framed directory with device frame and caption.

- [ ] **Step 4: If single-device works, run the full pipeline**

```bash
./scripts/playstore-assets/generate.sh
```

Expected: All screenshots captured across all 3 devices, framed versions generated.

- [ ] **Step 5: Verify outputs**

```bash
echo "=== Raw Screenshots ==="
find scripts/playstore-assets/screenshots -name "*.png" | sort
echo ""
echo "=== Framed Screenshots ==="
find scripts/playstore-assets/framed -name "*.png" | sort
```

Expected: 7 screenshots per device (21 raw + 21 framed = 42 total PNGs).

- [ ] **Step 6: Commit any flow adjustments**

```bash
git add scripts/playstore-assets/maestro/
git commit -m "fix: adjust Maestro flows based on e2e test results"
```
