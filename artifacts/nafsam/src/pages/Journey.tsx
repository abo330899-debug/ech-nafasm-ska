import { type ReactNode } from "react";
import PhotoBackdrop from "@/components/PhotoBackdrop";
import usePageAudio from "@/hooks/usePageAudio";
import { privateImage } from "@/lib/privateAssets";
import { usePrivateContent } from "@/hooks/usePrivateContent";
import LuxImage from "@/components/LuxImage";
import useReveal from "@/hooks/useReveal";
import { type Translations, type Lang } from "@/i18n/translations";

function RevealChapter({
  index,
  children,
}: {
  index: number;
  children: ReactNode;
}) {
  const { ref, inView } = useReveal<HTMLElement>();
  return (
    <article
      ref={ref as React.RefObject<HTMLElement>}
      className={`journey-chapter ${index % 2 === 1 ? "is-alt" : ""} ${inView ? "in-view" : ""}`}
    >
      {children}
    </article>
  );
}

interface Props {
  t: Translations;
  lang: Lang;
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

export default function Journey({ t }: Props) {
  const data = usePrivateContent();
  usePageAudio(data?.pageAudio?.photos ?? "");
  const photosDir = data?.mediaConfig?.photosDir ?? "";
  const journey = (Array.isArray(data?.journey) ? data.journey : []).filter(
    (ch): ch is NonNullable<typeof ch> =>
      !!ch &&
      typeof ch.file === "string" &&
      ch.file.trim() !== "" &&
      typeof ch.title === "string" &&
      ch.title.trim() !== "" &&
      typeof ch.quote === "string" &&
      ch.quote.trim() !== "",
  );

  return (
    <div className="page-content journey-page">
      <PhotoBackdrop />

      <div className="page-header journey-header">
        <span className="journey-eyebrow">{t.journey_eyebrow}</span>
        <h1>{t.journey_title}</h1>
        <p className="journey-intro">{t.journey_intro}</p>
      </div>

      <div className="journey-thread">
        {journey.map((ch, i) => {
          const src = photosDir ? privateImage(`${photosDir}/${ch.file}`) : "";
          const nextSrc =
            journey[i + 1] && photosDir
              ? privateImage(`${photosDir}/${journey[i + 1].file}`)
              : undefined;
          return (
            <RevealChapter key={i} index={i}>
              <div className="journey-node" aria-hidden="true">
                <span className="journey-node-dot" />
              </div>
              <figure className="journey-card glass">
                <div className="journey-media">
                  <LuxImage
                    src={src}
                    alt={ch.title}
                    className="journey-img"
                    priority={i < 2 ? "high" : "auto"}
                    nextSrc={nextSrc}
                  />
                  <span className="journey-num">{pad2(i + 1)}</span>
                </div>
                <figcaption className="journey-text">
                  <h2 className="journey-chapter-title">{ch.title}</h2>
                  <p className="journey-quote">{ch.quote}</p>
                </figcaption>
              </figure>
            </RevealChapter>
          );
        })}
      </div>

      <div className="journey-outro">
        <span className="journey-outro-line" />
        <p className="journey-outro-text">{t.journey_outro}</p>
        <span className="journey-outro-line" />
      </div>
    </div>
  );
}
