import { useEffect, useRef } from "react";

interface SponsoredSlotProps {
  /** Ad network script URL, e.g. "https://example.com/tag.min.js" */
  scriptSrc?: string;
  /** data-zone (or equivalent) attribute the network's tag expects */
  zoneId?: string;
  /** Extra data-* attributes some networks require alongside the zone id */
  dataAttrs?: Record<string, string>;
  className?: string;
}

/**
 * Isolated, self-contained sponsored slot. Deliberately separate from the
 * calculator/dashboard/chat flow: it never renders anything until a
 * scriptSrc + zoneId are actually provided, so an unconfigured <SponsoredSlot />
 * placed in a layout is inert rather than a broken/empty box.
 *
 * Only wire this up with a script confirmed to be a Banner/Native ad tag.
 * Push notification, popunder, and interstitial ad scripts should never be
 * loaded through this component (or anywhere in the app) — those formats
 * grant a third party persistent or intrusive access far beyond what a
 * financial app with authenticated user sessions should expose.
 */
export function SponsoredSlot({
  scriptSrc,
  zoneId,
  dataAttrs,
  className = "",
}: SponsoredSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!scriptSrc || !zoneId || !containerRef.current) return;

    const script = document.createElement("script");
    script.src = scriptSrc;
    script.async = true;
    script.dataset.zone = zoneId;
    if (dataAttrs) {
      for (const [key, value] of Object.entries(dataAttrs)) {
        script.setAttribute(`data-${key}`, value);
      }
    }
    containerRef.current.appendChild(script);

    return () => {
      script.remove();
    };
  }, [scriptSrc, zoneId, dataAttrs]);

  if (!scriptSrc || !zoneId) return null;

  return (
    <div
      className={`glass-card rounded-2xl border px-4 py-3 flex flex-col items-center gap-2 ${className}`}
    >
      <span className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
        Sponsored
      </span>
      <div ref={containerRef} className="w-full flex justify-center" />
    </div>
  );
}
