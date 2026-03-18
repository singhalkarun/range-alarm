"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { toPng } from "html-to-image";

/* ── Play Store Export Sizes ─────────────────────────────── */

const PHONE_SIZES = [
  { label: "Phone", w: 1080, h: 1920 },
] as const;

const TABLET_7_SIZES = [
  { label: '7" Tablet', w: 1200, h: 1920 },
] as const;

const TABLET_10_SIZES = [
  { label: '10" Tablet', w: 1200, h: 1920 },
] as const;

type Device = "phone" | "tablet-7" | "tablet-10";

const DEVICE_SIZES: Record<Device, readonly { label: string; w: number; h: number }[]> = {
  phone: PHONE_SIZES,
  "tablet-7": TABLET_7_SIZES,
  "tablet-10": TABLET_10_SIZES,
};

/* ── Design Canvas (work at this resolution) ─────────────── */

const CANVAS: Record<Device, { w: number; h: number }> = {
  phone: { w: 1080, h: 1920 },
  "tablet-7": { w: 1200, h: 1920 },
  "tablet-10": { w: 1200, h: 1920 },
};

/* ── Design Tokens ───────────────────────────────────────── */

const T = {
  bg: "#060b14",
  bgAlt: "#0D1B2A",
  fg: "#f0f0f0",
  accent: "#00D4FF",
  accentGlow: "rgba(0,212,255,0.15)",
  muted: "#8892A0",
  card: "#1B2838",
};

/* ── Copy ────────────────────────────────────────────────── */

interface SlideConfig {
  id: string;
  screenshot: string;
  label: string;
  headline: string;
  layout: "center" | "left" | "right" | "hero";
  bgStyle: "default" | "alt" | "accent";
}

const SLIDES: SlideConfig[] = [
  {
    id: "home-empty",
    screenshot: "01-home-empty.png",
    label: "RANGE ALARM",
    headline: "Wake Up Gradually,\nNot Abruptly",
    layout: "hero",
    bgStyle: "default",
  },
  {
    id: "home-alarms",
    screenshot: "02-home-with-alarms.png",
    label: "YOUR ALARMS",
    headline: "Manage All\nYour Alarms",
    layout: "right",
    bgStyle: "alt",
  },
  {
    id: "create-time",
    screenshot: "03-create-time.png",
    label: "STEP 1",
    headline: "Pick Your\nWake-Up Time",
    layout: "center",
    bgStyle: "default",
  },
  {
    id: "create-range",
    screenshot: "04-create-range.png",
    label: "STEP 2",
    headline: "Set Your\nRange",
    layout: "left",
    bgStyle: "accent",
  },
  {
    id: "create-sound",
    screenshot: "05-create-sound.png",
    label: "STEP 3",
    headline: "Set the\nTone",
    layout: "right",
    bgStyle: "default",
  },
  {
    id: "create-preview",
    screenshot: "06-create-preview.png",
    label: "STEP 4",
    headline: "Preview Your\nAlarm Sequence",
    layout: "center",
    bgStyle: "alt",
  },
];

/* ── Android Phone Frame (CSS-only) ──────────────────────── */

