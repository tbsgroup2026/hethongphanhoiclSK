"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  UploadCloud,
  X,
  RefreshCw,
  Camera,
  Check,
  Zap,
  Tag,
  Sparkles,
} from "lucide-react";
import {
  Category,
  Severity,
  FailureCategory,
  portalApi,
  UserPublic,
} from "@/lib/portal-client";

const SIZE_OPTIONS = [
  "5",
  "5T",
  "6",
  "6T",
  "7",
  "7T",
  "8",
  "8T",
  "9",
  "9T",
  "10",
  "10T",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
];

const SEVERITY_CARDS: {
  value: Severity;
  label: string;
  desc: string;
  icon: string;
  activeClass: string;
}[] = [
  {
    value: "LOW",
    label: "Thấp",
    desc: "Chỉnh sửa nhanh tại chỗ, không dừng chuyền",
    icon: "🌱",
    activeClass: "border-slate-400 bg-slate-50 text-slate-900 ring-2 ring-slate-400/30",
  },
  {
    value: "MEDIUM",
    label: "Trung Bình",
    desc: "Lỗi cụm linh kiện, cần QA hỗ trợ xem xét",
    icon: "🛠️",
    activeClass: "border-blue-500 bg-blue-50 text-blue-950 ring-2 ring-blue-500/20",
  },
  {
    value: "HIGH",
    label: "Cao",
    desc: "Nguy cơ lan truyền lỗi sang nhiều sản phẩm",
    icon: "⚠️",
    activeClass: "border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-500/20",
  },
  {
    value: "URGENT",
    label: "Khẩn Cấp (SOS)",
    desc: "Dừng chuyền may ngay để ngăn phế phẩm",
    icon: "🚨",
    activeClass: "border-rose-500 bg-rose-50 text-rose-950 ring-2 ring-rose-500/20",
  },
];

const COMMON_DEFECT_TAGS = [
  { label: "Quai may lệch chỉ", icon: "🧵" },
  { label: "Hở keo viền gót", icon: "🧴" },
  { label: "Nhăn quăn da mũi", icon: "✂️" },
  { label: "Đứt chỉ may viền", icon: "🪡" },
  { label: "Lệch form đế", icon: "📐" },
  { label: "Vết bẩn keo da", icon: "🧼" },
];

