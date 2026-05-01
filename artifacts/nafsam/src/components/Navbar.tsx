import { Link, useLocation } from "wouter";
import { type Translations } from "@/i18n/translations";

interface Props {
  t: Translations;
}

export default function Navbar({ t }: Props) {
  const [location] = useLocation();

  const links = [
    { href: "/", label: t.nav_login },
    { href: "/home", label: t.nav_home },
    { href: "/moments", label: t.nav_moments },
    { href: "/photos", label: t.nav_photos },
    { href: "/songs", label: t.nav_songs },
    { href: "/videos", label: t.nav_videos },
    { href: "/writings", label: t.nav_writings },
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
          </Link>
        ))}
      </div>
    </nav>
  );
}