function AndroidPhone({
  src,
  alt,
  style,
  className = "",
}: {
  src: string;
  alt: string;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        aspectRatio: "430/932",
        ...style,
      }}
    >
      {/* Outer bezel */}
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "8.5% / 3.9%",
          background:
            "linear-gradient(180deg, #2C2C2E 0%, #1C1C1E 50%, #2C2C2E 100%)",
          position: "relative",
          overflow: "hidden",
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.08), 0 12px 48px rgba(0,0,0,0.7), 0 0 80px rgba(0,212,255,0.06)",
        }}
      >
        {/* Side button (power) */}
        <div
          style={{
            position: "absolute",
            right: "-2.5%",
            top: "18%",
            width: "1.4%",
            height: "5.5%",
            borderRadius: "0 2px 2px 0",
            background: "#3A3A3C",
          }}
        />
        {/* Volume buttons */}
        <div
          style={{
            position: "absolute",
            left: "-2.5%",
            top: "14%",
            width: "1.4%",
            height: "4%",
            borderRadius: "2px 0 0 2px",
            background: "#3A3A3C",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: "-2.5%",
            top: "20%",
            width: "1.4%",
            height: "4%",
            borderRadius: "2px 0 0 2px",
            background: "#3A3A3C",
          }}
        />
        {/* Bezel edge highlight */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "8.5% / 3.9%",
            border: "1px solid rgba(255,255,255,0.05)",
            pointerEvents: "none",
            zIndex: 15,
          }}
        />
        {/* Screen area */}
        <div
          style={{
            position: "absolute",
            left: "3.8%",
            top: "1.8%",
            width: "92.4%",
            height: "96.4%",
            borderRadius: "6.2% / 2.8%",
            overflow: "hidden",
            background: "#000",
          }}
        >
          {/* Status bar camera punch-hole */}
          <div
            style={{
              position: "absolute",
              top: "1.2%",
              left: "50%",
              transform: "translateX(-50%)",
              width: "3%",
              height: "1.2%",
              borderRadius: "50%",
              background: "#111113",
              border: "1px solid rgba(255,255,255,0.06)",
              zIndex: 20,
            }}
          />
          <img
            src={src}
            alt={alt}
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "contain",
              objectPosition: "top",
            }}
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Android Tablet Frame (CSS-only) ─────────────────────── */

function AndroidTablet({
  src,
  alt,
  style,
  className = "",
}: {
  src: string;
  alt: string;
  style?: React.CSSProperties;
  className?: string;
}) {
  return (
    <div
      className={className}
      style={{
        position: "relative",
        aspectRatio: "770/1000",
        ...style,
      }}
    >
      <div
        style={{
          width: "100%",
          height: "100%",
          borderRadius: "5% / 3.6%",
          background:
            "linear-gradient(180deg, #2C2C2E 0%, #1C1C1E 100%)",
          position: "relative",
          overflow: "hidden",
          boxShadow:
            "inset 0 0 0 1px rgba(255,255,255,0.08), 0 12px 48px rgba(0,0,0,0.7), 0 0 80px rgba(0,212,255,0.06)",
        }}
      >
        {/* Front camera dot */}
        <div
          style={{
            position: "absolute",
            top: "1.2%",
            left: "50%",
            transform: "translateX(-50%)",
            width: "0.9%",
            height: "0.65%",
            borderRadius: "50%",
            background: "#111113",
            border: "1px solid rgba(255,255,255,0.08)",
            zIndex: 20,
          }}
        />
        {/* Bezel edge highlight */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "5% / 3.6%",
            border: "1px solid rgba(255,255,255,0.06)",
            pointerEvents: "none",
            zIndex: 15,
          }}
        />
        {/* Screen area */}
        <div
          style={{
            position: "absolute",
            left: "4%",
            top: "2.8%",
            width: "92%",
            height: "94.4%",
            borderRadius: "2.2% / 1.6%",
            overflow: "hidden",
            background: "#000",
          }}
        >
          <img
            src={src}
            alt={alt}
            style={{
              display: "block",
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "top",
            }}
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Caption Component ───────────────────────────────────── */

function Caption({
  label,
  headline,
  canvasW,
  align = "center",
}: {
  label: string;
  headline: string;
  canvasW: number;
  align?: "center" | "left" | "right";
}) {
  return (
    <div
      style={{
        textAlign: align,
        padding: `0 ${canvasW * 0.06}px`,
      }}
    >
      <div
        style={{
          fontSize: canvasW * 0.028,
          fontWeight: 600,
          color: T.accent,
          letterSpacing: "0.15em",
          marginBottom: canvasW * 0.015,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: canvasW * 0.07,
          fontWeight: 700,
          color: T.fg,
          lineHeight: 1.08,
          letterSpacing: "-0.02em",
          whiteSpace: "pre-line",
        }}
      >
        {headline}
      </div>
    </div>
  );
}

/* ── Background Variants ─────────────────────────────────── */

function SlideBackground({
  variant,
  canvasW,
  canvasH,
}: {
  variant: SlideConfig["bgStyle"];
  canvasW: number;
  canvasH: number;
}) {
  const glowSize = canvasW * 0.8;
  return (
    <>
      {/* Base gradient */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            variant === "alt"
              ? `linear-gradient(165deg, ${T.bgAlt} 0%, ${T.bg} 60%)`
              : variant === "accent"
                ? `linear-gradient(165deg, #061520 0%, ${T.bg} 55%, #0a1628 100%)`
                : `linear-gradient(175deg, ${T.bg} 0%, #0a0f1a 100%)`,
        }}
      />
      {/* Cyan glow orb */}
      <div
        style={{
          position: "absolute",
          width: glowSize,
          height: glowSize,
          borderRadius: "50%",
          background:
            variant === "accent"
              ? "radial-gradient(circle, rgba(0,212,255,0.10) 0%, transparent 70%)"
              : "radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)",
          top: variant === "alt" ? "-20%" : "10%",
          left: variant === "accent" ? "-15%" : variant === "alt" ? "40%" : "50%",
          transform: "translateX(-50%)",
          pointerEvents: "none",
        }}
      />
      {/* Secondary subtle glow */}
      {variant !== "default" && (
        <div
          style={{
            position: "absolute",
            width: glowSize * 0.6,
            height: glowSize * 0.6,
            borderRadius: "50%",
            background:
              "radial-gradient(circle, rgba(0,212,255,0.05) 0%, transparent 70%)",
            bottom: "-10%",
            right: "-10%",
            pointerEvents: "none",
          }}
        />
      )}
    </>
  );
}

