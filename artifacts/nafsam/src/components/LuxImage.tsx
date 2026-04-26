import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  src: string;
  alt?: string;
  className?: string;
  wrapClassName?: string;
};

export default function LuxImage({
  src,
  alt = "",
  className = "",
  wrapClassName = "",
  onLoad,
  ...rest
}: Props) {
  const imgRef = useRef<HTMLImageElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = imgRef.current;
    if (el && el.complete && el.naturalWidth > 0) {
      setLoaded(true);
    }
  }, [src]);

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
        loading="lazy"
        decoding="async"
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
