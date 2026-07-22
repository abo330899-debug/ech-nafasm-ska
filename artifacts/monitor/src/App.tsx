import { useEffect, useState } from "react";
import { Router, Route, Switch, Link, useLocation } from "wouter";
import { useHashLocation } from "wouter/use-hash-location";
import {
  Activity,
  BarChart3,
  Bell,
  CalendarDays,
  Clock,
  FileText,
  FolderOpen,
  LayoutDashboard,
  LogOut,
  Radio,
  RefreshCw,
  Search as SearchIcon,
  Smartphone,
  Sparkles,
} from "lucide-react";
import {
  supabase,
  isConfigured,
  READER_EMAIL,
  MONITOR_PASSWORD,
} from "@/lib/supabase";
import { MonitorProvider, useMonitor } from "@/lib/MonitorContext";
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";

import Overview from "@/pages/Overview";
import Live from "@/pages/Live";
import Sessions from "@/pages/Sessions";
import Daily from "@/pages/Daily";
import Content from "@/pages/Content";
import Analytics from "@/pages/Analytics";
import Devices from "@/pages/Devices";
import Search from "@/pages/Search";
import Alerts from "@/pages/Alerts";
import Health from "@/pages/Health";
import Insights from "@/pages/Insights";
import Reports from "@/pages/Reports";

type AuthState = "checking" | "error" | "in";

function useAuth() {
  const [state, setState] = useState<AuthState>("checking");

  useEffect(() => {
    if (!supabase) {
      setState("error");
      return;
    }
    let active = true;
    const client = supabase;

    async function ensureSignedIn() {
      const { data } = await client.auth.getSession();
      if (!active) return;
      if (data.session?.user?.email?.toLowerCase() === READER_EMAIL) {
        setState("in");
        return;
      }
      const { error } = await client.auth.signInWithPassword({
        email: READER_EMAIL,
        password: MONITOR_PASSWORD,
      });
      if (!active) return;
      setState(error ? "error" : "in");
    }

    ensureSignedIn();

    const { data: sub } = client.auth.onAuthStateChange((_e, session) => {
      if (session?.user?.email?.toLowerCase() === READER_EMAIL) {
        setState("in");
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

const NAV_GROUPS = [
  {
    label: "مباشر",
    items: [
      { path: "/", label: "نظرة عامة", icon: LayoutDashboard },
      { path: "/live", label: "مباشر", icon: Radio },
    ],
  },
  {
    label: "التحليل",
    items: [
      { path: "/sessions", label: "الجلسات", icon: Clock },
      { path: "/daily", label: "يوم بيوم", icon: CalendarDays },
      { path: "/analytics", label: "التحليلات", icon: BarChart3 },
      { path: "/content", label: "المحتوى", icon: FolderOpen },
      { path: "/devices", label: "الأجهزة", icon: Smartphone },
    ],
  },
  {
    label: "الذكاء",
    items: [
      { path: "/insights", label: "الرؤى الذكية", icon: Sparkles },
      { path: "/reports", label: "التقارير", icon: FileText },
      { path: "/alerts", label: "التنبيهات", icon: Bell },
    ],
  },
  {
    label: "النظام",
    items: [
      { path: "/search", label: "البحث", icon: SearchIcon },
      { path: "/health", label: "حالة النظام", icon: Activity },
    ],
  },
] as const;

function AppSidebar() {
  const [location] = useLocation();
  const { anomalies } = useMonitor();
  const alertCount = anomalies.length;

  return (
    <Sidebar side="right">
      <SidebarHeader>
        <div className="flex items-center gap-2 px-2 py-1.5">
          <span className="text-xl">🛰️</span>
          <span className="font-semibold text-sidebar-foreground">
            غرفة المراقبة
          </span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        {NAV_GROUPS.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      asChild
                      isActive={location === item.path}
                    >
                      <Link href={item.path}>
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                        {item.path === "/alerts" && alertCount > 0 && (
                          <Badge
                            variant="outline"
                            className="mr-auto h-5 min-w-5 justify-center px-1 text-[10px]"
                          >
                            {alertCount}
                          </Badge>
                        )}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}

function TopBar() {
  const { refetch, backfilling, health } = useMonitor();
  const connected = health.channelStatus === "SUBSCRIBED";

  async function signOut() {
    await supabase?.auth.signOut({ scope: "local" });
    window.location.reload();
  }

  return (
    <header className="bg-background/80 sticky top-0 z-10 border-b border-border backdrop-blur">
      <div className="flex items-center gap-2 px-3 py-2">
        <SidebarTrigger />
        <span
          className={`inline-block h-2 w-2 rounded-full ${
            connected ? "bg-green-400" : "bg-destructive"
          }`}
          title={connected ? "البث الفوري متصل" : "البث الفوري منقطع"}
        />
        {backfilling && (
          <span className="text-xs text-muted-foreground">
            جارٍ تحميل السجل…
          </span>
        )}
        <div className="flex-1" />
        <button
          onClick={refetch}
          className="hover-elevate flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          تحديث
        </button>
        <button
          onClick={signOut}
          className="hover-elevate flex items-center gap-1.5 rounded-md px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <LogOut className="h-3.5 w-3.5" />
          خروج
        </button>
      </div>
    </header>
  );
}

function Shell() {
  const { error } = useMonitor();

  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex min-h-screen w-full flex-col">
        <TopBar />
        <main className="flex-1">
          {error && (
            <div className="mx-auto mt-4 w-full max-w-5xl px-4">
              <div className="bg-destructive/10 border-destructive/30 text-destructive rounded-xl border p-4 text-sm">
                {error}
              </div>
            </div>
          )}
          <Switch>
            <Route path="/" component={Overview} />
            <Route path="/live" component={Live} />
            <Route path="/sessions" component={Sessions} />
            <Route path="/daily" component={Daily} />
            <Route path="/analytics" component={Analytics} />
            <Route path="/content" component={Content} />
            <Route path="/devices" component={Devices} />
            <Route path="/search" component={Search} />
            <Route path="/insights" component={Insights} />
            <Route path="/reports" component={Reports} />
            <Route path="/alerts" component={Alerts} />
            <Route path="/health" component={Health} />
            <Route>
              <div className="py-16 text-center text-muted-foreground">
                الصفحة غير موجودة
              </div>
            </Route>
          </Switch>
        </main>
      </div>
    </SidebarProvider>
  );
}

export default function App() {
  const auth = useAuth();
  if (auth === "checking")
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        …
      </div>
    );
  if (auth === "error")
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center text-muted-foreground">
        <div>
          <div className="mb-3 text-3xl">🛰️</div>
          <p className="font-medium text-foreground">
            تعذّر الاتصال بغرفة المراقبة
          </p>
          {!isConfigured && (
            <p className="text-destructive mt-2 text-sm">
              الاتصال بقاعدة البيانات غير مهيأ.
            </p>
          )}
        </div>
      </div>
    );
  return (
    <MonitorProvider>
      <Router hook={useHashLocation}>
        <Shell />
      </Router>
    </MonitorProvider>
  );
}
