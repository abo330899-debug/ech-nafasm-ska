import { type Translations, type Lang } from "@/i18n/translations";
import Footer from "@/components/Footer";
import usePageAudio from "@/hooks/usePageAudio";
import { usePrivateContent, pickLangPages } from "@/hooks/usePrivateContent";

interface Props {
  t: Translations;
  lang: Lang;
}

export default function Moments({ t, lang }: Props) {
  usePageAudio("song1.mp3");
  const data = usePrivateContent();
  const p = pickLangPages(data, lang);

  const moments = [
    {
      time: p.moment1_time,
      title: p.moment1_title,
      text: p.moment1_text,
      memory: p.moment1_memory,
      image: `/api/private/images/photo1.webp`,
    },
    {
      time: p.moment2_time,
      title: p.moment2_title,
      text: p.moment2_text,
      memory: p.moment2_memory,
      image: `/api/private/images/photo2.webp`,
    },
    {
      time: p.moment3_time,
      title: p.moment3_title,
      text: p.moment3_text,
      memory: p.moment3_memory,
      image: `/api/private/images/photo3.webp`,
    },
  ].filter((m) => m.title || m.text);

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>{t.moments_title}</h1>
        {p.moments_text && <p>{p.moments_text}</p>}
      </div>

      <div className="timeline">
        {moments.map((m, i) => (
          <div key={i} className={`timeline-item ${i % 2 === 0 ? "left" : "right"}`}>
            <div className="timeline-marker" />
            <div className="timeline-card glass">
              {m.time && <span className="timeline-time">{m.time}</span>}
              <img src={m.image} alt={m.title ?? ""} className="timeline-img" loading="lazy" decoding="async" />
              {m.title && <h3>{m.title}</h3>}
              {m.text && <p>{m.text}</p>}
              {m.memory && <blockquote className="timeline-memory">{m.memory}</blockquote>}
            </div>
          </div>
        ))}
      </div>

      {p.moments_footer && <Footer text={p.moments_footer} />}
    </div>
  );
}
