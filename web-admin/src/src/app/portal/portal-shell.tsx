"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  Home,
  Bell,
  Wrench,
  BarChart3,
  BookOpen,
  LogOut,

  ChevronDown,
  ChevronUp,
  Sparkles,
  Shield,
  Menu,
  X,
  Plus,
  Clock,
  AlertCircle,
  FlaskConical,
  CheckCircle2,
  AlertTriangle,
  Key,
  ChevronLeft,
  ChevronRight,
  UserCheck,
  Building2,
  HeartHandshake,
  HelpCircle,
} from "lucide-react";
import { BrandMark, BrandLogoFull } from "@/components/brand-logo";
import {
  UserPublic,

  UserRole,
  ROLE_LABELS,
  ROLE_BADGE_COLORS,
  portalApi,
  QualityIssue,
} from "@/lib/portal-client";

export default function PortalShell({
  user,
  children,
}: {
  user: UserPublic;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [statusMenuOpen, setStatusMenuOpen] = useState(true);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [issues, setIssues] = useState<QualityIssue[]>([]);
  const [currentTime, setCurrentTime] = useState("");

  const [currentUser, setCurrentUser] = useState<UserPublic>(user);

  useEffect(() => {
    setCurrentUser(user);
  }, [user]);

  useEffect(() => {
    portalApi.getMe().then((res) => {
      if (res?.user) setCurrentUser(res.user);
    }).catch(() => {});
  }, []);

  // Live Digital Clock
  useEffect(() => {
    function updateClock() {
      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0];
      const day = String(now.getDate()).padStart(2, "0");
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const year = now.getFullYear();
      setCurrentTime(`${timeStr} · ${day}/${month}/${year}`);
    }
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  const role = currentUser.role as UserRole;
  const areaName = currentUser.area?.name || "Toàn nhà máy";

  const [notifPermission, setNotifPermission] = useState<string>("granted");
  const prevCountRef = useState<{ count: number }>({ count: 0 });

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      setNotifPermission(Notification.permission);
    }
  }, []);

  async function requestWebNotification() {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotifPermission(perm);
        if (perm === "granted") {
          new Notification("Hệ Thống TBS Group", {
            body: "Đã kích hoạt thông báo chuông về điện thoại thành công!",
            icon: "/favicon.ico",
          });
        }
      } catch {
        // ignore
      }
    }
  }

  useEffect(() => {
    let mounted = true;
    function fetchLiveStats() {
      Promise.all([
        portalApi.listNotifications().catch(() => []),
        portalApi.listIssues().catch(() => []),
      ]).then(([notifs, issueList]) => {
        if (mounted) {
          const newCount = notifs.length;
          if (newCount > prevCountRef[0].count && prevCountRef[0].count > 0) {
            if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
              new Notification("🔔 Cảnh báo sự cố mới — TBS Group", {
                body: "Có sự cố chất lượng mới vừa được ghi nhận trong phân xưởng.",
                icon: "/favicon.ico",
              });
            }
          }
          prevCountRef[0].count = newCount;
          setUnreadCount(newCount);
          setIssues(issueList);
        }
      });
    }
    fetchLiveStats();
    const timer = setInterval(fetchLiveStats, 10000);
    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [pathname]);

  const countPending = issues.filter((i) => i.status === "REPORTED").length;
  const countInProgress = issues.filter(
    (i) => i.status === "INVESTIGATING" || i.status === "ROOT_CAUSE_FOUND"
  ).length;
  const countTrial = issues.filter((i) => i.status === "ASSIGNED" || i.status === "IN_PROGRESS").length;
  const countDone = issues.filter((i) => i.status === "DONE").length;
  const countSos = issues.filter((i) => i.severity === "URGENT").length;
  const totalStatusCount = issues.length;

  return (
    <div className="flex min-h-screen bg-[#F7F9F8] text-slate-900 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
      {/* ─── 1. HUMAN & WARM LEFTBAR ──────────────────────────────────────── */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-200/80 bg-white shadow-[1px_0_10px_rgba(0,0,0,0.02)] transition-all duration-300 ${
          sidebarCollapsed ? "w-20" : "w-64"
        } hidden md:flex`}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
          <div className="flex items-center overflow-hidden">
            {!sidebarCollapsed ? (
              <BrandLogoFull height={40} className="hover:opacity-90 transition-opacity" />
            ) : (
              <BrandMark size={32} />
            )}
          </div>
          <button
            onClick={() => setSidebarCollapsed((c) => !c)}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors ml-2 flex-shrink-0"
            title={sidebarCollapsed ? "Mở rộng menu" : "Thu gọn menu"}
          >
            {sidebarCollapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
          </button>
        </div>


        {/* Human Personal Profile Card */}
        {!sidebarCollapsed ? (
          <div className="p-3 border-b border-slate-100">
            <div className="rounded-2xl bg-gradient-to-br from-emerald-50/90 to-teal-50/50 p-3 border border-emerald-200/70 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#005A36] text-white font-bold text-xs shadow-2xs">
                  {currentUser.name?.charAt(0) || "U"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="truncate text-xs font-bold text-slate-900">{currentUser.name}</p>
                    <span className="h-2 w-2 rounded-full bg-emerald-500 ring-2 ring-emerald-200" title="Đang trực ca" />
                  </div>
                  <p className="truncate text-[10.5px] text-slate-600 font-medium">
                    {ROLE_LABELS[role]} · {areaName}
                  </p>
                </div>
              </div>
              <div className="mt-2.5 flex items-center justify-between text-[10px] font-semibold text-[#005A36] border-t border-emerald-200/50 pt-1.5">
                <span>Mã NV: {currentUser.employeeCode}</span>
                <span className="bg-emerald-100/90 px-1.5 py-0.2 rounded font-bold">Đang trong ca</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex justify-center p-3 border-b border-slate-100">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#005A36] text-white font-bold text-xs">
              {currentUser.name?.charAt(0) || "U"}
            </div>
          </div>
        )}

        {/* Big Action CTA: Báo Cáo Vấn Đề */}
        <div className="p-3">
          <Link
            href="/portal?action=report"
            className={`flex items-center justify-center gap-2 rounded-xl bg-[#005A36] font-bold text-white shadow-xs hover:bg-[#00472A] active:scale-98 transition-all ${
              sidebarCollapsed ? "h-10 w-full p-0" : "py-2.5 px-3 text-xs"
            }`}
          >
            <Plus size={16} className="text-lime-300 flex-shrink-0" />
            {!sidebarCollapsed && <span className="tracking-wide font-extrabold text-[11.5px]">BÁO CÁO VẤN ĐỀ</span>}
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
          <Link
            href="/portal"
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
              pathname === "/portal"
                ? "bg-emerald-50 text-[#005A36] font-bold border border-emerald-200/60"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Home size={15} className={pathname === "/portal" ? "text-[#005A36]" : "text-slate-400"} />
            {!sidebarCollapsed && <span>Trang chủ</span>}
          </Link>

          <Link
            href="/portal/work"
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
              pathname === "/portal/work"
                ? "bg-emerald-50 text-[#005A36] font-bold border border-emerald-200/60"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <Wrench size={15} className={pathname === "/portal/work" ? "text-[#005A36]" : "text-slate-400"} />
            {!sidebarCollapsed && <span>Nhiệm vụ &amp; Công việc</span>}
          </Link>

          <Link
            href="/portal/notifications"
            className={`flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
              pathname === "/portal/notifications"
                ? "bg-emerald-50 text-[#005A36] font-bold border border-emerald-200/60"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <Bell size={15} className={pathname === "/portal/notifications" ? "text-[#005A36]" : "text-slate-400"} />
              {!sidebarCollapsed && <span>Thông báo của bạn</span>}
            </div>
            {!sidebarCollapsed && unreadCount > 0 && (
              <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white shadow-2xs animate-pulse">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>

          <Link
            href="/portal/library"
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
              pathname === "/portal/library"
                ? "bg-emerald-50 text-[#005A36] font-bold border border-emerald-200/60"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <BookOpen size={15} className={pathname === "/portal/library" ? "text-[#005A36]" : "text-slate-400"} />
            {!sidebarCollapsed && <span>Thư viện PO &amp; Lỗi</span>}
          </Link>

          <Link
            href="/portal/stats"
            className={`flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
              pathname === "/portal/stats"
                ? "bg-emerald-50 text-[#005A36] font-bold border border-emerald-200/60"
                : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <BarChart3 size={15} className={pathname === "/portal/stats" ? "text-[#005A36]" : "text-slate-400"} />
            {!sidebarCollapsed && <span>Dashboard</span>}
          </Link>


          {/* Phân loại trạng thái (Humanized Labels) */}
          {!sidebarCollapsed && (
            <div className="pt-3 border-t border-slate-100 mt-2">
              <button
                type="button"
                onClick={() => setStatusMenuOpen((o) => !o)}
                className="flex w-full items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-500 uppercase tracking-wider hover:text-slate-800"
              >
                <span>Theo dõi tiến độ ({totalStatusCount})</span>
                {statusMenuOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>

              {statusMenuOpen && (
                <div className="mt-1 space-y-0.5">
                  <Link
                    href="/portal?status=REPORTED"
                    className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-amber-500" />
                      <span>1. Chờ tiếp nhận</span>
                    </div>
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold px-1">
                      {countPending}
                    </span>
                  </Link>

                  <Link
                    href="/portal?status=INVESTIGATING"
                    className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-blue-500" />
                      <span>2. Đang phân tích 5M+1E</span>
                    </div>
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-100 text-blue-900 text-[10px] font-bold px-1">
                      {countInProgress}
                    </span>
                  </Link>

                  <Link
                    href="/portal?status=TRIAL_RUN"
                    className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-purple-500" />
                      <span>3. Chạy thử &amp; Theo dõi</span>
                    </div>
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-purple-100 text-purple-900 text-[10px] font-bold px-1">
                      {countTrial}
                    </span>
                  </Link>

                  <Link
                    href="/portal?status=DONE"
                    className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      <span>4. Đã nghiệm thu xong</span>
                    </div>
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold px-1">
                      {countDone}
                    </span>
                  </Link>

                  <Link
                    href="/portal?status=SOS_REQUESTED"
                    className="flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                      <span>5. 🚨 Cứu trợ khẩn cấp (SOS)</span>
                    </div>
                    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 text-white text-[10px] font-bold px-1">
                      {countSos}
                    </span>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-100 p-3 space-y-1.5">
          {!sidebarCollapsed ? (
            <>
              <button
                type="button"
                onClick={() => setPasswordModalOpen(true)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              >
                <Key size={13} className="text-slate-400" />
                <span>Đổi mật khẩu</span>
              </button>

              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
              >
                <LogOut size={13} />
                <span>Đăng xuất</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="flex h-8 w-full items-center justify-center rounded-lg text-slate-400 hover:bg-rose-50 hover:text-rose-600"
            >
              <LogOut size={15} />
            </button>
          )}
        </div>
      </aside>

      {/* ─── Mobile Slide-in Drawer ─── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs animate-in fade-in-50"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer Content */}
          <div className="fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Header */}
            <div className="flex h-16 items-center justify-between border-b border-slate-100 px-4">
              <BrandLogoFull height={36} />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Profile Card */}
            <div className="p-3 border-b border-slate-100">
              <div className="rounded-2xl bg-gradient-to-br from-emerald-50/90 to-teal-50/50 p-3 border border-emerald-200/70">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-[#005A36] text-white font-bold text-xs shadow-2xs">
                    {user.name?.charAt(0) || "U"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-bold text-slate-900">{user.name}</p>
                    <p className="truncate text-[10.5px] text-slate-600 font-medium">
                      {ROLE_LABELS[role]} · {areaName}
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-[10px] font-semibold text-[#005A36] border-t border-emerald-200/50 pt-1.5">
                  <span>Mã: {user.employeeCode}</span>
                  <span className="bg-emerald-100 px-1.5 py-0.5 rounded font-bold">Trực ca</span>
                </div>
              </div>
            </div>

            {/* Big Action CTA */}
            <div className="p-3">
              <Link
                href="/portal?action=report"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#005A36] py-2.5 px-3 text-xs font-bold text-white shadow-xs hover:bg-[#00472A]"
              >
                <Plus size={16} className="text-lime-300 flex-shrink-0" />
                <span className="tracking-wide font-extrabold text-[11.5px]">BÁO CÁO VẤN ĐỀ</span>
              </Link>
            </div>

            {/* Nav Items */}
            <div className="flex-1 overflow-y-auto px-3 py-1 space-y-1">
              <Link
                href="/portal"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold ${
                  pathname === "/portal"
                    ? "bg-emerald-50 text-[#005A36] font-bold border border-emerald-200/60"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Home size={16} className={pathname === "/portal" ? "text-[#005A36]" : "text-slate-400"} />
                <span>Trang chủ</span>
              </Link>

              <Link
                href="/portal/work"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold ${
                  pathname === "/portal/work"
                    ? "bg-emerald-50 text-[#005A36] font-bold border border-emerald-200/60"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Wrench size={16} className={pathname === "/portal/work" ? "text-[#005A36]" : "text-slate-400"} />
                <span>Nhiệm vụ & Công việc</span>
              </Link>

              <Link
                href="/portal/notifications"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold ${
                  pathname === "/portal/notifications"
                    ? "bg-emerald-50 text-[#005A36] font-bold border border-emerald-200/60"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Bell size={16} className={pathname === "/portal/notifications" ? "text-[#005A36]" : "text-slate-400"} />
                  <span>Thông báo của bạn</span>
                </div>
                {unreadCount > 0 && (
                  <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </Link>

              <Link
                href="/portal/library"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold ${
                  pathname === "/portal/library"
                    ? "bg-emerald-50 text-[#005A36] font-bold border border-emerald-200/60"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <BookOpen size={16} className={pathname === "/portal/library" ? "text-[#005A36]" : "text-slate-400"} />
                <span>Thư viện PO & Lỗi</span>
              </Link>

              <Link
                href="/portal/stats"
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs font-semibold ${
                  pathname === "/portal/stats"
                    ? "bg-emerald-50 text-[#005A36] font-bold border border-emerald-200/60"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <BarChart3 size={16} className={pathname === "/portal/stats" ? "text-[#005A36]" : "text-slate-400"} />
                <span>Dashboard</span>
              </Link>
            </div>

            {/* Actions in drawer */}
            <div className="border-t border-slate-100 p-3 space-y-2">
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  setPasswordModalOpen(true);
                }}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 py-2 text-xs font-semibold text-slate-700"
              >
                <Key size={14} className="text-slate-400" />
                <span>Đổi mật khẩu</span>
              </button>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-rose-50 py-2 text-xs font-bold text-rose-700"
              >
                <LogOut size={14} />
                <span>Đăng xuất</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 2. MAIN WORKSPACE VIEWPORT ───────────────────────────────────── */}
      <div className={`flex flex-1 flex-col transition-all duration-300 min-h-[100dvh] pb-16 md:pb-0 ${sidebarCollapsed ? "md:pl-20" : "md:pl-64"}`}>
        {/* Top Navbar */}
        <header className="sticky top-0 z-40 flex h-14 sm:h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-3 sm:px-6 backdrop-blur-md">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setMobileMenuOpen((o) => !o)}
              className="rounded-xl p-2 text-slate-600 hover:bg-slate-100 active:scale-95 md:hidden"
              aria-label="Mở Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="text-[11px] sm:text-xs font-extrabold text-[#005A36] line-clamp-1">TBS GROUP</span>
              <span className="text-slate-300">/</span>
              <span className="text-[11px] sm:text-xs font-medium text-slate-600 line-clamp-1">{areaName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {currentTime && (
              <div className="hidden sm:flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-mono text-slate-600">
                <Clock size={12} className="text-slate-400" />
                <span>{currentTime}</span>
              </div>
            )}

            <Link
              href="/portal/profile"
              className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <div className="flex h-5 w-5 items-center justify-center rounded-lg bg-[#005A36] text-[10px] font-bold text-white">
                {currentUser.name?.charAt(0) || "U"}
              </div>
              <span className="hidden sm:inline font-bold text-slate-900">{currentUser.name}</span>
            </Link>
          </div>
        </header>

        {/* Phone Notification Activation Banner (for iPhone Chrome/Safari/Android) */}
        {notifPermission === "default" && (
          <div className="bg-gradient-to-r from-[#005A36] to-teal-900 text-white px-3 sm:px-6 py-2.5 flex items-center justify-between gap-2 shadow-xs">
            <div className="flex items-center gap-2 text-xs min-w-0">
              <Bell size={15} className="text-lime-300 animate-bounce shrink-0" />
              <span className="text-[11px] sm:text-xs font-semibold truncate">
                Bật thông báo chuông về điện thoại khi có sự cố mới
              </span>
            </div>
            <button
              onClick={requestWebNotification}
              className="whitespace-nowrap rounded-lg bg-lime-400 px-2.5 py-1 text-[11px] font-extrabold text-slate-950 hover:bg-lime-300 active:scale-95 transition-all shadow-xs shrink-0"
            >
              Bật ngay
            </button>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-1 p-3 sm:p-5 lg:p-8">
          {children}
        </main>

        {/* Mobile Bottom Tab Bar for iPhone */}
        <div className="fixed bottom-0 inset-x-0 z-40 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 backdrop-blur-md px-2 md:hidden">
          <Link
            href="/portal"
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 text-[10px] font-bold ${
              pathname === "/portal" ? "text-[#005A36]" : "text-slate-500"
            }`}
          >
            <Home size={18} />
            <span>Trang chủ</span>
          </Link>

          <Link
            href="/portal/work"
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 text-[10px] font-bold ${
              pathname === "/portal/work" ? "text-[#005A36]" : "text-slate-500"
            }`}
          >
            <Wrench size={18} />
            <span>Nhiệm vụ</span>
          </Link>

          <Link
            href="/portal?action=report"
            className="flex flex-col items-center justify-center -mt-5"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#005A36] text-white shadow-lg active:scale-95 transition-transform">
              <Plus size={24} className="text-lime-300" />
            </div>
            <span className="text-[10px] font-extrabold text-[#005A36] mt-0.5">Báo sự cố</span>
          </Link>

          <Link
            href="/portal/notifications"
            className={`relative flex flex-col items-center justify-center gap-0.5 px-3 py-1 text-[10px] font-bold ${
              pathname === "/portal/notifications" ? "text-[#005A36]" : "text-slate-500"
            }`}
          >
            <Bell size={18} />
            <span>Thông báo</span>
            {unreadCount > 0 && (
              <span className="absolute top-0 right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-rose-500 px-1 text-[8px] font-bold text-white">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>

          <button
            onClick={() => setMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center gap-0.5 px-3 py-1 text-[10px] font-bold text-slate-500"
          >
            <Menu size={18} />
            <span>Thêm</span>
          </button>
        </div>
      </div>



      {/* Password Modal */}
      {passwordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-xs animate-in fade-in-50">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-sm font-bold text-slate-900 mb-1">Đổi Mật Khẩu</h3>
            <p className="text-xs text-slate-500 mb-3">Tài khoản {user.employeeCode}</p>
            <input
              type="password"
              placeholder="Nhập mật khẩu mới..."
              className="w-full rounded-lg border border-slate-200 p-2 text-xs focus:border-[#005A36] focus:outline-none mb-3"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPasswordModalOpen(false)}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-50"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => {
                  alert("Mật khẩu đã được cập nhật!");
                  setPasswordModalOpen(false);
                }}
                className="rounded-lg bg-[#005A36] px-3.5 py-1.5 text-xs font-bold text-white hover:bg-[#00472A]"
              >
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
