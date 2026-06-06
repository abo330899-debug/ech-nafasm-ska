import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";
import { prefetchImage } from "@/lib/prefetch";

type Props = Omit<ImgHTMLAttributes<HTMLImageElement>, "loading"> & {
  src: string;
  alt?: string;
  className?: string;
  wrapClassName?: string;
  /** If "high", marks image as priority — eager load + fetchpriority high. */
  priority?: "high" | "auto";
  /** When this image finishes loading, warm the browser cache for these next URLs. */
  nextSrc?: string | string[];
};

export default function LuxImage({
  src,
  alt = "",
  className = "",
  wrapClassName = "",
  priority = "auto",
  nextSrc,
  onLoad,
  ...rest
}: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);
  const isPriority = priority === "high";

  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src]);

  useEffect(() => {
    if (!loaded || !nextSrc) return;
    // Skip ahead-of-scroll prefetch on phones / data-saver. Warming full-res
    // images ahead of the viewport piles up decoded bitmaps and is a primary
    // cause of iOS Safari OOM-reloading the tab during fast scrolling.
    if (typeof window !== "undefined") {
      const conn = (
        navigator as unknown as { connection?: { saveData?: boolean } }
      ).connection;
      const isNarrow = window.matchMedia("(max-width: 820px)").matches;
      if (conn?.saveData || isNarrow) return;
    }
    if (Array.isArray(nextSrc)) nextSrc.forEach(prefetchImage);
    else prefetchImage(nextSrc);
  }, [loaded, nextSrc]);

  return (
    <span
      className={`lux-img-wrap ${loaded ? "is-loaded" : "is-loading"} ${wrapClassName}`}
      aria-hidden={false}
    >
      <span className="lux-img-placeholder" aria-hidden="true" />
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        loading={isPriority ? "eager" : "lazy"}
        decoding="async"
        {...(isPriority ? { fetchPriority: "high" as const } : {})}
        className={`lux-img ${loaded ? "is-loaded" : ""} ${className}`}
        onLoad={(e) => {
          setLoaded(true);
          onLoad?.(e);
        }}
        onError={() => setLoaded(true)}
        {...rest}
      />
    </span>
  );
}
