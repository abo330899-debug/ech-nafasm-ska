import { Link, useLocation } from "wouter";
import {
  BookHeart,
  Camera,
  Film,
  HeartPulse,
  Home,
  LogOut,
  Map,
  MessageCircleHeart,
  Music2,
  Send,
} from "lucide-react";
import { type Translations, type Lang } from "@/i18n/translations";
import { useChat } from "@/chat/chatContext";
import "@/styles/luxe-chrome.css";

interface Props {
  t: Translations;
  lang: Lang;
  onLogout: () => void;
}

export default function Navbar({ t, onLogout }: Props) {
  const [location] = useLocation();
  const { unread, configured } = useChat();

  const links = [
    { href: "/home", label: t.nav_home, icon: Home },
    { href: "/photos", label: t.nav_photos, icon: Camera },
    { href: "/journey", label: t.nav_journey, icon: Map },
    { href: "/songs", label: t.nav_songs, icon: Music2 },
    { href: "/videos", label: t.nav_videos, icon: Film },
    { href: "/writings", label: t.nav_writings, icon: BookHeart },
    { href: "/feelings", label: t.nav_feelings, icon: HeartPulse },
    ...(configured
      ? [{ href: "/chat", label: t.nav_chat, icon: MessageCircleHeart, chat: true }]
      : []),
  ];

  const telegramHref = "/telegram-call/";

  return (
    <nav className="memory-dock luxe-nav" aria-label="Primary">
      <div className="luxe-nav-glow" aria-hidden="true" />
      <div className="luxe-nav-hairline" aria-hidden="true" />
      
      <div className="memory-dock__brand" aria-label={t.brand}>
        <span className="memory-dock__mark">N</span>
        <span className="memory-dock__word">{t.brand}</span>
      </div>

      <div className="memory-dock__links">
        {links.map((item) => {
          const Icon = item.icon;
          const active = location === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`memory-dock__item${active ? " is-active" : ""}`}
              aria-current={active ? "page" : undefined}
              title={item.label}
            >
              <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
              <span>{item.label}</span>
              {"chat" in item && item.chat && unread > 0 && location !== "/chat" && (
                <b className="memory-dock__badge">{unread > 99 ? "99+" : unread}</b>
              )}
            </Link>
          );
        })}
        <a
          href={telegramHref}
          className="memory-dock__item"
          title={t.nav_telegram}
        >
          <Send size={18} strokeWidth={1.8} aria-hidden="true" />
          <span>{t.nav_telegram}</span>
        </a>
      </div>

      <button className="memory-dock__logout" onClick={onLogout} title={t.nav_logout}>
        <LogOut size={18} strokeWidth={1.8} aria-hidden="true" />
        <span>{t.nav_logout}</span>
      </button>
    </nav>
  );
}
