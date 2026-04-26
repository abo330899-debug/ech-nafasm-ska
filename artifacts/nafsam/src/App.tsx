import { useState, useEffect, lazy, Suspense } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { useLang } from "@/hooks/useLang";
import Rain from "@/components/Rain";
import FloatingHearts from "@/components/FloatingHearts";
import { useMagneticButtons } from "@/hooks/useMagneticButtons";
import Navbar from "@/components/Navbar";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Login from "@/pages/Login";
import { fetchSession } from "@/lib/auth";
import { clearPrivateContentCache } from "@/hooks/usePrivateContent";

const Home = lazy(() => import("@/pages/Home"));
const Moments = lazy(() => import("@/pages/Moments"));
const Photos = lazy(() => import("@/pages/Photos"));
const Songs = lazy(() => import("@/pages/Songs"));
const Videos = lazy(() => import("@/pages/Videos"));
const Writings = lazy(() => import("@/pages/Writings"));

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

  const refresh = async () => {
    const s = await fetchSession();
    const next: AuthState = s.authed ? "authed" : "anon";
    setAuthState((prev) => {
      if (prev === "authed" && next !== "authed") {
        clearPrivateContentCache();
      }
      return next;
    });
  };

  useEffect(() => {
    setAuthState("checking");
    refresh();
  }, [location]);

  useEffect(() => {
    const interval = setInterval(refresh, 30_000);

    const onVisibility = () => {
      if (document.visibilityState === "visible") refresh();
    };
    const onFocus = () => refresh();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", onFocus);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  return (
    <div className="app-shell">
      <Rain />
      <FloatingHearts />
      {authState === "authed" && <Navbar t={t} />}
      <LanguageSwitcher lang={lang} setLang={setLang} mini />
      <main>
        <Switch>
          <Route path="/">
            <Login t={t} onAuth={() => setAuthState("authed")} />
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
