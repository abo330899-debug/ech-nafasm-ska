import { Link, useLocation } from "wouter";
import { type Translations, type Lang } from "@/i18n/translations";
import { useChat } from "@/chat/chatContext";

interface Props {
  t: Translations;
  lang: Lang;
  onLogout: () => void;
}

export default function Navbar({ t, onLogout }: Props) {
  const [location] = useLocation();
  const { unread, configured } = useChat();

  const links = [
    { href: "/home", label: t.nav_home },
    { href: "/moments", label: t.nav_moments },
    { href: "/photos", label: t.nav_photos },
    { href: "/songs", label: t.nav_songs },
    { href: "/videos", label: t.nav_videos },
    { href: "/writings", label: t.nav_writings },
    { href: "/feelings", label: t.nav_feelings },
    ...(configured ? [{ href: "/chat", label: t.nav_chat, chat: true }] : []),
  ];

  return (
    <nav className="nav glass">
      <div className="nav-top">
        <div className="brand">{t.brand}</div>
      </div>
      <div className="links">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={location === l.href ? "active" : ""}
          >
            {l.label}
            {"chat" in l && l.chat && unread > 0 && location !== "/chat" && (
              <span className="nav-chat-badge">{unread > 99 ? "99+" : unread}</span>
            )}
          </Link>
        ))}
        <button className="nav-logout" onClick={onLogout}>
          {t.nav_logout}
        </button>
      </div>
    </nav>
  );
}
