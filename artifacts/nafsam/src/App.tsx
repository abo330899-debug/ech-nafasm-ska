import { useState, useEffect, useRef, lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { useLang } from "@/hooks/useLang";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Rain from "@/components/Rain";
import FloatingHearts from "@/components/FloatingHearts";
import DustParticles from "@/components/DustParticles";
import { useMagneticButtons } from "@/hooks/useMagneticButtons";
import { useIdleVignette } from "@/hooks/useIdleVignette";
import Navbar from "@/components/Navbar";
import Login from "@/pages/Login";
import { fetchSession, broadcastLogout, logout, AUTH_BROADCAST_CHANNEL, STORAGE_LOGOUT_KEY } from "@/lib/auth";
import { clearPrivateContentCache, setUnauthorizedHandler, revalidatePrivateContent } from "@/hooks/usePrivateContent";

const Home = lazy(() => import("@/pages/Home"));
const Moments = lazy(() => import("@/pages/Moments"));
const Photos = lazy(() => import("@/pages/Photos"));
const Songs = lazy(() => import("@/pages/Songs"));
const Videos = lazy(() => import("@/pages/Videos"));
const Writings = lazy(() => import("@/pages/Writings"));
const Feelings = lazy(() => import("@/pages/Feelings"));

type AuthState = "checking" | "authed" | "anon";

function ProtectedRoute({ state, children }: { state: AuthState; children: React.ReactNode }) {
  if (state === "checking") return null;
  if (state !== "authed") return <Redirect to="/" />;
  return <Suspense fallback={null}>{children}</Suspense>;
}

function AppContent() {
  const { lang, setLang, t } = useLang();
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [location] = useLocation();
  useMagneticButtons();
  useIdleVignette();

  const evictAuthRef = useRef<() => void>(() => {});

  const evictAuth = () => {
    clearPrivateContentCache();
    setAuthState("anon");
  };

  evictAuthRef.current = evictAuth;

  const handleLogout = () => {
    // Evict auth immediately so protected content is hidden at once,
    // before the network request settles. The server-side revocation
    // proceeds in the background regardless of its outcome.
    evictAuth();
    broadcastLogout();
    logout().catch(() => {});
  };

  const refresh = async (evictIfAnon = false) => {
    const s = await fetchSession();
    const next: AuthState = s.authed ? "authed" : "anon";
    setAuthState((prev) => {
      if (next !== "authed" && (prev === "authed" || evictIfAnon)) {
        clearPrivateContentCache();
        broadcastLogout();
      }
      return next;
    });
  };

  useEffect(() => {
    // Validate silently on navigation. Only show "checking" on the very first
    // load (when we don't yet know auth state); otherwise keep the current
    // state so navigating between protected pages doesn't blank the screen.
    let wasAuthed = false;
    setAuthState((prev) => {
      wasAuthed = prev === "authed";
      return prev;
    });
    refresh(wasAuthed);
  }, [location]);

  useEffect(() => {
    // Register the unauthorized handler so that a 401 from any private-content
    // fetch triggers immediate local eviction without waiting for the next poll.
    setUnauthorizedHandler(() => evictAuthRef.current());

    const interval = setInterval(() => {
      // Background poll: validate silently without flipping to "checking",
      // which would unmount protected routes and cause a visible "pulse".
      // evictAuth() still fires immediately on 401 via unauthorizedHandler.
      let wasAuthed = false;
      setAuthState((prev) => {
        wasAuthed = prev === "authed";
        return prev;
      });
      refresh(wasAuthed);
      if (wasAuthed) revalidatePrivateContent();
    }, 30_000);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        let wasAuthed = false;
        setAuthState((prev) => {
          wasAuthed = prev === "authed";
          return prev;
        });
        refresh(wasAuthed);
      }
    };
    const onFocus = () => {
      let wasAuthed = false;
      setAuthState((prev) => {
        wasAuthed = prev === "authed";
        return prev;
      });
      refresh(wasAuthed);
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);

    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
      channel.onmessage = (e) => {
        if (e.data === "logout") evictAuth();
      };
    } catch {
      // BroadcastChannel not available in this context
    }

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_LOGOUT_KEY) evictAuth();
    };
    window.addEventListener("storage", onStorage);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("storage", onStorage);
      channel?.close();
    };
  }, []);

  return (
    <div className="app-shell">
      <Rain />
      <FloatingHearts />
      <DustParticles />
      <LanguageSwitcher lang={lang} setLang={setLang} />
      {authState === "authed" && <Navbar t={t} onLogout={handleLogout} />}
      <main>
        <Switch>
          <Route path="/">
            <Login t={t} lang={lang} onAuth={() => setAuthState("authed")} />
          </Route>
          <Route path="/home">
            <ProtectedRoute state={authState}><Home t={t} lang={lang} /></ProtectedRoute>
          </Route>
          <Route path="/moments">
            <ProtectedRoute state={authState}><Moments t={t} lang={lang} /></ProtectedRoute>
          </Route>
          <Route path="/photos">
            <ProtectedRoute state={authState}><Photos t={t} lang={lang} /></ProtectedRoute>
          </Route>
          <Route path="/songs">
            <ProtectedRoute state={authState}><Songs t={t} lang={lang} /></ProtectedRoute>
          </Route>
          <Route path="/videos">
            <ProtectedRoute state={authState}><Videos t={t} lang={lang} /></ProtectedRoute>
          </Route>
          <Route path="/writings">
            <ProtectedRoute state={authState}><Writings t={t} lang={lang} /></ProtectedRoute>
          </Route>
          <Route path="/feelings">
            <ProtectedRoute state={authState}><Feelings t={t} lang={lang} /></ProtectedRoute>
          </Route>
          <Route>
            <Redirect to="/" />
          </Route>
        </Switch>
      </main>
    </div>
  );
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <AppContent />
    </WouterRouter>
  );
}

export default App;
