"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Eye, EyeOff, UserCheck, ShieldCheck, Lock, User } from "lucide-react";
import { BrandMark } from "@/components/brand-logo";

export default function LoginPage() {
  const router = useRouter();
  const [employeeCode, setEmployeeCode] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn("credentials", {
        employeeCode: employeeCode.trim(),
        password: password.trim(),
        redirect: false,
      });

      if (res?.error) {
        setLoading(false);
        setError("Tên đăng nhập hoặc mật khẩu không chính xác.");
        return;
      }

      const tokenRes = await fetch("/api/portal/token");
      if (tokenRes.ok) {
        const data = await tokenRes.json();
        if (data?.user?.role === "ADMIN") {
          router.push("/admin");
        } else {
          router.push("/portal");
        }
      } else {
        if (employeeCode.toUpperCase().startsWith("ADM")) {
          router.push("/admin");
        } else {
          router.push("/portal");
        }
      }
      router.refresh();
    } catch {
      setError("Đã xảy ra lỗi khi đăng nhập. Vui lòng thử lại.");
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden bg-[#f9f8f6] px-4 py-12 text-warm-900">
      {/* Ambient background glow */}
      <div className="pointer-events-none absolute -top-40 -left-40 h-[32rem] w-[32rem] rounded-full bg-emerald-200/25 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-[32rem] w-[32rem] rounded-full bg-lime-200/20 blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        <div className="flex flex-col justify-center rounded-3xl border border-[#e8e4de]/90 bg-white p-7 sm:p-9 shadow-[0_12px_36px_rgba(0,90,54,0.09),0_3px_10px_rgba(0,90,54,0.04)]">
          {/* Brand Header */}
          <div className="mb-6 flex flex-col items-center text-center">
            <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-emerald p-2.5 shadow-[0_3px_10px_rgba(0,90,54,0.2)] ring-4 ring-brand-lighter/20">
              <BrandMark size={36} />
            </div>
            <h1 className="text-xl font-extrabold tracking-tight text-warm-900 sm:text-2xl">
              TBS HTPH-CLSK
            </h1>
            <p className="mt-1 text-xs font-semibold text-brand-emerald">
              Hệ thống Phản hồi & Xử lý Sự cố Chất lượng
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4.5">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-warm-700">
                <User size={14} className="text-brand-emerald" />
                <span>Mã nhân viên / Tên đăng nhập</span>
              </label>
              <input
                id="employeeCode"
                value={employeeCode}
                onChange={(e) => setEmployeeCode(e.target.value)}
                className="w-full rounded-xl border border-[#e8e4de] bg-[#f9f8f6] px-4 py-3 text-sm text-warm-900 placeholder:text-warm-400 transition-all duration-150 focus:border-brand-mid focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-lighter font-medium"
                placeholder="Nhập mã nhân viên..."
                autoCapitalize="characters"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-xs font-bold text-warm-700">
                <Lock size={14} className="text-brand-emerald" />
                <span>Mật khẩu</span>
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-[#e8e4de] bg-[#f9f8f6] px-4 py-3 pr-11 text-sm text-warm-900 placeholder:text-warm-400 transition-all duration-150 focus:border-brand-mid focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-lighter font-medium"
                  placeholder="Nhập mật khẩu..."
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-xl p-1 text-warm-400 hover:text-warm-700 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-medium text-rose-700">
                {error}
              </div>
            )}

            <button
              id="loginSubmitBtn"
              type="submit"
              disabled={loading}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-emerald py-3.5 text-sm font-bold text-white shadow-[0_2px_10px_rgba(0,90,54,0.18)] hover:bg-[#0a4d2e] active:scale-[0.98] disabled:opacity-60 transition-all duration-150 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Đang xác thực...</span>
                </>
              ) : (
                <>
                  <UserCheck size={18} />
                  <span>Đăng Nhập Hệ Thống</span>
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <div className="mt-6 border-t border-[#f0ece6] pt-4 text-center">
            <p className="flex items-center justify-center gap-1.5 text-[11px] text-warm-500 font-medium">
              <ShieldCheck size={13} className="text-brand-emerald" />
              <span>Hệ thống Bảo mật Phân xưởng &middot; TBS Group</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
