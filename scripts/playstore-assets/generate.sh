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
