import { type Translations, type Lang } from "@/i18n/translations";
import Footer from "@/components/Footer";
import usePageAudio from "@/hooks/usePageAudio";
import { usePrivateContent, pickLangPages } from "@/hooks/usePrivateContent";

interface Props {
  t: Translations;
  lang: Lang;
}

export default function Writings({ t, lang }: Props) {
  usePageAudio("song3.mp3");
  const data = usePrivateContent();
  const p = pickLangPages(data, lang);
  const bundle = data?.writings?.[lang] ?? data?.writings?.tr ?? null;

  const entries = bundle
    ? [bundle.w1, bundle.w2, bundle.w3, bundle.w4, bundle.w5, bundle.w6, bundle.w7, bundle.w8, bundle.w9, bundle.w10].filter(
        (s): s is string => !!s,
      )
    : [];

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>{t.writings_title}</h1>
        {p.writings_text && <p>{p.writings_text}</p>}
      </div>

      <div className="writings-list">
        {entries.map((w, i) => (
          <div key={i} className="writing-card glass">
            <span className="writing-num">{i + 1}</span>
            <p>{w}</p>
          </div>
        ))}
      </div>

      {bundle?.farewell_text && (
        <div className="farewell-section">
          <div className="farewell-card glass">
            <h2 className="farewell-title">{bundle.farewell_title ?? ""}</h2>
            <div className="farewell-divider" />
            {bundle.farewell_text.split("\n\n").map((paragraph, i) => (
              <p key={i} className="farewell-paragraph">{paragraph}</p>
            ))}
          </div>
        </div>
      )}

      {p.writings_footer && <Footer text={p.writings_footer} />}
    </div>
  );
}