/* ── Slide Layouts ───────────────────────────────────────── */

function SlideContent({
  slide,
  device,
  canvasW,
  canvasH,
}: {
  slide: SlideConfig;
  device: Device;
  canvasW: number;
  canvasH: number;
}) {
  const screenshotBase = `/screenshots/${device}`;
  const src = `${screenshotBase}/${slide.screenshot}`;
  const isTablet = device !== "phone";
  const DeviceFrame = isTablet ? AndroidTablet : AndroidPhone;

  // Phone: 68% width so it doesn't crowd the text
  // Tablets: 85% width for a bigger, more prominent screen
  const deviceWidth = isTablet ? canvasW * 0.85 : canvasW * 0.68;

  if (slide.layout === "hero") {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* App icon + tagline — top 35% */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            paddingTop: canvasH * 0.05,
            gap: canvasW * 0.018,
            zIndex: 2,
          }}
        >
          <img
            src="/app-icon.png"
            alt="Range Alarm"
            style={{
              width: canvasW * 0.13,
              height: canvasW * 0.13,
              borderRadius: canvasW * 0.028,
            }}
            draggable={false}
          />
          <Caption
            label={slide.label}
            headline={slide.headline}
            canvasW={canvasW}
          />
        </div>
        {/* Device centered, anchored to bottom, peeking up */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: "50%",
            transform: "translateX(-50%) translateY(18%)",
            width: deviceWidth,
          }}
        >
          <DeviceFrame src={src} alt={slide.headline} />
        </div>
      </div>
    );
  }

  if (slide.layout === "left") {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ paddingTop: canvasH * 0.06, zIndex: 2 }}>
          <Caption
            label={slide.label}
            headline={slide.headline}
            canvasW={canvasW}
            align="left"
          />
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: isTablet ? "2%" : "0%",
            width: deviceWidth * 0.92,
            transform: "translateY(16%)",
          }}
        >
          <DeviceFrame src={src} alt={slide.headline} />
        </div>
      </div>
    );
  }

  if (slide.layout === "right") {
    return (
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ paddingTop: canvasH * 0.06, zIndex: 2 }}>
          <Caption
            label={slide.label}
            headline={slide.headline}
            canvasW={canvasW}
            align="right"
          />
        </div>
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: isTablet ? "2%" : "0%",
            width: deviceWidth * 0.92,
            transform: "translateY(16%)",
          }}
        >
          <DeviceFrame src={src} alt={slide.headline} />
        </div>
      </div>
    );
  }

  // center layout
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <div style={{ paddingTop: canvasH * 0.05, zIndex: 2 }}>
        <Caption
          label={slide.label}
          headline={slide.headline}
          canvasW={canvasW}
        />
      </div>
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "50%",
          transform: "translateX(-50%) translateY(18%)",
          width: deviceWidth,
        }}
      >
        <DeviceFrame src={src} alt={slide.headline} />
      </div>
    </div>
  );
}

