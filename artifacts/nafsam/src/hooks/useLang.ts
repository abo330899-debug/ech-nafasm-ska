import { useState, useEffect, useCallback } from "react";
import { type Lang, translations } from "@/i18n/translations";

export function useLang() {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const stored = localStorage.getItem("site_lang");
      if (stored === "tr" || stored === "fa" || stored === "ar" || stored === "en") return stored;
    } catch {
      /* storage blocked */
    }
    return "tr";
  });

  const setLang = useCallback((l: Lang) => {
    try {
      localStorage.setItem("site_lang", l);
    } catch {
      /* storage blocked */
    }
    setLangState(l);
  }, []);

  useEffect(() => {
    const t = translations[lang];
    document.documentElement.lang = lang;
    document.documentElement.dir = t.dir;
  }, [lang]);

  const t = translations[lang];

  return { lang, setLang, t };
}
