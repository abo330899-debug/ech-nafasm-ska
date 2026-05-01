import { type Lang } from "@/i18n/translations";

const flags: { lang: Lang; flag: string; title: string }[] = [
  { lang: "tr", flag: "\ud83c\uddf9\ud83c\uddf7", title: "T\u00fcrk\u00e7e" },
  { lang: "fa", flag: "\ud83c\uddee\ud83c\uddf7", title: "\u0641\u0627\u0631\u0633\u06cc" },
  { lang: "ar", flag: "\ud83c\uddf8\ud83c\udde6", title: "\u0627\u0644\u0639\u0631\u0628\u064a\u0629" },
  { lang: "en", flag: "\ud83c\uddec\ud83c\udde7", title: "English" },
];

interface Props {
  lang: Lang;
  setLang: (l: Lang) => void;
  mini?: boolean;
}

export default function LanguageSwitcher({ lang, setLang, mini }: Props) {
  return (
    <div className={mini ? "lang-switcher flags-mini-vertical" : "lang-switcher flags-soft"}>
      {flags.map((f) => (
        <button
          key={f.lang}
          className={`lang-btn flag-btn${mini ? " mini" : ""}${
            lang === f.lang ? " active" : ""
          }`}
          onClick={() => setLang(f.lang)}
          title={f.title}
          aria-label={f.title}
        >
          {f.flag}
        </button>
      ))}
    </div>
  );
}
