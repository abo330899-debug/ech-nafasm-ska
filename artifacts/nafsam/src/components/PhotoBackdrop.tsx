import romanceBg from "@/assets/romance-bg.webp";

/**
 * Subtle, faint photo backdrop used behind the login (دخولية) and
 * farewell (خروجية) pages. Rendered at a negative z-index so page
 * content always stays above it; a dark gradient keeps it gentle.
 */
export default function PhotoBackdrop() {
  return (
    <div
      className="romance-backdrop"
      aria-hidden="true"
      style={{ ["--romance-img" as string]: `url(${romanceBg})` }}
    />
  );
}