/* ── Screenshot Slide (Full Resolution) ──────────────────── */

function Slide({
  slide,
  device,
  canvasW,
  canvasH,
}: {
  slide: SlideConfig;
  device: Device;
  canvasW: number;
  canvasH: number;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: canvasW,
        height: canvasH,
        overflow: "hidden",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      <SlideBackground
        variant={slide.bgStyle}
        canvasW={canvasW}
        canvasH={canvasH}
      />
      <div style={{ position: "relative", width: "100%", height: "100%", zIndex: 1 }}>
        <SlideContent
          slide={slide}
          device={device}
          canvasW={canvasW}
          canvasH={canvasH}
        />
      </div>
    </div>
  );
}

/* ── Preview Card (Scaled Down) ──────────────────────────── */

function PreviewCard({
  slide,
  device,
  canvasW,
  canvasH,
  onExport,
}: {
  slide: SlideConfig;
  device: Device;
  canvasW: number;
  canvasH: number;
  onExport: (el: HTMLDivElement, slide: SlideConfig, index: number) => void;
  index: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.2);

  useEffect(() => {
    if (!containerRef.current) return;
    const obs = new ResizeObserver(([entry]) => {
      const containerW = entry.contentRect.width;
      setScale(containerW / canvasW);
    });
    obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, [canvasW]);

  return (
    <div
      ref={containerRef}
      style={{
        position: "relative",
        width: "100%",
        aspectRatio: `${canvasW}/${canvasH}`,
        overflow: "hidden",
        borderRadius: 12,
        border: "1px solid rgba(255,255,255,0.08)",
        cursor: "pointer",
        background: T.bg,
      }}
      onClick={() => slideRef.current && onExport(slideRef.current, slide, 0)}
      title="Click to export"
    >
      <div
        style={{
          transform: `scale(${scale})`,
          transformOrigin: "top left",
          width: canvasW,
          height: canvasH,
        }}
      >
        <div ref={slideRef}>
          <Slide
            slide={slide}
            device={device}
            canvasW={canvasW}
            canvasH={canvasH}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Feature Graphic (1024x500) ───────────────────────────── */

function FeatureGraphicContent() {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        overflow: "hidden",
        fontFamily: "'Inter', sans-serif",
        background: `linear-gradient(135deg, ${T.bg} 0%, #0D1B2A 40%, ${T.bg} 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "4%",
      }}
    >
      {/* Cyan glow */}
      <div
        style={{
          position: "absolute",
          width: "60%",
          height: "120%",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)",
          top: "-10%",
          left: "20%",
          pointerEvents: "none",
        }}
      />
      {/* App icon */}
      <img
        src="/app-icon.png"
        alt="Range Alarm"
        style={{
          width: 100,
          height: 100,
          borderRadius: 22,
          position: "relative",
          zIndex: 1,
          flexShrink: 0,
        }}
        draggable={false}
      />
      {/* Text */}
      <div style={{ position: "relative", zIndex: 1 }}>
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: T.fg,
            lineHeight: 1.1,
            letterSpacing: "-0.02em",
          }}
        >
          Range<span style={{ color: T.accent }}>Alarm</span>
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 400,
            color: T.muted,
            marginTop: 8,
          }}
        >
          Wake up gradually, not abruptly.
        </div>
      </div>
      {/* Subtle bottom line accent */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: "10%",
          width: "80%",
          height: 3,
          background: `linear-gradient(90deg, transparent, ${T.accent}, transparent)`,
          opacity: 0.4,
        }}
      />
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────── */

export default function ScreenshotsPage() {
  const [device, setDevice] = useState<Device>("phone");
  const [exporting, setExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState("");
  const exportRefs = useRef<(HTMLDivElement | null)[]>([]);

  const canvas = CANVAS[device];

  const handleExportOne = useCallback(
    async (el: HTMLDivElement, slide: SlideConfig, index: number) => {
      const sizes = DEVICE_SIZES[device];
      const size = sizes[0];
      setExporting(true);
      setExportStatus(`Exporting ${slide.id}...`);

      try {
        // Move on-screen for capture
        el.style.position = "fixed";
        el.style.left = "0px";
        el.style.top = "0px";
        el.style.zIndex = "-1";
        el.style.opacity = "1";

        const opts = {
          width: canvas.w,
          height: canvas.h,
          pixelRatio: 1,
          cacheBust: true,
        };

        // Double-call trick
        await toPng(el, opts);
        const dataUrl = await toPng(el, opts);

        // Move back
        el.style.position = "";
        el.style.left = "";
        el.style.top = "";
        el.style.zIndex = "";
        el.style.opacity = "";

        // Scale to target size if different
        const img = new Image();
        img.src = dataUrl;
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        const c = document.createElement("canvas");
        c.width = size.w;
        c.height = size.h;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0, size.w, size.h);

        const link = document.createElement("a");
        const idx = String(index + 1).padStart(2, "0");
        link.download = `${idx}-${slide.id}-${device}-${size.w}x${size.h}.png`;
        link.href = c.toDataURL("image/png");
        link.click();

        setExportStatus(`Exported ${slide.id}`);
      } catch (err) {
        console.error(err);
        setExportStatus(`Error exporting ${slide.id}`);
      } finally {
        setExporting(false);
      }
    },
    [device, canvas]
  );

  const handleExportAll = useCallback(async () => {
    setExporting(true);
    const size = DEVICE_SIZES[device][0];

    for (let i = 0; i < SLIDES.length; i++) {
      const slide = SLIDES[i];
      const el = exportRefs.current[i];
      if (!el) continue;

      setExportStatus(`Exporting ${i + 1}/${SLIDES.length}: ${slide.id}...`);

      try {
        el.style.position = "fixed";
        el.style.left = "0px";
        el.style.top = "0px";
        el.style.zIndex = "-1";
        el.style.opacity = "1";

        const opts = {
          width: canvas.w,
          height: canvas.h,
          pixelRatio: 1,
          cacheBust: true,
        };

        await toPng(el, opts);
        const dataUrl = await toPng(el, opts);

        el.style.position = "";
        el.style.left = "";
        el.style.top = "";
        el.style.zIndex = "";
        el.style.opacity = "";

        const img = new Image();
        img.src = dataUrl;
        await new Promise((resolve) => {
          img.onload = resolve;
        });

        const c = document.createElement("canvas");
        c.width = size.w;
        c.height = size.h;
        const ctx = c.getContext("2d")!;
        ctx.drawImage(img, 0, 0, size.w, size.h);

        const link = document.createElement("a");
        const idx = String(i + 1).padStart(2, "0");
        link.download = `${idx}-${slide.id}-${device}-${size.w}x${size.h}.png`;
        link.href = c.toDataURL("image/png");
        link.click();

        // Delay between exports
        await new Promise((r) => setTimeout(r, 400));
      } catch (err) {
        console.error(`Error exporting ${slide.id}:`, err);
      }
    }

    setExportStatus("All exported!");
    setExporting(false);
  }, [device, canvas]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#111",
        color: "#fff",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "rgba(17,17,17,0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          padding: "12px 24px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <h1 style={{ fontSize: 16, fontWeight: 700, marginRight: 16 }}>
          Play Store Screenshots
        </h1>

        {/* Device toggle */}
        <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: 3 }}>
          {(["phone", "tablet-7", "tablet-10"] as Device[]).map((d) => (
            <button
              key={d}
              onClick={() => setDevice(d)}
              style={{
                padding: "6px 14px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: device === d ? 600 : 400,
                background: device === d ? T.accent : "transparent",
                color: device === d ? "#000" : "#999",
                transition: "all 0.15s",
              }}
            >
              {d === "phone" ? "Phone" : d === "tablet-7" ? "7\" Tablet" : "10\" Tablet"}
            </button>
          ))}
        </div>

        {/* Export all */}
        <button
          onClick={handleExportAll}
          disabled={exporting}
          style={{
            marginLeft: "auto",
            padding: "8px 20px",
            borderRadius: 8,
            border: "none",
            cursor: exporting ? "not-allowed" : "pointer",
            fontSize: 13,
            fontWeight: 600,
            background: exporting ? "#333" : T.accent,
            color: exporting ? "#666" : "#000",
            transition: "all 0.15s",
          }}
        >
          {exporting ? "Exporting..." : "Export All"}
        </button>

        {exportStatus && (
          <span style={{ fontSize: 12, color: T.muted }}>{exportStatus}</span>
        )}
      </div>

      {/* Preview Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 20,
          padding: 24,
          maxWidth: 1400,
          margin: "0 auto",
        }}
      >
        {SLIDES.map((slide, i) => (
          <div key={`${device}-${slide.id}`}>
            <PreviewCard
              slide={slide}
              device={device}
              canvasW={canvas.w}
              canvasH={canvas.h}
              onExport={(el, s) => handleExportOne(el, s, i)}
              index={i}
            />
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: T.muted,
                textAlign: "center",
              }}
            >
              {slide.label} — Click to export
            </div>
          </div>
        ))}
      </div>

      {/* ── App Icon & Feature Graphic ──────────────────────── */}
      <div
        style={{
          borderTop: "1px solid rgba(255,255,255,0.08)",
          padding: 24,
          maxWidth: 1400,
          margin: "0 auto",
        }}
      >
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, color: T.fg }}>
          App Icon & Feature Graphic
        </h2>
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "flex-start" }}>

          {/* App Icon — 512x512 */}
          <div>
            <div
              style={{
                width: 200,
                height: 200,
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.08)",
                overflow: "hidden",
                cursor: "pointer",
                background: T.bg,
              }}
              title="Click to download 512x512"
              onClick={async () => {
                const img = new window.Image();
                img.crossOrigin = "anonymous";
                img.src = "/app-icon.png";
                await new Promise((r) => { img.onload = r; });
                const c = document.createElement("canvas");
                c.width = 512;
                c.height = 512;
                const ctx = c.getContext("2d")!;
                ctx.drawImage(img, 0, 0, 512, 512);
                const link = document.createElement("a");
                link.download = "app-icon-512x512.png";
                link.href = c.toDataURL("image/png");
                link.click();
              }}
            >
              <img
                src="/app-icon.png"
                alt="App Icon"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
                draggable={false}
              />
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: T.muted, textAlign: "center" }}>
              App Icon — 512x512 — Click to download
            </div>
          </div>

          {/* Feature Graphic — 1024x500 */}
          <div style={{ flex: 1, minWidth: 400 }}>
            <div
              style={{
                position: "relative",
                width: "100%",
                aspectRatio: "1024/500",
                borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.08)",
                overflow: "hidden",
                cursor: "pointer",
                background: T.bg,
              }}
              title="Click to download 1024x500"
              onClick={async () => {
                const el = document.getElementById("feature-graphic-export");
                if (!el) return;
                el.style.position = "fixed";
                el.style.left = "0px";
                el.style.top = "0px";
                el.style.zIndex = "-1";
                el.style.opacity = "1";
                const opts = { width: 1024, height: 500, pixelRatio: 1, cacheBust: true };
                await toPng(el, opts);
                const dataUrl = await toPng(el, opts);
                el.style.position = "";
                el.style.left = "";
                el.style.top = "";
                el.style.zIndex = "";
                el.style.opacity = "";
                const link = document.createElement("a");
                link.download = "feature-graphic-1024x500.png";
                link.href = dataUrl;
                link.click();
              }}
            >
              {/* Preview (scaled down) */}
              <FeatureGraphicContent />
            </div>
            <div style={{ marginTop: 8, fontSize: 12, color: T.muted, textAlign: "center" }}>
              Feature Graphic — 1024x500 — Click to download
            </div>
          </div>
        </div>
      </div>

      {/* Hidden full-resolution feature graphic for export */}
      <div id="feature-graphic-export" style={{ position: "absolute", left: -9999, top: 0, opacity: 0 }}>
        <div style={{ width: 1024, height: 500 }}>
          <FeatureGraphicContent />
        </div>
      </div>

      {/* Hidden full-resolution slides for export */}
      <div style={{ position: "absolute", left: -9999, top: 0, opacity: 0 }}>
        {SLIDES.map((slide, i) => (
          <div
            key={`export-${device}-${slide.id}`}
            ref={(el) => {
              exportRefs.current[i] = el;
            }}
          >
            <Slide
              slide={slide}
              device={device}
              canvasW={canvas.w}
              canvasH={canvas.h}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
