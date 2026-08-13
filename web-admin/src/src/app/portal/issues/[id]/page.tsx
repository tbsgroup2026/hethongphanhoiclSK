"use client";

import { useState, useEffect, useCallback, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  AlertTriangle,
  Clock,
  CheckCircle2,
  XCircle,
  Sparkles,
  Layers,
  Wrench,
  Send,
  UploadCloud,
  X,
  RefreshCw,
  MessageSquare,
  ShieldAlert,
  UserCheck,
  Building2,
  FileCheck,
  RotateCcw,
  Check,
  AlertOctagon,
  Image as ImageIcon,
  Camera,
  Edit2,
} from "lucide-react";
import { useSession } from "next-auth/react";
import {
  QualityIssue,
  IssueStatus,
  Severity,
  PartCategory,
  UserPublic,
  ChatTurn,
  ChatConclusion,
  portalApi,
  STATUS_META,
  SEVERITY_META,
  ROLE_LABELS,
  ROLE_BADGE_COLORS,
} from "@/lib/portal-client";

// Image compression helper
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

// Format stopwatch HH:MM:SS
function formatElapsed(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

export default function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: session } = useSession();

  const [issue, setIssue] = useState<QualityIssue | null>(null);
  const [currentUser, setCurrentUser] = useState<UserPublic | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // Sync mobile token cookie for NextAuth web sessions
  useEffect(() => {
    fetch("/api/portal/token").catch(() => {});
  }, []);

  const sessionUser = session?.user as unknown as {
    id: string;
    name: string;
    employeeCode: string;
    role: UserPublic["role"];
  } | undefined;

  const effectiveUser: UserPublic | null = currentUser || (sessionUser ? {
    id: sessionUser.id,
    employeeCode: sessionUser.employeeCode,
    name: sessionUser.name,
    role: sessionUser.role,
  } : null);

  // 15-minute countdown state
  const [timeLeftMs, setTimeLeftMs] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      const [meRes, issueData] = await Promise.all([
        portalApi.getMe().catch(() => null),
        portalApi.getIssue(id),
      ]);
      if (meRes?.user) setCurrentUser(meRes.user);
      setIssue(issueData);

      if (issueData.investigationDeadline && !issueData.investigationLocked) {
        const deadline = new Date(issueData.investigationDeadline).getTime();
        const diff = deadline - Date.now();
        setTimeLeftMs(Math.max(0, diff));
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadDataSilently = useCallback(async () => {
    try {
      const issueData = await portalApi.getIssue(id);
      setIssue(issueData);
      if (issueData.investigationDeadline && !issueData.investigationLocked) {
        const deadline = new Date(issueData.investigationDeadline).getTime();
        const diff = deadline - Date.now();
        setTimeLeftMs(Math.max(0, diff));
      }
    } catch {
      // ignore
    }
  }, [id]);

  useEffect(() => {
    loadData();
    // Real-time live sync for 8-step action center
    const timer = setInterval(() => {
      loadDataSilently();
    }, 10000);
    return () => clearInterval(timer);
  }, [loadData, loadDataSilently]);


  // 1-second interval for 15-min countdown
  useEffect(() => {
    if (timeLeftMs === null || timeLeftMs <= 0) return;
    const interval = setInterval(() => {
      setTimeLeftMs((prev) => (prev !== null && prev > 1000 ? prev - 1000 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeftMs]);

  if (loading || !issue) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-slate-400">
        <RefreshCw size={32} className="animate-spin text-emerald-800" />
        <p className="mt-3 text-sm font-medium">Đang tải thông tin sự cố...</p>
      </div>
    );
  }

  const role = effectiveUser?.role;
  const isInvestigator =
    role === "QA" ||
    role === "LINE_LEADER" ||
    role === "TECHNOLOGY" ||
    role === "DEPARTMENT_HEAD" ||
    role === "DIRECTOR" ||
    role === "ADMIN";
  const mySubmission = issue.submissions.find((s) => s.submitterId === effectiveUser?.id);
  const deadlinePassed = issue.investigationDeadline
    ? Date.now() > new Date(issue.investigationDeadline).getTime()
    : false;

  const canSubmit5M1E =
    isInvestigator &&
    !mySubmission &&
    !issue.investigationLocked &&
    !deadlinePassed &&
    (issue.status === "REPORTED" || issue.status === "INVESTIGATING");

  const isDirectorOrAdmin = role === "DIRECTOR" || role === "ADMIN";
  const isDeptHead = role === "DEPARTMENT_HEAD";

  const canDecideRootCause =
    (role === "LINE_LEADER" || isDeptHead || isDirectorOrAdmin) &&
    (
      isDirectorOrAdmin ||
      (
        !issue.rootCause &&
        issue.status !== "ROOT_CAUSE_FOUND" &&
        issue.status !== "ASSIGNED" &&
        issue.status !== "IN_PROGRESS" &&
        issue.status !== "DONE" &&
        (issue.submissions.length >= 1 || issue.investigationLocked || deadlinePassed)
      )
    );

  const canAssign =
    (isDeptHead || isDirectorOrAdmin) &&
    (issue.status === "ROOT_CAUSE_FOUND" || issue.status === "ASSIGNED" || issue.status === "IN_PROGRESS");

  const statusMeta = STATUS_META[issue.status];
  const severityMeta = SEVERITY_META[issue.severity];
  const imageList = issue.images ? (JSON.parse(issue.images) as string[]) : [];

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 pb-4">
        <div className="flex items-center gap-2">
          <Link
            href="/portal"
            className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <ChevronLeft size={16} />
            <span>Quay lại</span>
          </Link>
          <span className="text-sm font-extrabold text-slate-900 sm:text-base">
            Phiếu Sự Cố — PO {issue.poCode}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span
            className={`rounded-xl border px-3 py-1 text-xs font-bold ${severityMeta.bg} ${severityMeta.text} ${severityMeta.border}`}
          >
            {severityMeta.badge} {severityMeta.label}
          </span>
          <span
            className={`rounded-xl border px-3 py-1 text-xs font-bold ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}
          >
            {statusMeta.icon} {statusMeta.label}
          </span>
        </div>
      </div>

      {/* 15-Minute Countdown Alert (if investigating) */}
      {timeLeftMs !== null && timeLeftMs > 0 && (issue.status === "REPORTED" || issue.status === "INVESTIGATING") && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900 shadow-xs gap-3">
          <div className="flex items-center gap-2.5">
            <Clock className="animate-pulse text-amber-700 flex-shrink-0" size={20} />
            <div>
              <p className="text-xs font-bold sm:text-sm">Thời hạn điều tra 5M+1E (15 phút)</p>
              <p className="text-[11px] text-amber-700">QA, Quản đốc, Trưởng line và Công nghệ cần nộp bản 5M+1E trước khi hết giờ</p>
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
            <div className="rounded-xl bg-amber-200/80 px-3.5 py-1.5 text-sm font-extrabold text-amber-950 font-mono">
              ⏱ {formatElapsed(timeLeftMs)}
            </div>
            {canSubmit5M1E && (
              <a
                href="#section-5m1e"
                className="rounded-xl bg-emerald-800 px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-emerald-900 transition-all flex items-center gap-1.5"
              >
                <Sparkles size={14} className="text-lime-300" />
                <span>Nộp 5M+1E Ngay</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* Ticket Overview Card */}
      <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">
                {issue.area?.name || "Xưởng A"}
              </span>
              <span>›</span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">
                {issue.productionLine?.name || "Chuyền 1"}
              </span>
              <span>›</span>
              <span className="rounded-md bg-slate-100 px-2 py-0.5 text-slate-700">
                {issue.team?.name || "Tổ 1"}
              </span>
              <span>·</span>
              <span>Báo lúc: {new Date(issue.createdAt).toLocaleString("vi-VN")}</span>
            </div>

            <h2 className="text-base font-bold text-slate-900 sm:text-lg">
              {issue.failureCategory ? issue.failureCategory.name : issue.otherFailureNote ? `Lỗi khác: ${issue.otherFailureNote}` : "Sự cố chất lượng"}
            </h2>

            <p className="text-sm leading-relaxed text-slate-700">
              {issue.description}
            </p>
          </div>

          {/* Reporter info */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4 text-xs lg:w-72">
            <p className="font-bold text-slate-800">Người báo cáo</p>
            <p className="mt-1 font-semibold text-slate-900">{issue.reporter?.name || "N/A"}</p>
            <p className="text-[11px] text-slate-500">Mã NV: {issue.reporter?.employeeCode}</p>
            <p className="text-[11px] text-slate-500">Vai trò: {issue.reporter?.role ? ROLE_LABELS[issue.reporter.role] : "Vận hành"}</p>
          </div>
        </div>

        {/* Attached Photos */}
        {imageList.length > 0 && (
          <div className="mt-5 border-t border-slate-100 pt-4">
            <p className="mb-2 flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <ImageIcon size={15} />
              <span>Ảnh hiện trường sự cố ({imageList.length})</span>
            </p>
            <div className="flex flex-wrap gap-3">
              {imageList.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setLightboxImage(img)}
                  className="group relative h-24 w-24 overflow-hidden rounded-2xl border border-slate-200 transition-all hover:scale-105"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt="Evidence" className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="text-[10px] font-bold text-white">Xem</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* STEP 2: 5M+1E INVESTIGATION ACTION CENTER */}
      {canSubmit5M1E && (
        <div id="section-5m1e">
          <FiveMOneEInvestigationSection issue={issue} onDone={loadData} />
        </div>
      )}

      {/* STEP 2 RESULTS: 3-IN-1 SUBMISSIONS COMPARISON BOARD */}
      {issue.submissions.length > 0 && (
        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="text-emerald-800" size={20} />
              <h3 className="text-base font-bold text-slate-900">
                Bản đối chiếu điều tra ({issue.submissions.length}/3)
              </h3>
            </div>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">
              {issue.submissions.length >= 3 ? "Đủ 3/3 bản" : `Đã có ${issue.submissions.length}/3`}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {issue.submissions.map((sub) => {
              const roleBadge = ROLE_BADGE_COLORS[sub.submitterRole];
              return (
                <div
                  key={sub.id}
                  className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-slate-50/70 p-4.5"
                >
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                      <span className={`rounded-md border px-2 py-0.5 text-xs font-bold ${roleBadge.bg} ${roleBadge.text} ${roleBadge.border}`}>
                        {ROLE_LABELS[sub.submitterRole]}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {new Date(sub.submittedAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>

                    <p className="mt-2 text-xs font-bold text-slate-800">
                      Người điền: {sub.submitter?.name || "N/A"}
                    </p>

                    {/* Highlighted Root Cause Box */}
                    {sub.rootCause && (
                      <div className="mt-3 rounded-xl border border-indigo-200 bg-indigo-50/80 p-3 text-xs text-indigo-950">
                        <p className="font-bold text-indigo-800">🧩 Kết luận nguyên nhân gốc:</p>
                        <p className="mt-1 leading-snug">{sub.rootCause}</p>
                      </div>
                    )}

                    {/* 6 5M+1E items */}
                    <div className="mt-3 space-y-2 text-xs">
                      <Item5M1E label="Man (Con người)" value={sub.man} />
                      <Item5M1E label="Machine (Máy móc)" value={sub.machine} />
                      <Item5M1E label="Material (Nguyên liệu)" value={sub.material} />
                      <Item5M1E label="Method (Phương pháp)" value={sub.method} />
                      <Item5M1E label="Measurement (Đo lường)" value={sub.measurement} />
                      <Item5M1E label="Environment (Môi trường)" value={sub.environment} />
                    </div>

                    {/* Investigation Evidence Photos */}
                    {sub.images && (() => {
                      try {
                        const parsed = typeof sub.images === "string" ? JSON.parse(sub.images) : sub.images;
                        if (Array.isArray(parsed) && parsed.length > 0) {
                          return (
                            <div className="mt-3 border-t border-slate-200/80 pt-2.5">
                              <p className="text-[10px] font-bold text-slate-500 mb-1.5 flex items-center gap-1">
                                <Camera size={11} className="text-[#005A36]" />
                                <span>Ảnh hiện trường điều tra ({parsed.length})</span>
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {parsed.map((img: string, i: number) => (
                                  <button
                                    key={i}
                                    type="button"
                                    onClick={() => setLightboxImage(img)}
                                    className="h-12 w-12 rounded-lg border border-slate-200 overflow-hidden hover:opacity-80 transition-opacity"
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={img} alt="Evidence" className="h-full w-full object-cover" />
                                  </button>
                                ))}
                              </div>
                            </div>
                          );
                        }
                      } catch {}
                      return null;
                    })()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STEP 3: ROOT CAUSE SYNTHESIS & SOLUTIONS (LINE LEADER) */}
      {canDecideRootCause && (
        <RootCauseSynthesisSection issue={issue} onDone={loadData} />
      )}

      {/* Root Cause & Proposed Solution Summary Display (If finalized) */}
      {issue.rootCause && (
        <RootCauseSummaryCard
          issue={issue}
          currentUser={effectiveUser}
          onDone={loadData}
        />
      )}

      {/* STEP 4: ASSIGN MAINTENANCE (DEPARTMENT HEAD / DIRECTOR) */}
      {canAssign && (
        <div id="section-assign">
          <AssignMaintenanceSection issue={issue} onDone={loadData} />
        </div>
      )}

      {/* STEP 5, 6, 7: MAINTENANCE TASK TICKET & EXECUTION */}
      {issue.task && (
        <MaintenanceTaskSection
          issue={issue}
          currentUser={effectiveUser}
          onDone={loadData}
        />
      )}

      {/* AUDIT TRAIL — NHẬT KÝ KIỂM TOÁN TOÀN DIỆN */}
      <AuditTrailSection issueId={issue.id} />

      {/* Image Lightbox Modal */}
      {lightboxImage && (

        <div
          onClick={() => setLightboxImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
        >
          <div className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={lightboxImage} alt="Fullscreen" className="max-h-[85vh] w-auto object-contain" />
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white hover:bg-black"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Item5M1E({ label, value }: { label: string; value: string }) {
  return (
    <div className="border-t border-slate-100 pt-1.5">
      <span className="font-semibold text-slate-500">{label}:</span>{" "}
      <span className="text-slate-800">{value || "-"}</span>
    </div>
  );
}

// -------------------------------------------------------------
// COMPONENT: STEP 2 - 5M+1E INVESTIGATION (AI 5 WHYS & FORM)
// -------------------------------------------------------------
function FiveMOneEInvestigationSection({
  issue,
  onDone,
}: {
  issue: QualityIssue;
  onDone: () => Promise<void>;
}) {
  const [activeTab, setActiveTab] = useState<"AI_CHAT" | "FORM">("AI_CHAT");
  const [poCode, setPoCode] = useState(issue.poCode);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Photos state (Bắt buộc trước khi chat 5 Whys)
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // Form fields
  const [man, setMan] = useState("");
  const [machine, setMachine] = useState("");
  const [material, setMaterial] = useState("");
  const [method, setMethod] = useState("");
  const [measurement, setMeasurement] = useState("");
  const [environment, setEnvironment] = useState("");
  const [rootCause, setRootCause] = useState("");

  // AI Chat state
  const [chatStarted, setChatStarted] = useState(false);
  const [messages, setMessages] = useState<ChatTurn[]>([]);
  const [userInput, setUserInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [conclusion, setConclusion] = useState<ChatConclusion | null>(null);

  async function handleInvestigationImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingImage(true);
    setImageError(null);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const base64 = await compressImageFile(file);
        const uploadRes = await portalApi.uploadImage(base64, "image/jpeg");
        setImages((prev) => [...prev, uploadRes.url]);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Không thể tải ảnh lên. Vui lòng thử lại.";
      setImageError(msg);
    } finally {
      setUploadingImage(false);
      e.target.value = "";
    }
  }

  async function handleSendAiChat(history: ChatTurn[]) {
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await portalApi.investigateChat(issue.id, history);
      if (res.type === "question") {
        setMessages([...history, { role: "model", text: res.text }]);
      } else {
        // Conclusion reached
        setMessages([
          ...history,
          { role: "model", text: `Đã xác định nguyên nhân gốc rễ: ${res.rootCause}` },
        ]);
        setConclusion(res);
        setRootCause(res.rootCause);
        setMan(res.man);
        setMachine(res.machine);
        setMaterial(res.material);
        setMethod(res.method);
        setMeasurement(res.measurement);
        setEnvironment(res.environment);
        setActiveTab("FORM");
      }
    } catch (err: unknown) {
      setAiError(err instanceof Error ? err.message : "Không thể kết nối AI");
    } finally {
      setAiLoading(false);
    }
  }

  async function startAiChat() {
    if (images.length === 0) {
      setImageError("⚠️ Bắt buộc phải chụp hoặc tải lên ít nhất 1 ảnh hiện trường trước khi bắt đầu 5 Whys.");
      return;
    }
    setChatStarted(true);
    await handleSendAiChat([]);
  }

  async function handleUserSend() {
    if (!userInput.trim() || aiLoading) return;
    const history: ChatTurn[] = [...messages, { role: "user", text: userInput.trim() }];
    setMessages(history);
    setUserInput("");
    await handleSendAiChat(history);
  }

  async function handleSubmitForm(e: React.FormEvent) {
    e.preventDefault();
    if (images.length === 0) {
      setSubmitError("⚠️ Bắt buộc phải chụp/tải lên ít nhất 1 ảnh hiện trường trước khi nộp bản 5M+1E.");
      return;
    }
    if (!rootCause.trim() || !man.trim() || !machine.trim() || !material.trim() || !method.trim() || !measurement.trim() || !environment.trim()) {
      setSubmitError("Vui lòng điền đầy đủ cả 6 mục 5M+1E và Nguyên nhân gốc rễ.");
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    try {
      await portalApi.submit5M1E(issue.id, {
        poCode: poCode.trim() || issue.poCode,
        images: images.length > 0 ? images : undefined,
        man: man.trim(),
        machine: machine.trim(),
        material: material.trim(),
        method: method.trim(),
        measurement: measurement.trim(),
        environment: environment.trim(),
        rootCause: rootCause.trim(),
      });
      await onDone();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Không thể nộp biểu mẫu");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-3xl border border-emerald-500/40 bg-white p-6 shadow-md">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800">
            <Sparkles size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Điều Tra Nguyên Nhân Gốc Rễ 5M+1E
            </h3>
            <p className="text-xs text-slate-500">
              Chụp ảnh hiện trường tại chuyền, sau đó chat 5 Whys AI hoặc điền biểu mẫu trực tiếp
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-bold">
          <button
            onClick={() => setActiveTab("AI_CHAT")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
              activeTab === "AI_CHAT" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <MessageSquare size={14} />
            <span>Chat 5 Whys AI</span>
          </button>
          <button
            onClick={() => setActiveTab("FORM")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-all ${
              activeTab === "FORM" ? "bg-white text-emerald-800 shadow-xs" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <FileCheck size={14} />
            <span>Biểu Mẫu 5M+1E</span>
          </button>
        </div>
      </div>

      {/* TAB 1: AI 5 WHYS CHAT */}
      {activeTab === "AI_CHAT" && (
        <div className="mt-5 space-y-4">
          {!chatStarted ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-emerald-300 bg-emerald-50/50 p-6 sm:p-8 text-center space-y-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-800 shadow-xs">
                <Sparkles size={24} />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-900">
                  Bắt Đầu Điều Tra Nguyên Nhân Với AI 5 Whys
                </h4>
                <p className="mt-1 max-w-md text-xs text-slate-600">
                  AI sẽ lần lượt hỏi các câu hỏi &quot;Tại sao&quot; để đào sâu vào vấn đề và tự động phân loại kết quả vào 6 yếu tố 5M+1E.
                </p>
              </div>

              {/* Mandatory Photo Upload Box */}
              <div className="w-full max-w-lg rounded-2xl border border-amber-200 bg-amber-50/80 p-4 text-left shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Camera size={16} className="text-amber-800" />
                    <span>Ảnh chụp hiện trường sự cố tại chuyền <span className="text-rose-600 font-extrabold">* (Bắt buộc)</span></span>
                  </span>
                  {images.length > 0 ? (
                    <span className="text-[10.5px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                      ✓ Đã có {images.length} ảnh
                    </span>
                  ) : (
                    <span className="text-[10.5px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
                      Chưa có ảnh
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Quy định điều tra: QA, Công nghệ và Trưởng line <strong>bắt buộc phải chụp/tải lên ít nhất 1 ảnh hiện trường</strong> tại chuyền trước khi mở khóa chat trả lời 5 Whys.
                </p>

                {/* Upload & Thumbnail Strip */}
                <div className="flex items-center gap-2.5 flex-wrap pt-1">
                  <label className="flex flex-col items-center justify-center h-16 w-20 rounded-xl border-2 border-dashed border-amber-400 bg-white hover:bg-amber-100/50 hover:border-amber-600 transition-colors cursor-pointer text-center p-1 flex-shrink-0 shadow-2xs">
                    {uploadingImage ? (
                      <RefreshCw size={15} className="animate-spin text-amber-800" />
                    ) : (
                      <>
                        <Camera size={18} className="text-amber-800" />
                        <span className="text-[9.5px] font-bold text-amber-900 mt-1">Chụp / Tải ảnh</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleInvestigationImageUpload}
                      disabled={uploadingImage}
                      className="hidden"
                    />
                  </label>

                  {images.map((imgUrl, idx) => (
                    <div key={idx} className="relative h-16 w-16 rounded-xl border border-slate-200 overflow-hidden group flex-shrink-0 shadow-2xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={imgUrl} alt={`Ảnh ${idx + 1}`} className="h-full w-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 h-4 w-4 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
                      >
                        <X size={9} />
                      </button>
                    </div>
                  ))}
                </div>

                {imageError && (
                  <p className="text-xs text-rose-600 font-semibold">{imageError}</p>
                )}
              </div>

              {/* Start 5 Whys Button */}
              <button
                onClick={startAiChat}
                disabled={images.length === 0 || uploadingImage}
                className={`flex items-center gap-2 rounded-2xl px-6 py-3 text-xs font-bold text-white shadow-md transition-all uppercase tracking-wide ${
                  images.length > 0
                    ? "bg-emerald-800 hover:bg-emerald-900 cursor-pointer active:scale-98"
                    : "bg-slate-400 cursor-not-allowed opacity-60"
                }`}
              >
                <Sparkles size={15} />
                <span>
                  {images.length > 0
                    ? "Bắt Đầu Hội Thoại 5 Whys"
                    : "Chụp / Tải Ảnh Để Bắt Đầu 5 Whys"}
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Photo reference strip inside chat */}
              {images.length > 0 && (
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-3.5 py-2">
                  <div className="flex items-center gap-2">
                    <Camera size={14} className="text-[#005A36]" />
                    <span className="text-[11px] font-bold text-slate-700">
                      Ảnh hiện trường đang điều tra ({images.length}):
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {images.map((img, i) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={i}
                        src={img}
                        alt="Preview"
                        className="h-8 w-8 rounded-lg object-cover border border-slate-200"
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Stream */}
              <div className="max-h-80 space-y-3 overflow-y-auto rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                {messages.map((msg, i) => (
                  <div
                    key={i}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                        msg.role === "user"
                          ? "bg-emerald-800 text-white shadow-xs"
                          : "border border-slate-200 bg-white text-slate-800 shadow-xs"
                      }`}
                    >
                      <p className="font-bold text-[10px] opacity-70 mb-0.5">
                        {msg.role === "user" ? "Bạn" : "AI Trợ Lý 5 Whys"}
                      </p>
                      {msg.text}
                    </div>
                  </div>
                ))}

                {aiLoading && (
                  <div className="flex justify-start">
                    <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-500">
                      <RefreshCw size={13} className="animate-spin text-emerald-700" />
                      <span>AI đang suy nghĩ và đặt câu hỏi đào sâu...</span>
                    </div>
                  </div>
                )}
              </div>

              {aiError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
                  {aiError}
                </div>
              )}

              {/* Chat input */}
              {!conclusion && (
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleUserSend();
                  }}
                  className="flex gap-2"
                >
                  <input
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder="Nhập câu trả lời giải thích lý do..."
                    className="flex-1 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
                    disabled={aiLoading}
                  />
                  <button
                    type="submit"
                    disabled={aiLoading || !userInput.trim()}
                    className="flex items-center gap-1.5 rounded-xl bg-emerald-800 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-900 disabled:opacity-60"
                  >
                    <Send size={14} />
                    <span>Gửi</span>
                  </button>
                </form>
              )}

              {conclusion && (
                <div className="rounded-2xl border border-emerald-300 bg-emerald-50 p-4 text-xs text-emerald-950">
                  <p className="font-bold">🎉 AI đã chốt phân tích 5 Whys và tự động điền vào Biểu Mẫu 5M+1E!</p>
                  <p className="mt-1 text-slate-600">Vui lòng chuyển qua tab &quot;Biểu Mẫu 5M+1E&quot; để kiểm tra lại và nộp chính thức.</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: 5M+1E MANUAL/REVIEW FORM */}
      {activeTab === "FORM" && (
        <form onSubmit={handleSubmitForm} className="mt-5 space-y-4">
          {/* Photo Section in Form Tab */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Camera size={15} className="text-[#005A36]" />
                <span>Ảnh chụp hiện trường sự cố <span className="text-rose-600 font-extrabold">* (Bắt buộc)</span></span>
              </label>
              <span className="text-[11px] font-bold text-slate-500">
                {images.length} ảnh
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap pt-1">
              <label className="flex flex-col items-center justify-center h-16 w-20 rounded-xl border-2 border-dashed border-emerald-300 bg-white hover:bg-emerald-50 hover:border-emerald-600 transition-colors cursor-pointer text-center p-1 flex-shrink-0">
                {uploadingImage ? (
                  <RefreshCw size={14} className="animate-spin text-[#005A36]" />
                ) : (
                  <>
                    <Camera size={18} className="text-[#005A36]" />
                    <span className="text-[9.5px] font-bold text-[#005A36] mt-1">Thêm ảnh</span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleInvestigationImageUpload}
                  disabled={uploadingImage}
                  className="hidden"
                />
              </label>

              {images.map((imgUrl, idx) => (
                <div key={idx} className="relative h-16 w-16 rounded-xl border border-slate-200 overflow-hidden group flex-shrink-0 shadow-2xs">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imgUrl} alt={`Ảnh ${idx + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                    className="absolute top-1 right-1 h-4 w-4 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
                  >
                    <X size={8} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/60 p-4">
            <label className="block text-xs font-bold text-indigo-950">
              🧩 Kết luận Nguyên nhân gốc rễ (Root Cause) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              placeholder="Kết luận nguyên nhân gốc rễ theo góc nhìn chuyên môn của bạn..."
              className="mt-1.5 w-full rounded-xl border border-indigo-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <FieldInput label="Man (Con người)" value={man} onChange={setMan} placeholder="Thao tác, đào tạo, kỹ năng..." />
            <FieldInput label="Machine (Máy móc)" value={machine} onChange={setMachine} placeholder="Thiết bị, hao mòn, sai lệch..." />
            <FieldInput label="Material (Nguyên liệu)" value={material} onChange={setMaterial} placeholder="Chất lượng vật tư, nhà cung cấp..." />
            <FieldInput label="Method (Phương pháp)" value={method} onChange={setMethod} placeholder="Quy trình chuẩn, hướng dẫn kỹ thuật..." />
            <FieldInput label="Measurement (Đo lường)" value={measurement} onChange={setMeasurement} placeholder="Dụng cụ đo, sai số kiểm tra..." />
            <FieldInput label="Environment (Môi trường)" value={environment} onChange={setEnvironment} placeholder="Nhiệt độ, ánh sáng, độ ẩm..." />
          </div>

          {submitError && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
              {submitError}
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 rounded-xl bg-emerald-800 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-900 disabled:opacity-60"
            >
              {submitting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Đang nộp bản điều tra...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  <span>Xác Nhận & Gửi Bản 5M+1E</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function FieldInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold text-slate-700">{label} *</label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
        required
      />
    </div>
  );
}

// -------------------------------------------------------------
// COMPONENT: STEP 3 - ROOT CAUSE SYNTHESIS & SOS (LINE LEADER)
// -------------------------------------------------------------
function RootCauseSynthesisSection({
  issue,
  onDone,
}: {
  issue: QualityIssue;
  onDone: () => Promise<void>;
}) {
  const [synthesizing, setSynthesizing] = useState(false);
  const [synthesizeError, setSynthesizeError] = useState<string | null>(null);

  const [rootCause, setRootCause] = useState("");
  const [solution, setSolution] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // SOS state
  const [sosReason, setSosReason] = useState<string | null>(null);
  const [sosSending, setSosSending] = useState(false);
  const [sosSent, setSosSent] = useState(false);

  async function handleAiSynthesize() {
    setSynthesizing(true);
    setSynthesizeError(null);
    setSosReason(null);
    try {
      const res = await portalApi.synthesizeRootCause(issue.id);
      setRootCause(res.rootCause);
      setSolution(res.solution);
      if (res.outOfScope) {
        setSosReason(res.sosReason || "Sự cố vượt ngoài thẩm quyền xử lý tại xưởng / line.");
      }
    } catch (err: unknown) {
      setSynthesizeError(err instanceof Error ? err.message : "Lỗi khi tổng hợp AI");
    } finally {
      setSynthesizing(false);
    }
  }

  async function handleSendSos() {
    setSosSending(true);
    try {
      await portalApi.sendSos(issue.id, sosReason || "");
      setSosSent(true);
    } catch {
      // ignore
    } finally {
      setSosSending(false);
    }
  }

  async function handleSubmitRootCause(e: React.FormEvent) {
    e.preventDefault();
    if (!rootCause.trim()) {
      setSubmitError("Vui lòng điền Nguyên nhân gốc rễ.");
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    try {
      await portalApi.decideRootCause(issue.id, {
        rootCause: rootCause.trim(),
        solution: solution.trim() || undefined,
      });
      await onDone();
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Lỗi khi chốt nguyên nhân");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-3xl border border-amber-400 bg-white p-6 shadow-md">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-amber-100 text-amber-900">
            <CheckCircle2 size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Tổng Hợp Nguyên Nhân &amp; Gợi Ý Giải Pháp
            </h3>
            <p className="text-xs text-slate-500">
              Dựa vào các bản điều tra trên, chốt nguyên nhân gốc chính thức và đề xuất giải pháp xử lý
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleAiSynthesize}
          disabled={synthesizing}
          className="flex items-center gap-1.5 rounded-xl border border-emerald-600/30 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 hover:bg-emerald-100 disabled:opacity-60"
        >
          {synthesizing ? <RefreshCw size={14} className="animate-spin" /> : <Sparkles size={14} />}
          <span>{synthesizing ? "AI đang đọc các bản..." : "🤖 AI Tổng Hợp"}</span>
        </button>
      </div>

      {synthesizeError && (
        <div className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {synthesizeError}
        </div>
      )}

      {/* SOS Escalation Box if detected */}
      {sosReason && (
        <div className="mt-4 rounded-2xl border border-rose-400 bg-rose-50 p-4 text-xs text-rose-950">
          <div className="flex items-center gap-2 font-bold text-rose-800">
            <AlertOctagon size={18} />
            <span>AI Đánh Giá: Sự Cố Vượt Ngoài Khả Năng Xử Lý Tại Line</span>
          </div>
          <p className="mt-1 text-slate-700 leading-relaxed">{sosReason}</p>

          <div className="mt-3">
            {sosSent ? (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                <Check size={16} /> Đã gửi cảnh báo SOS cho Giám đốc
              </span>
            ) : (
              <button
                type="button"
                onClick={handleSendSos}
                disabled={sosSending}
                className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-60"
              >
                <ShieldAlert size={14} />
                <span>{sosSending ? "Đang gửi SOS..." : "🆘 Gửi Thông Báo SOS Cho Giám Đốc"}</span>
              </button>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmitRootCause} className="mt-5 space-y-4">
        <div>
          <label className="mb-1 block text-xs font-bold text-slate-700">
            Nguyên nhân gốc rễ chính thức <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={2}
            value={rootCause}
            onChange={(e) => setRootCause(e.target.value)}
            placeholder="Nhập nguyên nhân gốc rễ sau khi đã tổng hợp và xem xét..."
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
            required
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold text-slate-700">
            Giải pháp đề xuất xử lý
          </label>
          <textarea
            rows={2}
            value={solution}
            onChange={(e) => setSolution(e.target.value)}
            placeholder="Đề xuất các bước khắc phục xử lý..."
            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
          />
        </div>

        {submitError && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
            {submitError}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-2 rounded-xl bg-emerald-800 px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-emerald-900 disabled:opacity-60"
          >
            {submitting ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                <span>Đang lưu...</span>
              </>
            ) : (
              <>
                <CheckCircle2 size={16} />
                <span>Chốt Nguyên Nhân &amp; Giải Pháp</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// -------------------------------------------------------------
// COMPONENT: STEP 3.5 - ROOT CAUSE SUMMARY CARD (WITH DIRECTOR OVERRIDE)
// -------------------------------------------------------------
function RootCauseSummaryCard({
  issue,
  currentUser,
  onDone,
}: {
  issue: QualityIssue;
  currentUser: UserPublic | null;
  onDone: () => Promise<void>;
}) {
  const isDirectorOrAdmin = currentUser?.role === "DIRECTOR" || currentUser?.role === "ADMIN";
  const isDeptHead = currentUser?.role === "DEPARTMENT_HEAD";
  const canEdit = isDirectorOrAdmin || isDeptHead;

  const [isEditing, setIsEditing] = useState(false);
  const [rootCause, setRootCause] = useState(issue.rootCause || "");
  const [solution, setSolution] = useState(issue.solution || "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setRootCause(issue.rootCause || "");
    setSolution(issue.solution || "");
  }, [issue.rootCause, issue.solution]);

  async function handleSaveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!rootCause.trim()) {
      setError("Vui lòng nhập nguyên nhân gốc.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await portalApi.decideRootCause(issue.id, {
        rootCause: rootCause.trim(),
        solution: solution.trim() || undefined,
      });
      setIsEditing(false);
      await onDone();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi khi cập nhật nguyên nhân");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-3xl border border-emerald-600/40 bg-white p-6 shadow-md space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
        <div className="flex items-center gap-2 text-emerald-800">
          <CheckCircle2 size={20} className="text-emerald-700" />
          <h3 className="text-base font-bold text-slate-900">
            Nguyên Nhân Gốc &amp; Giải Pháp Đã Chốt
          </h3>
        </div>

        {canEdit && (
          <button
            type="button"
            onClick={() => {
              setIsEditing(!isEditing);
              setError(null);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-1.5 text-xs font-bold text-amber-900 shadow-2xs hover:bg-amber-100 transition-colors"
          >
            <Edit2 size={13} />
            <span>{isEditing ? "Đóng chỉnh sửa" : isDirectorOrAdmin ? "Sửa nguyên nhân & giải pháp (Quyền Giám Đốc)" : "Chỉnh sửa nguyên nhân"}</span>
          </button>
        )}
      </div>

      {isEditing ? (
        <form onSubmit={handleSaveEdit} className="space-y-3.5 rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-950">
              🛠️ Điều chỉnh nguyên nhân &amp; giải pháp ({currentUser?.role === "DIRECTOR" ? "Giám Đốc" : "Quản Đốc"}):
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Nguyên nhân gốc rễ <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={rootCause}
              onChange={(e) => setRootCause(e.target.value)}
              placeholder="Nhập nguyên nhân gốc rễ..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#005A36] focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Giải pháp đề xuất xử lý
            </label>
            <textarea
              rows={2}
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              placeholder="Nhập giải pháp xử lý..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-xs text-slate-900 focus:border-[#005A36] focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-xs font-semibold text-rose-600">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 rounded-xl bg-[#005A36] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#00472A] disabled:opacity-50"
            >
              {submitting ? <RefreshCw size={13} className="animate-spin" /> : <Check size={14} />}
              <span>Lưu &amp; Cập Nhật</span>
            </button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-900">
              🧩 Nguyên nhân gốc rễ chính thức
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-800 font-medium">{issue.rootCause}</p>
          </div>
          <div className="rounded-2xl border border-teal-200/80 bg-teal-50/60 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-teal-900">
              ✅ Giải pháp đề xuất xử lý
            </p>
            <p className="mt-2 text-sm leading-relaxed text-slate-800 font-medium">
              {issue.solution || "Không có ghi chú thêm."}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// COMPONENT: STEP 4 - ASSIGN TASK (DEPARTMENT HEAD / DIRECTOR)
// -------------------------------------------------------------
function AssignMaintenanceSection({
  issue,
  onDone,
}: {
  issue: QualityIssue;
  onDone: () => Promise<void>;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [technicians, setTechnicians] = useState<UserPublic[]>([]);
  const [selectedTech, setSelectedTech] = useState<UserPublic | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isReassign = !!issue.task;

  useEffect(() => {
    portalApi
      .searchMaintenanceInArea(searchTerm)
      .then(setTechnicians)
      .catch(() => setTechnicians([]));
  }, [searchTerm]);

  async function handleAssign() {
    if (!selectedTech) return;
    setSubmitting(true);
    setError(null);
    try {
      await portalApi.assignTask(issue.id, selectedTech.id);
      await onDone();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi khi giao việc");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-3xl border border-indigo-300 bg-white p-6 shadow-md">
      <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-100 text-indigo-800">
          <UserCheck size={22} />
        </div>
        <div>
          <h3 className="text-base font-bold text-slate-900">
            {isReassign
              ? "Phân Công Lại Nhân Sự Xử Lý"
              : "Phân Công Nhân Sự Xử Lý Sự Cố"}
          </h3>
          <p className="text-xs text-slate-500">
            {isReassign
              ? `Hiện tại: ${ROLE_LABELS[issue.task?.assignee.role || "MAINTENANCE"]} ${issue.task?.assignee.name} (${issue.task?.assignee.employeeCode}). Chọn nhân sự khác để phân công lại.`
              : `Phân công cho Tổ trưởng, Trưởng Line, QA, Công nghệ hoặc Bảo trì (${issue.area?.name || "Toàn nhà máy"})`}
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <input
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Tìm theo tên, mã NV hoặc chức danh (Tổ trưởng, Trưởng Line, QA, Công nghệ, Bảo trì)..."
          className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
        />

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {technicians.map((tech) => {
            const isSelected = selectedTech?.id === tech.id;
            const roleBadge = ROLE_BADGE_COLORS[tech.role] || { bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" };
            return (
              <button
                key={tech.id}
                type="button"
                onClick={() => setSelectedTech(tech)}
                className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition-all ${
                  isSelected
                    ? "border-indigo-600 bg-indigo-50/80 shadow-xs"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-100 font-bold text-cyan-800">
                  {tech.name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 truncate">{tech.name}</span>
                    <span className="text-[10px] text-slate-400">{tech.employeeCode}</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-1">
                    <span className={`rounded-md border px-1.5 py-0.5 text-[9.5px] font-bold ${roleBadge.bg} ${roleBadge.text} ${roleBadge.border}`}>
                      {ROLE_LABELS[tech.role] || tech.role}
                    </span>
                    <span className="text-[10.5px] text-slate-400 truncate">{tech.area?.name || "Cùng xưởng"}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {error && (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">
            {error}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button
            type="button"
            disabled={!selectedTech || submitting}
            onClick={handleAssign}
            className="flex items-center gap-2 rounded-xl bg-indigo-800 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-indigo-900 disabled:opacity-50"
          >
            {submitting ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
            <span>
              {isReassign
                ? `Phân Công Lại Cho ${selectedTech ? `${ROLE_LABELS[selectedTech.role]} ${selectedTech.name}` : "..."}`
                : `Giao Việc Cho ${selectedTech ? `${ROLE_LABELS[selectedTech.role]} ${selectedTech.name}` : "..."}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// COMPONENT: STEP 5, 6, 7 - MAINTENANCE TASK & REVIEWS
// -------------------------------------------------------------
function MaintenanceTaskSection({
  issue,
  currentUser,
  onDone,
}: {
  issue: QualityIssue;
  currentUser: UserPublic | null;
  onDone: () => Promise<void>;
}) {
  const task = issue.task!;
  const isAssignee = currentUser?.id === task.assigneeId;
  const isDirectorOrAdmin = currentUser?.role === "DIRECTOR" || currentUser?.role === "ADMIN";
  const isDeptHead = currentUser?.role === "DEPARTMENT_HEAD";
  const canReassign = isDirectorOrAdmin || isDeptHead;
  const isVerifier =
    !currentUser ||
    currentUser.role === "LINE_LEADER" ||
    currentUser.role === "QA" ||
    currentUser.role === "DEPARTMENT_HEAD" ||
    currentUser.role === "DIRECTOR" ||
    currentUser.role === "ADMIN";

  // Stopwatch state for maintenance
  const [elapsedMs, setElapsedMs] = useState<number>(0);

  useEffect(() => {
    if (task.status !== "ACCEPTED" || !task.acceptedAt) return;
    const startTime = new Date(task.acceptedAt).getTime();
    const update = () => setElapsedMs(Date.now() - startTime);
    update();
    const timer = setInterval(update, 1000);
    return () => clearInterval(timer);
  }, [task.status, task.acceptedAt]);

  const assigneeRoleBadge = ROLE_BADGE_COLORS[task.assignee.role] || { bg: "bg-cyan-100", text: "text-cyan-800", border: "border-cyan-200" };

  return (
    <div className="rounded-3xl border border-cyan-400 bg-white p-6 shadow-md space-y-5">
      {/* Ticket Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-800">
            <Wrench size={22} />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Phiếu Phân Công &amp; Theo Dõi Xử Lý Sự Cố
            </h3>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <span>Người phụ trách:</span>
              <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${assigneeRoleBadge.bg} ${assigneeRoleBadge.text} ${assigneeRoleBadge.border}`}>
                {ROLE_LABELS[task.assignee.role] || task.assignee.role}
              </span>
              <span className="font-bold text-slate-800">{task.assignee.name}</span>
              <span>({task.assignee.employeeCode})</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {canReassign && (
            <button
              type="button"
              onClick={() => {
                document.getElementById("section-assign")?.scrollIntoView({ behavior: "smooth" });
              }}
              className="flex items-center gap-1.5 rounded-xl border border-indigo-200 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-900 shadow-2xs hover:bg-indigo-100 transition-colors"
            >
              <RotateCcw size={13} />
              <span>Phân công lại người khác</span>
            </button>
          )}

          {/* Live Stopwatch Badge */}
          {task.status === "ACCEPTED" && task.acceptedAt && (
            <div className="flex items-center gap-2 rounded-2xl bg-cyan-900 px-4 py-2 text-white shadow-xs">
              <Clock size={16} className="animate-spin text-cyan-300" />
              <div>
                <p className="text-[10px] text-cyan-300 font-medium">Thời gian đang xử lý</p>
                <p className="text-sm font-extrabold">{formatElapsed(elapsedMs)}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Info Summary */}
      <div className="grid grid-cols-1 gap-3 rounded-2xl bg-slate-50 p-4 text-xs sm:grid-cols-3">
        <div>
          <span className="font-semibold text-slate-500">Trạng thái:</span>{" "}
          <span className="font-bold text-cyan-800">
            {task.status === "PENDING" ? "Chờ nhận việc" : task.status === "ACCEPTED" ? "Đang xử lý" : "Đã hoàn thành"}
          </span>
        </div>
        <div>
          <span className="font-semibold text-slate-500">Người giao:</span>{" "}
          <span className="font-bold text-slate-800">{task.assignedBy.name}</span>
        </div>
        <div>
          <span className="font-semibold text-slate-500">Thời gian nhận:</span>{" "}
          <span className="text-slate-800">
            {task.acceptedAt ? new Date(task.acceptedAt).toLocaleString("vi-VN") : "Chưa nhận"}
          </span>
        </div>
      </div>

      {/* STEP 5: ACCEPT TASK (FOR ASSIGNED PERSON / ADMIN / DIRECTOR) */}
      {(isAssignee || isDirectorOrAdmin) && task.status === "PENDING" && (
        <AcceptTaskBlock taskId={task.id} onDone={onDone} />
      )}

      {/* STEP 6: COMPLETE TASK FORM (FOR ASSIGNED PERSON / ADMIN / DIRECTOR) */}
      {(isAssignee || isDirectorOrAdmin) && task.status === "ACCEPTED" && (
        <CompleteRepairForm taskId={task.id} onDone={onDone} />
      )}

      {/* COMPLETED REPAIR SUMMARY DISPLAY */}
      {task.status === "DONE" && (
        <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 text-xs space-y-3">
          <div className="flex items-center gap-1.5 font-bold text-emerald-800">
            <CheckCircle2 size={16} />
            <span>Báo cáo hoàn thành xử lý lúc {task.completedAt ? new Date(task.completedAt).toLocaleString("vi-VN") : "-"}</span>
          </div>

          <p className="text-slate-700">
            <span className="font-semibold">Nội dung thực hiện:</span> {task.repairDetail}
          </p>

          {/* Render Before/After photos if available */}
          {(() => {
            let beforeList: string[] = [];
            let afterList: string[] = [];
            try {
              if (task.imagesBefore) beforeList = JSON.parse(task.imagesBefore);
              if (task.imagesAfter) afterList = JSON.parse(task.imagesAfter);
            } catch {}

            return (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-1">
                {beforeList.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Camera size={13} className="text-amber-800" />
                      <span>Ảnh trước khi xử lý ({beforeList.length})</span>
                    </span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {beforeList.map((img, i) => (
                        <a key={i} href={img} target="_blank" rel="noreferrer" className="block h-14 w-14 rounded-lg border border-slate-200 overflow-hidden hover:opacity-90 transition-opacity">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt="Trước xử lý" className="h-full w-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {afterList.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3 space-y-1.5">
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <Camera size={13} className="text-emerald-700" />
                      <span>Ảnh sau khi xử lý ({afterList.length})</span>
                    </span>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {afterList.map((img, i) => (
                        <a key={i} href={img} target="_blank" rel="noreferrer" className="block h-14 w-14 rounded-lg border border-slate-200 overflow-hidden hover:opacity-90 transition-opacity">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={img} alt="Sau xử lý" className="h-full w-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {task.partsReplaced && (
            <div>
              <span className="font-semibold text-slate-700">Linh kiện đã thay thế:</span>
              <ul className="mt-1 list-disc pl-5 text-slate-600">
                {(JSON.parse(task.partsReplaced) as { quantity: number; note?: string }[]).map((p, i) => (
                  <li key={i}>
                    Số lượng: {p.quantity} {p.note ? `(${p.note})` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* STEP 7A: IMMEDIATE REPAIR REVIEW (LINE LEADER / REVIEWER) */}
      {isVerifier && task.status === "DONE" && !task.monitoringStartedAt && task.verifiedStatus === "PENDING" && (
        <Step7aReviewButtons taskId={task.id} onDone={onDone} />
      )}

      {/* STEP 7B: 3-48H MONITORING & CLOSE (LINE LEADER / REVIEWER) */}
      {isVerifier && task.status === "DONE" && task.monitoringStartedAt && task.verifiedStatus === "PENDING" && (
        <Step7bMonitoringWindow taskId={task.id} monitoringStartedAt={task.monitoringStartedAt} onDone={onDone} />
      )}
    </div>
  );
}

function AcceptTaskBlock({ taskId, onDone }: { taskId: string; onDone: () => Promise<void> }) {
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    setAccepting(true);
    setError(null);
    try {
      await portalApi.acceptTask(taskId);
      await onDone();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi khi nhận việc");
    } finally {
      setAccepting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs">
      <p className="font-bold text-amber-900">⚠️ Bạn được phân công phụ trách xử lý sự cố này!</p>
      <p className="mt-1 text-slate-600">Khi bấm &quot;Xác Nhận &amp; Bắt Đầu Nhận Việc&quot;, hệ thống sẽ bắt đầu đếm giờ làm việc theo thời gian thực.</p>
      {error && <p className="mt-2 text-rose-600 font-medium">{error}</p>}
      <button
        onClick={handleAccept}
        disabled={accepting}
        className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-800 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-900 disabled:opacity-60"
      >
        {accepting ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={16} />}
        <span>Xác Nhận &amp; Bắt Đầu Nhận Việc</span>
      </button>
    </div>
  );
}

function CompleteRepairForm({ taskId, onDone }: { taskId: string; onDone: () => Promise<void> }) {
  const [repairDetail, setRepairDetail] = useState("");
  const [partCategories, setPartCategories] = useState<PartCategory[]>([]);
  const [parts, setParts] = useState<{ partCategoryId: string; quantity: number; note: string }[]>([]);
  const [imagesBefore, setImagesBefore] = useState<string[]>([]);
  const [imagesAfter, setImagesAfter] = useState<string[]>([]);
  const [uploadingBefore, setUploadingBefore] = useState(false);
  const [uploadingAfter, setUploadingAfter] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  useEffect(() => {
    portalApi.listPartCategories().then(setPartCategories).catch(() => {});
  }, []);

  function addPartRow() {
    setParts((prev) => [...prev, { partCategoryId: partCategories[0]?.id || "", quantity: 1, note: "" }]);
  }

  function removePartRow(index: number) {
    setParts((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleUploadImagesBefore(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingBefore(true);
    setError(null);
    try {
      for (let i = 0; i < files.length; i++) {
        const base64 = await compressImageFile(files[i]);
        const uploadRes = await portalApi.uploadImage(base64, "image/jpeg");
        setImagesBefore((prev) => [...prev, uploadRes.url]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi khi tải ảnh trước khi sửa");
    } finally {
      setUploadingBefore(false);
      e.target.value = "";
    }
  }

  async function handleUploadImagesAfter(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingAfter(true);
    setError(null);
    try {
      for (let i = 0; i < files.length; i++) {
        const base64 = await compressImageFile(files[i]);
        const uploadRes = await portalApi.uploadImage(base64, "image/jpeg");
        setImagesAfter((prev) => [...prev, uploadRes.url]);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi khi tải ảnh sau khi sửa");
    } finally {
      setUploadingAfter(false);
      e.target.value = "";
    }
  }

  async function handleCompleteSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!repairDetail.trim()) {
      setError("Vui lòng nhập mô tả chi tiết công việc đã thực hiện.");
      return;
    }
    if (imagesBefore.length === 0) {
      setError("⚠️ Cần chụp hoặc tải lên ít nhất 1 ảnh trước khi xử lý.");
      return;
    }
    if (imagesAfter.length === 0) {
      setError("⚠️ Cần chụp hoặc tải lên ít nhất 1 ảnh sau khi xử lý.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await portalApi.completeTask(taskId, {
        repairDetail: repairDetail.trim(),
        partsReplaced: parts.filter((p) => p.partCategoryId).map((p) => ({
          partCategoryId: p.partCategoryId,
          quantity: Math.max(1, p.quantity),
          note: p.note || undefined,
        })),
        imagesBefore,
        imagesAfter,
      });
      await onDone();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi khi hoàn thành việc");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleCompleteSubmit} className="space-y-4 rounded-2xl border border-slate-200 bg-slate-50/80 p-5 text-xs">
      <h4 className="text-sm font-bold text-slate-900">Báo Cáo Hoàn Thành Xử Lý / Sửa Chữa</h4>

      <div>
        <label className="mb-1 block font-bold text-slate-700">Mô tả công việc đã thực hiện *</label>
        <textarea
          rows={3}
          value={repairDetail}
          onChange={(e) => setRepairDetail(e.target.value)}
          placeholder="Mô tả cụ thể đã khắc phục gì, thay thế linh kiện gì, cân chỉnh quy trình nào..."
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-800 focus:border-emerald-600 focus:outline-none"
          required
        />
      </div>

      {/* PHOTO GROUP 1: IMAGES BEFORE REPAIR */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="font-bold text-slate-800 flex items-center gap-1.5">
            <Camera size={16} className="text-amber-800" />
            <span>Ảnh trước khi xử lý <span className="text-rose-500 font-extrabold">* (Bắt buộc)</span></span>
          </label>
          {imagesBefore.length > 0 ? (
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
              ✓ Đã có {imagesBefore.length} ảnh
            </span>
          ) : (
            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
              Chưa có ảnh
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Button 1: Camera */}
          <label className="flex items-center gap-1.5 rounded-xl border border-emerald-600/40 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-100 cursor-pointer shadow-2xs transition-colors">
            {uploadingBefore ? <RefreshCw size={14} className="animate-spin" /> : <Camera size={14} />}
            <span>Chụp ảnh</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleUploadImagesBefore}
              disabled={uploadingBefore}
              className="hidden"
            />
          </label>

          {/* Button 2: File Upload */}
          <label className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs transition-colors">
            <ImageIcon size={14} />
            <span>Tải ảnh từ máy</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleUploadImagesBefore}
              disabled={uploadingBefore}
              className="hidden"
            />
          </label>

          {/* Thumbnails */}
          {imagesBefore.map((imgUrl, idx) => (
            <div
              key={idx}
              className="relative h-14 w-14 rounded-xl border border-slate-200 overflow-hidden group flex-shrink-0 shadow-2xs"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgUrl}
                alt={`Trước sửa ${idx + 1}`}
                onClick={() => setPreviewImage(imgUrl)}
                className="h-full w-full object-cover cursor-pointer hover:opacity-90"
              />
              <button
                type="button"
                onClick={() => setImagesBefore((prev) => prev.filter((_, i) => i !== idx))}
                className="absolute top-1 right-1 h-4 w-4 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* PHOTO GROUP 2: IMAGES AFTER REPAIR */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="font-bold text-slate-800 flex items-center gap-1.5">
            <Camera size={16} className="text-emerald-700" />
            <span>Ảnh sau khi xử lý xong <span className="text-rose-500 font-extrabold">* (Bắt buộc)</span></span>
          </label>
          {imagesAfter.length > 0 ? (
            <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
              ✓ Đã có {imagesAfter.length} ảnh
            </span>
          ) : (
            <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-md">
              Chưa có ảnh
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Button 1: Camera */}
          <label className="flex items-center gap-1.5 rounded-xl border border-emerald-600/40 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-900 hover:bg-emerald-100 cursor-pointer shadow-2xs transition-colors">
            {uploadingAfter ? <RefreshCw size={14} className="animate-spin" /> : <Camera size={14} />}
            <span>Chụp ảnh</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleUploadImagesAfter}
              disabled={uploadingAfter}
              className="hidden"
            />
          </label>

          {/* Button 2: File Upload */}
          <label className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs transition-colors">
            <ImageIcon size={14} />
            <span>Tải ảnh từ máy</span>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleUploadImagesAfter}
              disabled={uploadingAfter}
              className="hidden"
            />
          </label>

          {/* Thumbnails */}
          {imagesAfter.map((imgUrl, idx) => (
            <div
              key={idx}
              className="relative h-14 w-14 rounded-xl border border-slate-200 overflow-hidden group flex-shrink-0 shadow-2xs"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imgUrl}
                alt={`Sau sửa ${idx + 1}`}
                onClick={() => setPreviewImage(imgUrl)}
                className="h-full w-full object-cover cursor-pointer hover:opacity-90"
              />
              <button
                type="button"
                onClick={() => setImagesAfter((prev) => prev.filter((_, i) => i !== idx))}
                className="absolute top-1 right-1 h-4 w-4 rounded-full bg-slate-900/80 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Dynamic Parts Replacement */}
      <div>
        <div className="flex items-center justify-between">
          <label className="font-bold text-slate-700">Linh kiện thay thế sử dụng (nếu có)</label>
          <button
            type="button"
            onClick={addPartRow}
            className="rounded-lg bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-200"
          >
            + Thêm linh kiện
          </button>
        </div>

        <div className="mt-2 space-y-2">
          {parts.map((row, idx) => (
            <div key={idx} className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5">
              <select
                value={row.partCategoryId}
                onChange={(e) => {
                  const val = e.target.value;
                  setParts((prev) => prev.map((p, i) => (i === idx ? { ...p, partCategoryId: val } : p)));
                }}
                className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none"
              >
                {partCategories.map((pc) => (
                  <option key={pc.id} value={pc.id}>
                    {pc.name}
                  </option>
                ))}
              </select>

              <div className="flex items-center gap-1">
                <span className="text-slate-500">SL:</span>
                <input
                  type="number"
                  min="1"
                  value={row.quantity}
                  onChange={(e) => {
                    const q = parseInt(e.target.value, 10) || 1;
                    setParts((prev) => prev.map((p, i) => (i === idx ? { ...p, quantity: q } : p)));
                  }}
                  className="w-16 rounded-lg border border-slate-200 px-2 py-1.5 text-center text-xs font-bold text-slate-800"
                />
              </div>

              <input
                value={row.note}
                onChange={(e) => {
                  const n = e.target.value;
                  setParts((prev) => prev.map((p, i) => (i === idx ? { ...p, note: n } : p)));
                }}
                placeholder="Ghi chú thêm..."
                className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-800"
              />

              <button
                type="button"
                onClick={() => removePartRow(idx)}
                className="rounded-lg p-1 text-slate-400 hover:text-rose-600"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {error && <div className="rounded-xl border border-rose-200 bg-rose-50 p-2.5 text-xs text-rose-700">{error}</div>}

      <div className="flex justify-end pt-2">
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center gap-2 rounded-xl bg-emerald-800 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-900 disabled:opacity-60"
        >
          {submitting ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle2 size={16} />}
          <span>Hoàn Thành Xử Lý &amp; Báo Nghiệm Thu</span>
        </button>
      </div>

      {/* Lightbox Modal for previewing images */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs"
        >
          <div className="relative max-h-[90vh] max-w-4xl overflow-hidden rounded-2xl bg-black">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewImage} alt="Preview" className="max-h-[85vh] w-auto object-contain" />
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute right-3 top-3 rounded-full bg-black/60 p-2 text-white hover:bg-black"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}
    </form>
  );
}

// -------------------------------------------------------------
// COMPONENT: STEP 7A - IMMEDIATE REVIEW (LINE LEADER)
// -------------------------------------------------------------
function Step7aReviewButtons({ taskId, onDone }: { taskId: string; onDone: () => Promise<void> }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleReview(adequate: boolean) {
    setSubmitting(true);
    setError(null);
    try {
      await portalApi.confirmRepair(taskId, adequate);
      await onDone();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi xác nhận");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-amber-400 bg-amber-50/70 p-4 text-xs">
      <p className="font-bold text-amber-900">
        Bước 7a: Trưởng Line Xác Nhận Kết Quả Sửa Chữa Của Bảo Trì
      </p>
      <p className="mt-1 text-slate-600">
        Kiểm tra trực tiếp tại chuyền: Sự cố đã được xử lý đạt yêu cầu hay chưa?
      </p>

      {error && <p className="mt-2 text-rose-600">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={() => handleReview(true)}
          disabled={submitting}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-800 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-900 disabled:opacity-60"
        >
          <CheckCircle2 size={15} />
          <span>✅ Đạt Yêu Cầu (Bắt Đầu Theo Dõi 3-48h)</span>
        </button>

        <button
          onClick={() => handleReview(false)}
          disabled={submitting}
          className="flex items-center gap-1.5 rounded-xl border border-rose-400 bg-white px-5 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-60"
        >
          <XCircle size={15} />
          <span>❌ Chưa Đạt, Yêu Cầu Sửa Lại</span>
        </button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// COMPONENT: STEP 7B - 3-48H MONITORING & CLOSE (LINE LEADER)
// -------------------------------------------------------------
function Step7bMonitoringWindow({
  taskId,
  monitoringStartedAt,
  onDone,
}: {
  taskId: string;
  monitoringStartedAt: string;
  onDone: () => Promise<void>;
}) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startMs = new Date(monitoringStartedAt).getTime();
  const now = Date.now();
  const windowEndMs = startMs + 48 * 60 * 60 * 1000;
  const canVerify = true;

  async function handleVerify(confirmed: boolean) {
    setSubmitting(true);
    setError(null);
    try {
      await portalApi.verifyTask(taskId, confirmed);
      await onDone();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Lỗi xác nhận");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-2xl border border-cyan-400 bg-cyan-50/70 p-4 text-xs">
      <div className="flex items-center gap-2 font-bold text-cyan-950">
        <Clock size={16} />
        <span>Bước 7b: Cửa Sổ Theo Dõi Hoạt Động (3h đến 48h)</span>
      </div>
      <p className="mt-1 text-slate-700">
        Đang theo dõi vận hành sau sửa chữa (bắt đầu lúc {new Date(monitoringStartedAt).toLocaleString("vi-VN")}). Hệ thống sẽ tự động đóng sau 48h nếu không có báo cáo lỗi.
      </p>

      <div className="mt-2 rounded-xl bg-cyan-100/90 p-2.5 text-cyan-950 font-medium">
        💡 Bạn có thể kiểm tra 20 đôi ra đầu tiên. Nếu đạt yêu cầu chất lượng, bấm <strong>Đóng Vấn Đề</strong> bên dưới để hoàn tất phiếu ngay.
      </div>

      {error && <p className="mt-2 text-rose-600">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={() => handleVerify(true)}
          disabled={!canVerify || submitting}
          className="flex items-center gap-1.5 rounded-xl bg-emerald-800 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-900 disabled:opacity-50"
        >
          <CheckCircle2 size={15} />
          <span>Đóng Vấn Đề (Hoàn Thành Toàn Bộ Luồng)</span>
        </button>

        <button
          onClick={() => handleVerify(false)}
          disabled={!canVerify || submitting}
          className="flex items-center gap-1.5 rounded-xl border border-rose-400 bg-white px-5 py-2.5 text-xs font-bold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
        >
          <RotateCcw size={15} />
          <span>Kiểm Tra Lại (Tái Phát, Làm Lại 5M+1E)</span>
        </button>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// COMPONENT: AUDIT TRAIL TIMELINE (NHẬT KÝ KIỂM TOÁN)
// -------------------------------------------------------------
const AUDIT_ACTION_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  REPORTED: { label: "Báo cáo sự cố", icon: "⚠️", color: "border-amber-400 bg-amber-50 text-amber-900" },
  INVESTIGATION_SUBMITTED: { label: "Nộp bản 5M+1E", icon: "🔍", color: "border-blue-400 bg-blue-50 text-blue-900" },
  ROOT_CAUSE_DECIDED: { label: "Chốt nguyên nhân gốc", icon: "🧩", color: "border-indigo-400 bg-indigo-50 text-indigo-900" },
  SOS_SENT: { label: "Gửi cảnh báo SOS", icon: "🆘", color: "border-rose-400 bg-rose-50 text-rose-900" },
  TASK_ASSIGNED: { label: "Giao việc bảo trì", icon: "📋", color: "border-purple-400 bg-purple-50 text-purple-900" },
  TASK_ACCEPTED: { label: "Bảo trì nhận việc", icon: "⏱️", color: "border-cyan-400 bg-cyan-50 text-cyan-900" },
  REPAIR_COMPLETED: { label: "Hoàn thành sửa chữa", icon: "🔧", color: "border-emerald-400 bg-emerald-50 text-emerald-900" },
  REPAIR_CONFIRMED: { label: "Xác nhận sửa chữa (7a)", icon: "✅", color: "border-teal-400 bg-teal-50 text-teal-900" },
  ISSUE_CLOSED: { label: "Đóng vấn đề thành công (7b)", icon: "🎉", color: "border-emerald-500 bg-emerald-100 text-emerald-950" },
  ISSUE_REOPENED: { label: "Yêu cầu kiểm tra lại", icon: "🔄", color: "border-rose-400 bg-rose-50 text-rose-900" },
};

function AuditTrailSection({ issueId }: { issueId: string }) {
  const [logs, setLogs] = useState<import("@/lib/portal-client").AuditLogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    portalApi
      .getAuditLogs(issueId)
      .then((data) => setLogs(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [issueId]);

  return (
    <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <FileCheck className="text-emerald-800" size={20} />
          <h3 className="text-base font-bold text-slate-900">
            Nhật Ký Kiểm Toán Toàn Diện (Audit Trail)
          </h3>
          <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-600">
            {logs.length} sự kiện
          </span>
        </div>
        <span className="text-xs font-bold text-emerald-800 hover:underline">
          {expanded ? "Thu gọn ▲" : "Mở rộng ▼"}
        </span>
      </button>

      {expanded && (
        <div className="mt-5 border-t border-slate-100 pt-4">
          {loading ? (
            <div className="flex items-center gap-2 py-4 text-xs text-slate-400">
              <RefreshCw size={14} className="animate-spin text-emerald-700" />
              <span>Đang tải nhật ký kiểm toán...</span>
            </div>
          ) : logs.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-400">
              Chưa có nhật ký nào được ghi nhận cho sự cố này.
            </p>
          ) : (
            <div className="relative space-y-4 border-l-2 border-slate-200 pl-4">
              {logs.map((log) => {
                const meta = AUDIT_ACTION_LABELS[log.action] || {
                  label: log.action,
                  icon: "📌",
                  color: "border-slate-300 bg-slate-50 text-slate-800",
                };
                return (
                  <div key={log.id} className="relative group">
                    <div className="absolute -left-[23px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-800 text-[9px] text-white shadow-xs">
                      •
                    </div>
                    <div className="rounded-2xl border border-slate-200/90 bg-slate-50/70 p-3.5 text-xs transition-all hover:bg-slate-100/80">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 pb-2">
                        <div className="flex items-center gap-1.5">
                          <span className={`rounded-md border px-2 py-0.5 font-bold ${meta.color}`}>
                            {meta.icon} {meta.label}
                          </span>
                          {log.user && (
                            <span className="font-semibold text-slate-800">
                              bởi {log.user.name} ({log.user.employeeCode})
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-500">
                          {new Date(log.createdAt).toLocaleString("vi-VN")}
                        </span>
                      </div>
                      {log.note && (
                        <p className="mt-2 leading-relaxed text-slate-700">{log.note}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

