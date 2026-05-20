import { useState, useEffect, useCallback } from "react";
import { X, Wrench, AlertTriangle, Info } from "lucide-react";

const STATUS_URL = import.meta.env.DEV ? "http://localhost:8080/api/status" : "/api/status";
const DISMISS_KEY = "kyna_dismissed_notifs";

interface Notification { id: number; message: string; type: "info" | "warning" | "error"; created_at: string; }
interface Maintenance { enabled: boolean; message?: string; eta?: string; }

function getDismissed(): Set<number> {
  try { return new Set(JSON.parse(sessionStorage.getItem(DISMISS_KEY) || "[]")); }
  catch { return new Set(); }
}

function persistDismiss(id: number) {
  const s = getDismissed(); s.add(id);
  sessionStorage.setItem(DISMISS_KEY, JSON.stringify([...s]));
}

function decodeToken(token: string | null): { role?: string } {
  if (!token) return {};
  try { return JSON.parse(atob(token.split(".")[1])); }
  catch { return {}; }
}

const TYPE_STYLE: Record<string, { bar: string; Icon: any }> = {
  info:    { bar: "bg-blue-600",  Icon: Info },
  warning: { bar: "bg-amber-500", Icon: AlertTriangle },
  error:   { bar: "bg-red-600",   Icon: AlertTriangle },
};

export function PlatformBanner() {
  const [maintenance, setMaintenance] = useState<Maintenance>({ enabled: false });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [dismissed, setDismissed] = useState<Set<number>>(getDismissed);
  // Re-read token on each status poll so banner updates after login/logout
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("kynaAuthToken"));

  const fetchStatus = useCallback(async () => {
    // Re-read token each poll cycle
    setToken(localStorage.getItem("kynaAuthToken"));
    try {
      const res = await fetch(STATUS_URL, { credentials: "include" });
      if (!res.ok) return;
      const data = await res.json();
      setMaintenance(data.maintenance ?? { enabled: false });
      setNotifications(data.notifications ?? []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchStatus();
    const id = setInterval(fetchStatus, 60_000);
    return () => clearInterval(id);
  }, [fetchStatus]);

  // Also re-read token immediately when localStorage changes (login / logout)
  useEffect(() => {
    const onStorage = () => setToken(localStorage.getItem("kynaAuthToken"));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleDismiss = (id: number) => {
    persistDismiss(id);
    setDismissed(prev => new Set([...prev, id]));
  };

  const payload = decodeToken(token);
  const isAuthenticated = !!token;
  const isAdmin = payload.role === "admin";

  const visible = notifications.filter(n => !dismissed.has(n.id));

  return (
    <>
      {/* Full blocking overlay — only for authenticated non-admin users */}
      {maintenance.enabled && isAuthenticated && !isAdmin && (
        <div className="fixed inset-0 z-[9999] bg-[#0f1117] flex flex-col items-center justify-center text-center p-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 flex items-center justify-center mb-6">
            <Wrench className="w-8 h-8 text-amber-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Under Maintenance</h1>
          <p className="text-white/60 max-w-md text-sm leading-relaxed">
            {maintenance.message || "We're performing scheduled maintenance. Please check back shortly."}
          </p>
          {maintenance.eta && (
            <p className="text-white/30 text-xs mt-4">
              Expected back:{" "}
              {new Date(maintenance.eta).toLocaleString("en-US", {
                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
              })}
            </p>
          )}
        </div>
      )}

      {/* Top banner — for unauthenticated visitors so they can still sign in */}
      {maintenance.enabled && !isAuthenticated && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-amber-500 text-white flex items-center gap-3 px-4 py-3 text-sm">
          <Wrench className="w-4 h-4 shrink-0" />
          <span className="flex-1">
            {maintenance.message || "Platform is under maintenance."} Sign in to continue if you have access.
          </span>
        </div>
      )}

      {/* Notification banners */}
      {visible.length > 0 && !isAdmin && (
        <div className="fixed top-0 left-0 right-0 z-[9998] flex flex-col" style={{ top: maintenance.enabled && !isAuthenticated ? "48px" : 0 }}>
          {visible.map(n => {
            const style = TYPE_STYLE[n.type] ?? TYPE_STYLE.info;
            const Icon = style.Icon;
            return (
              <div key={n.id} className={`${style.bar} text-white flex items-center gap-3 px-4 py-3 text-sm`}>
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{n.message}</span>
                <button onClick={() => handleDismiss(n.id)} className="opacity-70 hover:opacity-100 transition-opacity ml-2">
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
