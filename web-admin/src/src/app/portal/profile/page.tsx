"use client";

import { useState, useEffect, useCallback } from "react";
import { signOut } from "next-auth/react";
import {
  User as UserIcon,
  Shield,
  KeyRound,
  LogOut,
  RefreshCw,
  Phone,
  Hash,
  Layers,
  Building2,
  Calendar,
} from "lucide-react";
import { UserPublic, UserRole, portalApi, ROLE_LABELS, ROLE_BADGE_COLORS } from "@/lib/portal-client";

export default function ProfilePage() {
  const [currentUser, setCurrentUser] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);

  // Password change state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPass, setChangingPass] = useState(false);
  const [passMessage, setPassMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      // 1. Fetch token to ensure cookie and user session
      const tokenRes = await fetch("/api/portal/token").then((r) => r.json());
      if (tokenRes?.user) {
        setCurrentUser(tokenRes.user);
      }
      // 2. Fetch full profile details if available
      try {
        const meRes = await portalApi.getMe();
        if (meRes?.user) {
          setCurrentUser(meRes.user);
        }
      } catch {}
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      setPassMessage({ type: "error", text: "Vui lòng điền mật khẩu hiện tại và mật khẩu mới." });
      return;
    }
    if (newPassword.length < 4) {
      setPassMessage({ type: "error", text: "Mật khẩu mới phải có ít nhất 4 ký tự." });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPassMessage({ type: "error", text: "Mật khẩu xác nhận không khớp." });
      return;
    }

    setChangingPass(true);
    setPassMessage(null);
    try {
      await portalApi.changePassword(oldPassword, newPassword);
      setPassMessage({ type: "success", text: "✅ Đổi mật khẩu thành công!" });
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: unknown) {
      setPassMessage({ type: "error", text: err instanceof Error ? err.message : "Không thể đổi mật khẩu" });
    } finally {
      setChangingPass(false);
    }
  }

  if (loading && !currentUser) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-slate-400">
        <RefreshCw size={24} className="animate-spin text-emerald-800" />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white p-8 text-center">
        <p className="text-sm font-semibold text-slate-700">Không tìm thấy thông tin tài khoản.</p>
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="mt-4 rounded-xl bg-emerald-800 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-900"
        >
          Đăng nhập lại
        </button>
      </div>
    );
  }

  const role = currentUser.role as UserRole;
  const roleBadge = ROLE_BADGE_COLORS[role] || ROLE_BADGE_COLORS.OPERATOR;

  return (
    <div className="space-y-6">
      {/* Profile Header Card */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-700 to-emerald-950 text-2xl font-bold text-white shadow-md">
              {currentUser.name?.charAt(0) || "U"}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-slate-900">{currentUser.name}</h1>
                <span className={`rounded-md border px-2.5 py-0.5 text-xs font-bold ${roleBadge.bg} ${roleBadge.text} ${roleBadge.border}`}>
                  {ROLE_LABELS[role]}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-500">
                Mã nhân viên: <span className="font-semibold text-slate-700">{currentUser.employeeCode}</span> · {currentUser.area?.name || "Toàn nhà máy"}
              </p>
            </div>
          </div>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex items-center gap-1.5 self-start rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-bold text-rose-700 hover:bg-rose-100 sm:self-auto cursor-pointer transition-colors"
          >
            <LogOut size={15} />
            <span>Đăng xuất</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Account Details */}
        <div className="space-y-6 lg:col-span-7">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <UserIcon className="text-emerald-700" size={18} />
              <h2 className="text-sm font-bold text-slate-900">
                Thông Tin Cá Nhân &amp; Tổ Chức
              </h2>
            </div>
            <div className="mt-4 divide-y divide-slate-100 text-xs">
              <div className="flex items-center justify-between py-3">
                <span className="flex items-center gap-2 text-slate-500">
                  <Hash size={14} className="text-slate-400" />
                  <span>Mã nhân viên</span>
                </span>
                <span className="font-bold text-slate-900 font-mono text-sm">{currentUser.employeeCode}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="flex items-center gap-2 text-slate-500">
                  <UserIcon size={14} className="text-slate-400" />
                  <span>Họ và tên</span>
                </span>
                <span className="font-bold text-slate-900">{currentUser.name}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="flex items-center gap-2 text-slate-500">
                  <Shield size={14} className="text-slate-400" />
                  <span>Vai trò hệ thống</span>
                </span>
                <span className={`rounded-md border px-2 py-0.5 text-[11px] font-bold ${roleBadge.bg} ${roleBadge.text} ${roleBadge.border}`}>
                  {ROLE_LABELS[role]}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="flex items-center gap-2 text-slate-500">
                  <Phone size={14} className="text-slate-400" />
                  <span>Số điện thoại</span>
                </span>
                <span className="font-semibold text-slate-700">{currentUser.phone || "Chưa cập nhật"}</span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="flex items-center gap-2 text-slate-500">
                  <Layers size={14} className="text-slate-400" />
                  <span>Khu vực phân xưởng</span>
                </span>
                <span className="font-bold text-emerald-800">
                  {currentUser.area?.name || "Toàn nhà máy (Không giới hạn)"}
                </span>
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="flex items-center gap-2 text-slate-500">
                  <Building2 size={14} className="text-slate-400" />
                  <span>Đơn vị</span>
                </span>
                <span className="font-medium text-slate-700">TBS Kiên Giang 1 (KG1)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Change Password */}
        <div className="space-y-6 lg:col-span-5">
          <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <KeyRound className="text-emerald-700" size={18} />
              <h2 className="text-sm font-bold text-slate-900">Đổi Mật Khẩu</h2>
            </div>

            <form onSubmit={handleChangePassword} className="mt-4 space-y-3.5">
              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Mật khẩu hiện tại</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  placeholder="Nhập mật khẩu hiện tại"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Mật khẩu mới</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nhập mật khẩu mới"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold text-slate-700">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Nhập lại mật khẩu mới"
                  className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
                  required
                />
              </div>

              {passMessage && (
                <div
                  className={`rounded-xl p-3 text-xs ${
                    passMessage.type === "success"
                      ? "border border-emerald-300 bg-emerald-50 text-emerald-800"
                      : "border border-rose-300 bg-rose-50 text-rose-700"
                  }`}
                >
                  {passMessage.text}
                </div>
              )}

              <button
                type="submit"
                disabled={changingPass}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-800 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-900 disabled:opacity-60 cursor-pointer transition-colors"
              >
                {changingPass ? <RefreshCw size={14} className="animate-spin" /> : <KeyRound size={14} />}
                <span>Cập nhật mật khẩu</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
