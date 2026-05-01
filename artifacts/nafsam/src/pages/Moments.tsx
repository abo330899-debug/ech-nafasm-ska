import { type CSSProperties, type ReactNode } from "react";
import { type Translations, type Lang } from "@/i18n/translations";
import Footer from "@/components/Footer";
import usePageAudio from "@/hooks/usePageAudio";
import { usePrivateContent, pickLangPages } from "@/hooks/usePrivateContent";
import LuxImage from "@/components/LuxImage";
import useReveal from "@/hooks/useReveal";

function RevealBlock({
  className = "",
  index,
  children,
}: {
  className?: string;
  index?: number;
  children: ReactNode;
}) {
  const { ref, inView } = useReveal<HTMLDivElement>();
  const style: CSSProperties | undefined =
    typeof index === "number"
      ? ({ ["--i" as never]: Math.min(index, 8) } as CSSProperties)
      : undefined;
  return (
    <div
      ref={ref}
      className={`${className} reveal ${inView ? "in-view" : ""}`}
      style={style}
    >
      {children}
    </div>
  );
}

interface Props {
  t: Translations;
  lang: Lang;
}

export default function Moments({ t, lang }: Props) {
  usePageAudio("song1.mp3");
  const data = usePrivateContent();
  const p = pickLangPages(data, lang);

  const momentImages = data?.momentImages ?? [];

  const moments = [
    { time: p.moment1_time, title: p.moment1_title, text: p.moment1_text, memory: p.moment1_memory },
    { time: p.moment2_time, title: p.moment2_title, text: p.moment2_text, memory: p.moment2_memory },
    { time: p.moment3_time, title: p.moment3_title, text: p.moment3_text, memory: p.moment3_memory },
  ]
    .map((m, i) => ({ ...m, image: momentImages[i] ? `/api/private/images/${momentImages[i]}` : "" }))
    .filter((m) => m.title || m.text);

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>{t.moments_title}</h1>
        {p.moments_text && <p>{p.moments_text}</p>}
      </div>

      <div className="timeline">
        {moments.map((m, i) => (
          <RevealBlock
            key={i}
            className={`timeline-item ${i % 2 === 0 ? "left" : "right"}`}
            index={i}
          >
            <div className="timeline-marker" />
            <div className="timeline-card glass">
              {m.time && <span className="timeline-time">{m.time}</span>}
              <LuxImage src={m.image} alt={m.title ?? ""} className="timeline-img" />
              {m.title && <h3>{m.title}</h3>}
              {m.text && <p>{m.text}</p>}
              {m.memory && <blockquote className="timeline-memory">{m.memory}</blockquote>}
            </div>
          </RevealBlock>
        ))}
      </div>

      {p.moments_footer && <Footer text={p.moments_footer} />}
    </div>
  );
}
