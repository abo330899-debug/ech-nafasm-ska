import { type Translations, type Lang } from "@/i18n/translations";
import Footer from "@/components/Footer";
import { usePrivateContent, pickLangPages } from "@/hooks/usePrivateContent";

interface Props {
  t: Translations;
  lang: Lang;
}

export default function Songs({ t, lang }: Props) {
  const data = usePrivateContent();
  const p = pickLangPages(data, lang);

  const songs = [
    { title: "Be Koja Residi — Dorcci", text: p.song1_text, src: "/api/private/media/song1.mp3" },
    { title: "Ghatle Amd — Dorcci", text: p.song2_text, src: "/api/private/media/song2.mp3" },
    { title: t.song3_title, text: p.song3_text, src: "/api/private/media/song3.mp3" },
    { title: t.song4_title, text: p.song4_text, src: "/api/private/media/song4.mp3" },
    { title: "Hey To — Amir Khoshnegar", text: undefined, src: "/api/private/media/song5.mp3" },
    { title: "Kusura Bakma — Blok3", text: undefined, src: "/api/private/media/song6.mp3" },
    { title: "Bi To", text: undefined, src: "/api/private/media/song7.mp3" },
    { title: "Ghermez — Poobon", text: undefined, src: "/api/private/media/song8.mp3" },
    { title: "Jonoon — Hayedeh & Moein", text: undefined, src: "/api/private/media/song9.mp3" },
    { title: "Shahkar (Remix) — Savash", text: undefined, src: "/api/private/media/song10.mp3" },
    { title: "Tabestoon Kootahe — Zedbazi", text: undefined, src: "/api/private/media/song11.mp3" },
    { title: "Tabestoon Kootahe", text: undefined, src: "/api/private/media/song12.mp3" },
    { title: "Hayedeh (AI)", text: undefined, src: "/api/private/media/song13.mp3" },
    { title: "Ghatle Amd (Guitar, Slowed) — Dorcci", text: undefined, src: "/api/private/media/song14.mp3" },
    { title: "Ghalbam Roo Tekrare", text: undefined, src: "/api/private/media/song15.mp3" },
    { title: "Moteasefane — Majid Razavi", text: undefined, src: "/api/private/media/song16.mp3" },
    { title: "Moohash — Javad Ara", text: undefined, src: "/api/private/media/song17.mp3" },
    { title: "Duset Daram — Nivad", text: undefined, src: "/api/private/media/song18.mp3" },
  ];

  return (
    <div className="page-content">
      <div className="page-header">
        <h1>{t.songs_title}</h1>
        <p>{t.songs_text}</p>
      </div>

      <div className="songs-list">
        {songs.map((s, i) => (
          <div key={i} className="song-card glass">
            <h3>{s.title}</h3>
            {s.text && <p>{s.text}</p>}
            <audio controls src={s.src} className="audio-player">
              Your browser does not support audio.
            </audio>
          </div>
        ))}
      </div>

      {p.songs_footer && <Footer text={p.songs_footer} />}
    </div>
  );
}
