import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { cleanup, render } from "@testing-library/react";
import type { Translations } from "@/i18n/translations";

const mockContent = vi.fn();

vi.mock("@/hooks/usePrivateContent", () => ({
  usePrivateContent: () => mockContent(),
}));

vi.mock("@/hooks/usePageAudio", () => ({ default: () => {} }));

vi.mock("@/hooks/useReveal", () => ({
  default: () => ({ ref: { current: null }, inView: true }),
}));

vi.mock("@/components/PhotoBackdrop", () => ({ default: () => null }));

vi.mock("@/lib/privateAssets", () => ({
  privateImage: (rel: string) => `/img/${rel}`,
}));

vi.mock("@/components/LuxImage", () => ({
  default: ({
    src,
    alt,
    nextSrc,
  }: {
    src: string;
    alt: string;
    nextSrc?: string;
  }) => (
    <img
      data-testid="lux"
      src={src}
      alt={alt}
      data-next={nextSrc ?? ""}
    />
  ),
}));

import Journey from "@/pages/Journey";

const t = {
  journey_eyebrow: "eyebrow",
  journey_title: "title",
  journey_intro: "intro",
  journey_outro: "outro",
} as unknown as Translations;

function renderJourney() {
  return render(<Journey t={t} lang="ar" />);
}

beforeEach(() => {
  mockContent.mockReset();
});

afterEach(() => {
  cleanup();
});

describe("Journey page entry guard", () => {
  it("skips incomplete entries, renders only valid ones, and keeps numbering continuous", () => {
    mockContent.mockReturnValue({
      mediaConfig: { photosDir: "all_photos" },
      journey: [
        { file: "a.webp", title: "First", quote: "q1" }, // valid -> 01
        null, // skipped (falsy)
        { file: "", title: "NoFile", quote: "q" }, // skipped (empty file)
        { file: "b.webp", title: "", quote: "q" }, // skipped (empty title)
        { file: "c.webp", title: "NoQuote", quote: "   " }, // skipped (blank quote)
        { file: 123, title: "NumFile", quote: "q" } as unknown, // skipped (non-string file)
        { file: "d.webp", title: "Second", quote: "q2" }, // valid -> 02
        { file: "   ", title: "WsFile", quote: "q" }, // skipped (whitespace file)
        { file: "e.webp", title: "Third", quote: "q3" }, // valid -> 03
      ],
    });

    const { container } = renderJourney();

    const titles = Array.from(
      container.querySelectorAll(".journey-chapter-title"),
    ).map((el) => el.textContent);
    expect(titles).toEqual(["First", "Second", "Third"]);

    const quotes = Array.from(
      container.querySelectorAll(".journey-quote"),
    ).map((el) => el.textContent);
    expect(quotes).toEqual(["q1", "q2", "q3"]);

    const nums = Array.from(
      container.querySelectorAll(".journey-num"),
    ).map((el) => el.textContent);
    expect(nums).toEqual(["01", "02", "03"]);
  });

  it("aligns nextSrc preloading with the next rendered (filtered) card", () => {
    mockContent.mockReturnValue({
      mediaConfig: { photosDir: "all_photos" },
      journey: [
        { file: "a.webp", title: "First", quote: "q1" },
        { file: "", title: "skip", quote: "q" }, // skipped
        { file: "d.webp", title: "Second", quote: "q2" },
        { file: "e.webp", title: "Third", quote: "q3" },
      ],
    });

    const { container } = renderJourney();

    const imgs = Array.from(
      container.querySelectorAll<HTMLImageElement>('[data-testid="lux"]'),
    );

    expect(imgs.map((el) => el.getAttribute("src"))).toEqual([
      "/img/all_photos/a.webp",
      "/img/all_photos/d.webp",
      "/img/all_photos/e.webp",
    ]);

    // nextSrc on each card points at the *next valid* card, skipping invalid ones.
    expect(imgs.map((el) => el.getAttribute("data-next"))).toEqual([
      "/img/all_photos/d.webp",
      "/img/all_photos/e.webp",
      "", // last card has no next
    ]);
  });

  it("renders no chapters and does not throw when journey is missing or not an array", () => {
    mockContent.mockReturnValue({
      mediaConfig: { photosDir: "all_photos" },
      journey: undefined,
    });
    const a = renderJourney();
    expect(a.container.querySelectorAll(".journey-chapter-title").length).toBe(
      0,
    );
    cleanup();

    mockContent.mockReturnValue({
      mediaConfig: { photosDir: "all_photos" },
      journey: { not: "an array" } as unknown,
    });
    const b = renderJourney();
    expect(b.container.querySelectorAll(".journey-chapter-title").length).toBe(
      0,
    );
  });
});
