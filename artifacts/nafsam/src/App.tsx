import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation, Redirect } from "wouter";
import { useLang } from "@/hooks/useLang";
import Rain from "@/components/Rain";
import Navbar from "@/components/Navbar";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Moments from "@/pages/Moments";
import Photos from "@/pages/Photos";
import Songs from "@/pages/Songs";
import Videos from "@/pages/Videos";
import Writings from "@/pages/Writings";
import { fetchSession } from "@/lib/auth";

type AuthState = "checking" | "authed" | "anon";

function ProtectedRoute({ state, children }: { state: AuthState; children: React.ReactNode }) {
  if (state === "checking") return null;
  if (state !== "authed") return <Redirect to="/" />;
  return <>{children}</>;
}

function AppContent() {
  const { lang, setLang, t } = useLang();
  const [authState, setAuthState] = useState<AuthState>("checking");
  const [location] = useLocation();

  const refresh = async () => {
    const s = await fetchSession();
    setAuthState(s.authed ? "authed" : "anon");
  };

  useEffect(() => {
    refresh();
  }, [location]);

  return (
    <div className="app-shell">
      <Rain />
      {authState === "authed" && <Navbar t={t} />}
      <LanguageSwitcher lang={lang} setLang={setLang} mini />
      <main>
        <Switch>
          <Route path="/">
            <Login t={t} onAuth={() => setAuthState("authed")} />
          </Route>
          <Route path="/home">
            <ProtectedRoute state={authState}><Home t={t} /></ProtectedRoute>
          </Route>
          <Route path="/moments">
            <ProtectedRoute state={authState}><Moments t={t} /></ProtectedRoute>
          </Route>
          <Route path="/photos">
            <ProtectedRoute state={authState}><Photos t={t} lang={lang} /></ProtectedRoute>
          </Route>
          <Route path="/songs">
            <ProtectedRoute state={authState}><Songs t={t} /></ProtectedRoute>
          </Route>
          <Route path="/videos">
            <ProtectedRoute state={authState}><Videos t={t} /></ProtectedRoute>
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
