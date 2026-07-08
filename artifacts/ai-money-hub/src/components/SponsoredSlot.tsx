import { useEffect, useRef } from "react";

declare global {
  interface Window {
    aclib?: {
      runBanner: (opts: { zoneId: string }) => void;
    };
  }
}

interface SponsoredSlotProps {
  /** Ad network script URL, e.g. "https://example.com/tag.min.js" */
  scriptSrc?: string;
  /** data-zone (or equivalent) attribute the network's tag expects */
  zoneId?: string;
  /** Extra data-* attributes some networks require alongside the zone id */
  dataAttrs?: Record<string, string>;
  /**
   * Adcash Display/Banner zone id. Calls window.aclib.runBanner({ zoneId }),
   * the fixed-size image ad format - never runAutoTag (auto-rotates through
   * Pop-Under/Interstitial/Push formats, which this app deliberately avoids).
   * Requires the aclib.js loader script in index.html.
   */
  adcashZoneId?: string;
  className?: string;
}

/**
 * Isolated, self-contained sponsored slot. Deliberately separate from the
 * calculator/dashboard/chat flow: it never renders anything until a
 * scriptSrc+zoneId or adcashZoneId is actually provided, so an unconfigured
 * <SponsoredSlot /> placed in a layout is inert rather than a broken/empty box.
 *
 * Only wire this up with a confirmed Banner/Native/Display ad format. Push
 * notification, popunder, interstitial, and auto-rotating "auto tag" ad
 * scripts should never be loaded through this component (or anywhere in the
 * app) - those formats grant a third party persistent or intrusive access
 * far beyond what a financial app with real user sessions should expose.
 */
export function SponsoredSlot({
  scriptSrc,
  zoneId,
  dataAttrs,
  adcashZoneId,
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

  useEffect(() => {
    if (!adcashZoneId || !containerRef.current) return;

    let cancelled = false;
    let attempts = 0;
    const container = containerRef.current;

    const tryRun = () => {
      if (cancelled) return;
      if (window.aclib?.runBanner) {
        // aclib.runBanner renders directly at the call site via a script
        // element it injects itself, so this container just needs to exist
        // in the DOM at the right place - the call doesn't take a target.
        window.aclib.runBanner({ zoneId: adcashZoneId });
        return;
      }
      attempts += 1;
      if (attempts < 20) {
        // aclib.js loads as a blocking classic script before this component
        // ever mounts, so this should resolve on the first try in practice -
        // the retry is just a safety net for unusual load-order edge cases.
        setTimeout(tryRun, 150);
      } else {
        // eslint-disable-next-line no-console
        console.error(
          "[SponsoredSlot] window.aclib never became available - Adcash banner not rendered.",
        );
      }
    };

    tryRun();
    return () => {
      cancelled = true;
      container.innerHTML = "";
    };
  }, [adcashZoneId]);

  if (!scriptSrc && !zoneId && !adcashZoneId) return null;

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