export default function ReportIssuePage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserPublic | null>(null);

  // Form State
  const [poCode, setPoCode] = useState("");
  const [productName, setProductName] = useState("");
  const [areaId, setAreaId] = useState("");
  const [productionLineId, setProductionLineId] = useState("");
  const [failureCategoryId, setFailureCategoryId] = useState("");
  const [otherFailureNote, setOtherFailureNote] = useState("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [severity, setSeverity] = useState<Severity>("MEDIUM");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportError, setReportError] = useState<string | null>(null);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [submittedIssue, setSubmittedIssue] = useState<{
    id: string;
    poCode: string;
    description: string;
    severity: Severity;
    areaName: string;
    lineName: string;
    failureCategoryName: string;
  } | null>(null);
  const [copiedZalo, setCopiedZalo] = useState(false);

  const [areas, setAreas] = useState<Category[]>([]);
  const [lines, setLines] = useState<Category[]>([]);
  const [failureCategories, setFailureCategories] = useState<FailureCategory[]>([]);

  useEffect(() => {
    Promise.all([
      portalApi.getMe().catch(() => null),
      portalApi.listAreas().catch(() => []),
      portalApi.listFailureCategories().catch(() => []),
    ]).then(([meRes, areaList, failCatList]) => {
      if (meRes?.user) {
        setCurrentUser(meRes.user);
        if (meRes.user.areaId) {
          setAreaId(meRes.user.areaId);
          portalApi.listProductionLines(meRes.user.areaId).then(setLines).catch(() => {});
        }
      }
      setAreas(areaList);
      if (failCatList && failCatList.length > 0) {
        setFailureCategories(failCatList);
      } else {
        setFailureCategories([
          { id: "fail-nvl", name: "Lỗi nguyên vật liệu", order: 1 },
          { id: "fail-may", name: "Lỗi máy móc", order: 2 },
          { id: "fail-thao-tac", name: "Lỗi thao tác", order: 3 },
        ]);
      }
    });
  }, []);

  async function handleAreaChange(nextAreaId: string) {
    setAreaId(nextAreaId);
    setProductionLineId("");
    if (!nextAreaId) {
      setLines([]);
      return;
    }
    try {
      const lineList = await portalApi.listProductionLines(nextAreaId);
      setLines(lineList);
    } catch {
      setLines([]);
    }
  }

  function handleToggleSize(sz: string) {
    setSelectedSizes((prev) => (prev.includes(sz) ? prev.filter((s) => s !== sz) : [...prev, sz]));
  }

  function handleSelectAllSizes() {
    if (selectedSizes.length === SIZE_OPTIONS.length) {
      setSelectedSizes([]);
    } else {
      setSelectedSizes([...SIZE_OPTIONS]);
    }
  }

  function handleAddDefectTag(tagLabel: string) {
    setDescription((prev) => (prev ? `${prev}, ${tagLabel}` : tagLabel));
  }

  function compressImageFile(file: File, maxWidth = 1024, maxHeight = 1024, quality = 0.75): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            } else {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            const rawRes = event.target?.result as string;
            resolve(rawRes.includes(",") ? rawRes.split(",")[1] : rawRes);
            return;
          }

          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL("image/jpeg", quality);
          const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;
          resolve(base64);
        };
        img.onerror = reject;
        img.src = event.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    setReportError(null);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64 = await compressImageFile(file);
        const uploadRes = await portalApi.uploadImage(base64, "image/jpeg");
        setImages((prev) => [...prev, uploadRes.url]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể tải ảnh lên. Vui lòng thử lại.";
      setReportError(msg);
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  }

  function formatZaloMessage(info: {
    id: string;
    poCode: string;
    severity: Severity;
    areaName: string;
    lineName: string;
    failureCategoryName: string;
    description: string;
  }) {
    const sevMap: Record<Severity, string> = {
      URGENT: "🔴 KHẨN CẤP (Dừng chuyền)",
      HIGH: "🟠 CAO (Nguy cơ lan rộng)",
      MEDIUM: "🟡 TRUNG BÌNH (Cần QA hỗ trợ)",
      LOW: "🟢 THẤP (Chỉnh sửa tại chỗ)",
    };
    const now = new Date();
    const deadline = new Date(now.getTime() + 15 * 60 * 1000);
    const timeStr = now.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });
    const dateStr = now.toLocaleDateString("vi-VN");
    const deadlineStr = deadline.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

    const reporterName = currentUser?.name ? `${currentUser.name}${currentUser.employeeCode ? ` (${currentUser.employeeCode})` : ""}` : "Nhân viên vận hành";
    const locationStr = [info.areaName, info.lineName].filter(Boolean).join(" - ") || "Phân xưởng";

    return `🚨 [HỆ THỐNG PHẢN HỒI NHANH - TBS GROUP]
📋 THẺ BÁO CÁO SỰ CỐ MỚI VỪA GỬI

• Mã PO: ${info.poCode}
• Mức độ: ${sevMap[info.severity] || info.severity}
• Người báo cáo: ${reporterName}
• Vị trí: ${locationStr}
• Phân loại lỗi: ${info.failureCategoryName}
• Mô tả chi tiết: ${info.description}
• Thời gian gửi: ${timeStr} ngày ${dateStr}
⏱️ Hạn chót nộp 5M+1E (15P): ${deadlineStr}

🔗 Xem chi tiết & Điều tra tại Web Portal:
https://hethongphanhoiclsk.tbsgroup2026.workers.dev/portal/issues/${info.id}`;
  }

  async function handleShareZalo(info: {
    id: string;
    poCode: string;
    severity: Severity;
    areaName: string;
    lineName: string;
    failureCategoryName: string;
    description: string;
  }) {
    const text = formatZaloMessage(info);
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
      }
      setCopiedZalo(true);
      setTimeout(() => setCopiedZalo(false), 4000);
    } catch {
      // Best-effort copy
    }

    // Mở Zalo Web / App
    const zaloUrl = "https://chat.zalo.me";
    window.open(zaloUrl, "_blank");
  }

  function handleResetForm() {
    setSubmittedIssue(null);
    setReportSuccess(false);
    setPoCode("");
    setProductName("");
    setDescription("");
    setSelectedSizes([]);
    setImages([]);
    setOtherFailureNote("");
    setSeverity("MEDIUM");
  }

  async function handleSubmitReport(e: React.FormEvent) {
    e.preventDefault();
    if (!poCode.trim()) {
      setReportError("Vui lòng nhập Mã sản phẩm / PO.");
      return;
    }
    if (!description.trim()) {
      setReportError("Vui lòng nhập Mô tả chi tiết hiện tượng lỗi.");
      return;
    }
    if (!areaId) {
      setReportError("Vui lòng chọn Phân xưởng.");
      return;
    }
    if (!failureCategoryId) {
      setReportError("Vui lòng chọn Danh mục lỗi.");
      return;
    }
    if (failureCategoryId === "OTHER" && !otherFailureNote.trim()) {
      setReportError("Vui lòng nhập mô tả cho loại lỗi Khác.");
      return;
    }

    setSubmittingReport(true);
    setReportError(null);
    try {
      const fullDescription = [
        productName.trim() ? `[Sản phẩm: ${productName.trim()}]` : "",
        selectedSizes.length > 0 ? `[Size: ${selectedSizes.join(", ")}]` : "",
        description.trim(),
      ]
        .filter(Boolean)
        .join(" ");

      const result = await portalApi.reportIssue({
        areaId,
        productionLineId: productionLineId || undefined,
        failureCategoryId: failureCategoryId === "OTHER" ? undefined : failureCategoryId,
        otherFailureNote: failureCategoryId === "OTHER" ? otherFailureNote.trim() : undefined,
        severity,
        poCode: poCode.trim(),
        description: fullDescription,
        images: images.length > 0 ? images : undefined,
      });

      const selectedArea = areas.find((a) => a.id === areaId)?.name || "";
      const selectedLine = lines.find((l) => l.id === productionLineId)?.name || "";
      const selectedFailCat = failureCategoryId === "OTHER"
        ? otherFailureNote.trim()
        : failureCategories.find((f) => f.id === failureCategoryId)?.name || "Lỗi chất lượng";

      setSubmittedIssue({
        id: result.id,
        poCode: poCode.trim(),
        description: fullDescription,
        severity,
        areaName: selectedArea,
        lineName: selectedLine,
        failureCategoryName: selectedFailCat,
      });
      setReportSuccess(true);
    } catch (err: unknown) {
      setReportError(err instanceof Error ? err.message : "Có lỗi xảy ra khi gửi báo cáo.");
    } finally {
      setSubmittingReport(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-20">
      {/* Back to Dashboard Breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          href="/portal"
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
        >
          <ArrowLeft size={14} />
          <span>Quay lại Trang Chủ</span>
        </Link>

        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-bold text-[#005A36]">Quy trình 2 Giờ Vàng</span>
        </div>
      </div>

      {/* ─── POPUP DIALOG THÀNH CÔNG & CHIA SẺ ZALO (MODAL) ─────────────── */}
      {submittedIssue && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl border border-slate-100 bg-white p-6 sm:p-7 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-[#005A36] shadow-xs">
                  <CheckCircle2 size={28} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Báo Cáo Sự Cố Đã Gửi Thành Công!
                  </h3>
                  <p className="text-xs text-slate-500">
                    Mã PO: <span className="font-mono font-bold text-slate-900">{submittedIssue.poCode}</span> • Đã phát động 2 Giờ Vàng
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => router.push(`/portal/issues/${submittedIssue.id}`)}
                className="rounded-xl p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Box Preview Tin Nhắn Zalo Đã Soạn */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                  <span>💬 Tin nhắn báo cáo Zalo (đã soạn sẵn):</span>
                </span>
                <span className="text-[10.5px] font-bold text-blue-600">
                  Nhóm: App HỆ THỐNG PHẢN HỒI NHANH
                </span>
              </div>
              <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-3.5 text-[11px] leading-relaxed text-slate-800 font-mono whitespace-pre-wrap max-h-48 overflow-y-auto select-all shadow-inner">
                {formatZaloMessage(submittedIssue)}
              </div>
            </div>

            {copiedZalo && (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-800 flex items-center gap-2">
                <Check size={16} />
                <span>✓ Đã sao chép nội dung báo cáo vào bộ nhớ tạm! Đang mở Zalo...</span>
              </div>
            )}

            {/* Nút hành động chính: Chia sẻ vào Zalo */}
            <div className="space-y-2.5 pt-1">
              <button
                type="button"
                onClick={() => handleShareZalo(submittedIssue)}
                className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-[#0068FF] hover:bg-[#0054cc] active:scale-98 px-5 py-3.5 text-xs font-bold text-white shadow-md transition-all uppercase tracking-wide"
              >
                <span className="text-base">📲</span>
                <span>Chia sẻ vào nhóm Zalo (App HỆ THỐNG PHẢN HỒI NHANH)</span>
              </button>

              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => router.push(`/portal/issues/${submittedIssue.id}`)}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-slate-100 px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors"
                >
                  <span>📋 Xem trang điều tra</span>
                </button>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="flex items-center justify-center gap-1.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition-colors"
                >
                  <span>➕ Tạo báo cáo khác</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 2-COLUMN DEFECT STUDIO CANVAS (IMAGE 1) ──────────────────────── */}
      <form onSubmit={handleSubmitReport} className="rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-xs space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          {/* CỘT 1: SẢN PHẨM & VỊ TRÍ (col-span-6) */}
          <div className="lg:col-span-6 space-y-5 border-b lg:border-b-0 lg:border-r border-slate-100 pb-6 lg:pb-0 lg:pr-6">
            <div>
              <h2 className="text-xs font-bold text-[#005A36] uppercase tracking-wider flex items-center gap-1.5">
                <span>1. Sự cố xảy ra ở sản phẩm &amp; vị trí nào?</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Điền mã sản phẩm và nơi phát hiện để đội ngũ điều phối tới đúng chuyền.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Mã PO / Sản phẩm <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={poCode}
                  onChange={(e) => setPoCode(e.target.value)}
                  placeholder="VD: SK-GO-WALK-6"
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-[#005A36] focus:bg-white focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Tên sản phẩm
                </label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="VD: Giày Skechers Go Walk Flex"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-[#005A36] focus:bg-white focus:outline-none transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Phân xưởng phát hiện <span className="text-rose-500">*</span>
                </label>
                <select
                  value={areaId}
                  onChange={(e) => handleAreaChange(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs font-semibold text-slate-900 focus:border-[#005A36] focus:bg-white focus:outline-none transition-colors"
                >
                  <option value="">-- Chọn Phân xưởng --</option>
                  {areas.map((a) => (
                    <option key={a.id} value={a.id}>
                      [{a.name}] {a.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Công đoạn / Chuyền
                </label>
                <select
                  value={productionLineId}
                  onChange={(e) => setProductionLineId(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs font-semibold text-slate-900 focus:border-[#005A36] focus:bg-white focus:outline-none transition-colors"
                >
                  <option value="">VD: Công đoạn Gò mũi / Chuyền 1</option>
                  {lines.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Danh mục lỗi <span className="text-rose-500">*</span>
                </label>
                <select
                  value={failureCategoryId}
                  onChange={(e) => {
                    setFailureCategoryId(e.target.value);
                    if (e.target.value !== "OTHER") {
                      setOtherFailureNote("");
                    }
                  }}
                  required
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-3 py-2.5 text-xs font-semibold text-slate-900 focus:border-[#005A36] focus:bg-white focus:outline-none transition-colors"
                >
                  <option value="">-- Chọn Danh mục lỗi --</option>
                  {failureCategories.map((fc) => (
                    <option key={fc.id} value={fc.id}>
                      {fc.name}
                    </option>
                  ))}
                  <option value="OTHER">Khác...</option>
                </select>

                {failureCategoryId === "OTHER" && (
                  <input
                    type="text"
                    value={otherFailureNote}
                    onChange={(e) => setOtherFailureNote(e.target.value)}
                    placeholder="Mô tả chi tiết loại lỗi khác..."
                    required
                    className="mt-2.5 w-full rounded-2xl border border-slate-200 bg-slate-50/60 px-3.5 py-2.5 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:border-[#005A36] focus:bg-white focus:outline-none transition-colors"
                  />
                )}
              </div>
            </div>

            {/* Size Matrix */}
            <div className="pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <span className="text-xs font-bold text-slate-800">Những cỡ giày (size) nào bị ảnh hưởng?</span>
                  <p className="text-[10.5px] text-slate-500">Chạm để chọn các size phát hiện lỗi</p>
                </div>

                <button
                  type="button"
                  onClick={handleSelectAllSizes}
                  className="text-[11px] font-bold text-[#005A36] hover:underline"
                >
                  {selectedSizes.length === SIZE_OPTIONS.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {SIZE_OPTIONS.map((sz) => {
                  const isSelected = selectedSizes.includes(sz);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => handleToggleSize(sz)}
                      className={`h-10 min-w-[44px] px-3 rounded-2xl border text-xs font-bold transition-all ${
                        isSelected
                          ? "border-[#005A36] bg-[#005A36] text-white shadow-xs scale-102"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300"
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>

              {selectedSizes.length > 0 && (
                <p className="text-[11px] text-emerald-800 font-semibold mt-2">
                  ✓ Đã chọn {selectedSizes.length} cỡ: {selectedSizes.join(", ")}
                </p>
              )}
            </div>
          </div>

          {/* CỘT 2: MỨC ĐỘ & HIỆN TƯỢNG LỖI & ẢNH (col-span-6) */}
          <div className="lg:col-span-6 space-y-5">
            <div>
              <h2 className="text-xs font-bold text-[#005A36] uppercase tracking-wider flex items-center gap-1.5">
                <span>2. Đánh giá mức độ &amp; Mô tả hiện tượng</span>
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Cung cấp mô tả cụ thể để kỹ thuật viên chuẩn bị dụng cụ phù hợp.
              </p>
            </div>

            {/* Severity Cards */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Mức độ nghiêm trọng <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {SEVERITY_CARDS.map((opt) => {
                  const isSelected = severity === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setSeverity(opt.value)}
                      className={`p-3 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? opt.activeClass
                          : "border-slate-200 bg-white hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold flex items-center gap-1">
                          <span>{opt.icon}</span>
                          <span>{opt.label}</span>
                        </span>
                        {isSelected && <Check size={13} className="text-emerald-700" />}
                      </div>
                      <p className="text-[10px] text-slate-500 line-clamp-1 mt-1 leading-tight">{opt.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description & 1-Touch Defect Suggestions */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1">
                Mô tả chi tiết hiện tượng lỗi <span className="text-rose-500">*</span>
              </label>

              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="VD: Quai may lệch chỉ 2mm, đường may nhăn quăn gót, hở keo đế..."
                required
                className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 p-3 text-xs font-medium text-slate-900 placeholder:text-slate-400 focus:border-[#005A36] focus:bg-white focus:outline-none transition-colors"
              />

              {/* Helpful Defect Chips */}
              <div className="mt-2 flex items-center gap-1.5 flex-wrap">
                <span className="text-[10.5px] font-semibold text-slate-400">Gợi ý nhanh:</span>
                {COMMON_DEFECT_TAGS.map((tag) => (
                  <button
                    key={tag.label}
                    type="button"
                    onClick={() => handleAddDefectTag(tag.label)}
                    className="flex items-center gap-1 rounded-full bg-slate-100 border border-slate-200/60 px-2.5 py-0.5 text-[10.5px] font-medium text-slate-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-[#005A36] transition-colors"
                  >
                    <span>{tag.icon}</span>
                    <span>{tag.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Image Upload Strip */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Hình ảnh minh chứng thực tế tại chuyền
              </label>

              <div className="flex items-center gap-2.5 flex-wrap">
                <label className="flex flex-col items-center justify-center h-20 w-24 rounded-2xl border-2 border-dashed border-emerald-300 bg-emerald-50/40 hover:bg-emerald-50 hover:border-emerald-600 transition-colors cursor-pointer text-center p-1 flex-shrink-0">
                  {uploadingImage ? (
                    <RefreshCw size={16} className="animate-spin text-[#005A36]" />
                  ) : (
                    <>
                      <Camera size={20} className="text-[#005A36]" />
                      <span className="text-[10px] font-bold text-[#005A36] mt-1">Chụp / Tải ảnh</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                  />
                </label>

                {images.map((imgUrl, idx) => (
                  <div key={idx} className="relative h-20 w-20 rounded-2xl border border-slate-200 overflow-hidden group flex-shrink-0 shadow-2xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imgUrl} alt={`Ảnh ${idx + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 h-5 w-5 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
                    >
                      <X size={10} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {reportError && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 text-xs font-semibold text-rose-700 flex items-center gap-2">
            <AlertTriangle size={16} />
            <span>{reportError}</span>
          </div>
        )}

        {/* ─── ACTION FOOTER ──────────────────────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-100 pt-5">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[#005A36] text-[10px] font-bold">
              ✓
            </span>
            {poCode.trim() ? (
              <span>
                Đang lập phiếu cho: <strong className="text-slate-900 font-mono">PO {poCode}</strong> ({selectedSizes.length} size)
              </span>
            ) : (
              <span>Điền mã PO và nội dung để gửi thông báo tức thời tới QA &amp; Trưởng Line</span>
            )}
          </div>

          <button
            type="submit"
            disabled={submittingReport || uploadingImage}
            className="flex items-center justify-center gap-2 rounded-2xl bg-[#005A36] px-7 py-3 text-xs font-bold text-white shadow-sm hover:bg-[#00472A] active:scale-98 disabled:opacity-60 transition-all uppercase tracking-wide"
          >
            {submittingReport ? (
              <>
                <RefreshCw size={15} className="animate-spin" />
                <span>Đang Phát Động...</span>
              </>
            ) : (
              <>
                <Sparkles size={15} className="text-lime-300" />
                <span>Gửi Báo Cáo &amp; Phát Động 2 Giờ Vàng</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
