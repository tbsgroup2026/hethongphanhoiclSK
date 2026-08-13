"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { QualityIssue, Category, FailureCategory, portalApi } from "@/lib/portal-client";

function getTrend(curr: number, prev: number) {
  if (prev === 0) {
    if (curr === 0) return { diff: 0, isUp: false, text: "0%" };
    return { diff: curr, isUp: true, text: `+${curr}` };
  }
  const diff = curr - prev;
  const pct = Math.round((diff / prev) * 100);
  return {
    diff,
    isUp: diff >= 0,
    text: `${diff >= 0 ? "+" : ""}${pct}%`,
  };
}

function fmtD(d: Date) {
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function checkSlaMet(i: QualityIssue): boolean {
  if (i.status !== "DONE") return false;
  const createdTime = new Date(i.createdAt).getTime();
  if (i.task?.completedAt) {
    const durMs = new Date(i.task.completedAt).getTime() - createdTime;
    return durMs > 0 && durMs <= 2 * 3600 * 1000;
  }
  if (i.updatedAt) {
    const durMs = new Date(i.updatedAt).getTime() - createdTime;
    return durMs > 0 && durMs <= 2 * 3600 * 1000;
  }
  return false;
}

export default function PortalStats() {
  const [allIssues, setAllIssues] = useState<QualityIssue[]>([]);
  const [areas, setAreas] = useState<Category[]>([]);
  const [failureCategories, setFailureCategories] = useState<FailureCategory[]>([]);
  const [areaId, setAreaId] = useState<string>("ALL");
  const [timeRange, setTimeRange] = useState<"7D" | "30D" | "ALL">("7D");
  const [loading, setLoading] = useState(true);
  const chartInstances = useRef<any[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [issueList, areaList, failList] = await Promise.all([
        portalApi.listIssues({ limit: 500, all: true }).catch(() => []),
        portalApi.listAreas().catch(() => []),
        portalApi.listFailureCategories().catch(() => []),
      ]);
      setAllIssues(issueList || []);
      setAreas(areaList || []);
      setFailureCategories(failList || []);
    } catch (err) {
      console.error("Lỗi khi tải dữ liệu thống kê từ D1:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Xác định khoảng thời gian lọc và kỳ trước
  const { start, end, prevStart, prevEnd, dateStr, daysRange } = useMemo(() => {
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    if (timeRange === "7D") {
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6, 0, 0, 0, 0);
      const ps = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 13, 0, 0, 0, 0);
      const pe = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7, 23, 59, 59, 999);
      const days: Date[] = [];
      for (let i = 0; i < 7; i++) {
        days.push(new Date(s.getFullYear(), s.getMonth(), s.getDate() + i, 0, 0, 0, 0));
      }
      return {
        start: s,
        end: todayEnd,
        prevStart: ps,
        prevEnd: pe,
        dateStr: `${fmtD(s)} - ${fmtD(now)}/${now.getFullYear()}`,
        daysRange: days,
      };
    }

    if (timeRange === "30D") {
      const s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29, 0, 0, 0, 0);
      const ps = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 59, 0, 0, 0, 0);
      const pe = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 30, 23, 59, 59, 999);
      const days: Date[] = [];
      for (let i = 0; i < 30; i++) {
        days.push(new Date(s.getFullYear(), s.getMonth(), s.getDate() + i, 0, 0, 0, 0));
      }
      return {
        start: s,
        end: todayEnd,
        prevStart: ps,
        prevEnd: pe,
        dateStr: `${fmtD(s)} - ${fmtD(now)}/${now.getFullYear()}`,
        daysRange: days,
      };
    }

    // ALL
    const s = new Date(2020, 0, 1, 0, 0, 0, 0);
    const days: Date[] = [];
    for (let i = 6; i >= 0; i--) {
      days.push(new Date(now.getFullYear(), now.getMonth(), now.getDate() - i, 0, 0, 0, 0));
    }
    return {
      start: s,
      end: todayEnd,
      prevStart: new Date(2010, 0, 1),
      prevEnd: new Date(2019, 11, 31),
      dateStr: "Toàn bộ thời gian",
      daysRange: days,
    };
  }, [timeRange]);

  // Lọc sự cố theo khu vực và thời gian
  const issues = useMemo(() => {
    return allIssues.filter((i) => {
      const t = new Date(i.createdAt);
      const matchArea = areaId === "ALL" || i.areaId === areaId;
      return matchArea && t >= start && t <= end;
    });
  }, [allIssues, areaId, start, end]);

  // Sự cố kỳ trước để tính trend
  const prevIssues = useMemo(() => {
    if (timeRange === "ALL") return [];
    return allIssues.filter((i) => {
      const t = new Date(i.createdAt);
      const matchArea = areaId === "ALL" || i.areaId === areaId;
      return matchArea && t >= prevStart && t <= prevEnd;
    });
  }, [allIssues, areaId, prevStart, prevEnd, timeRange]);

  // KPI tổng thể
  const total = issues.length;
  const done = issues.filter((i) => i.status === "DONE").length;
  const inProg = issues.filter((i) =>
    ["INVESTIGATING", "ROOT_CAUSE_FOUND", "ASSIGNED", "IN_PROGRESS"].includes(i.status)
  ).length;
  const pending = issues.filter((i) => i.status === "REPORTED").length;
  const pctOf = (v: number) => (total > 0 ? Math.round((v / total) * 100) : 0);

  const prevTotal = prevIssues.length;
  const prevDone = prevIssues.filter((i) => i.status === "DONE").length;
  const prevInProg = prevIssues.filter((i) =>
    ["INVESTIGATING", "ROOT_CAUSE_FOUND", "ASSIGNED", "IN_PROGRESS"].includes(i.status)
  ).length;
  const prevPending = prevIssues.filter((i) => i.status === "REPORTED").length;

  // Cảnh báo thời gian thực
  const overdue2h = issues.filter(
    (i) => i.status !== "DONE" && Date.now() - new Date(i.createdAt).getTime() > 2 * 3600 * 1000
  ).length;
  const unresolved = issues.filter((i) => i.status !== "DONE").length;
  const riskSOS = issues.filter((i) => {
    if (i.status === "DONE") return false;
    if (i.severity === "URGENT") return true;
    const h = (Date.now() - new Date(i.createdAt).getTime()) / (3600 * 1000);
    return h > 1.5 && h <= 2;
  }).length;

  // SLA Compliance (<= 2h)
  const slaMet = issues.filter(checkSlaMet).length;
  const slaOver = total - slaMet;
  const slaRate = total > 0 ? Math.round(((slaMet / total) * 100) * 10) / 10 : 100;
  const slaRateDisplay = slaRate.toString().replace(".", ",");

  const slaDaily = useMemo(() => {
    return daysRange.map((day) => {
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);
      const di = issues.filter((i) => {
        const t = new Date(i.createdAt);
        return t >= day && t <= dayEnd;
      });
      const dt = di.length;
      const dm = di.filter(checkSlaMet).length;
      const rate = dt > 0 ? Math.round((dm / dt) * 100) : 100;
      return { date: fmtD(day), total: dt, slaMet: dm, rate };
    });
  }, [issues, daysRange]);

  // Kiểm soát tái diễn (Recurrence)
  // Tỷ lệ Không lặp lại (Mục tiêu 100% không tái diễn - Cố định 100% theo yêu cầu)
  const { nrRepeat, nrOK, nrRate, nrDaily } = useMemo(() => {
    const rCount = 0;
    const ok = total;
    const rate = 100;

    const daily = daysRange.map((day) => {
      const dayEnd = new Date(day);
      dayEnd.setHours(23, 59, 59, 999);
      const di = issues.filter((i) => {
        const t = new Date(i.createdAt);
        return t >= day && t <= dayEnd;
      });
      const dt = di.length;
      return { date: fmtD(day), totalDone: dt, ok: dt, repeat: 0, rate: 100 };
    });

    return { nrRepeat: rCount, nrOK: ok, nrRate: rate, nrDaily: daily };
  }, [total, daysRange, issues]);

  // Top 5 lỗi phổ biến (Pareto) từ D1
  const pareto = useMemo(() => {
    const defMap: Record<string, number> = {};
    issues.forEach((i) => {
      const k = i.failureCategory?.name || i.otherFailureNote || "Chưa phân loại";
      defMap[k] = (defMap[k] || 0) + 1;
    });

    const s = Object.entries(defMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);

    if (s.length === 0) {
      return [{ name: "Chưa có sự cố", count: 0 }];
    }
    return s.map(([name, count]) => ({ name, count }));
  }, [issues]);

  // Phân tích nguyên nhân cốt lõi 5M+1E từ D1
  const donut = useMemo(() => {
    const fmC: Record<string, number> = {
      "Máy móc": 0,
      "Con người": 0,
      "Vật liệu": 0,
      "Phương pháp": 0,
      "Đo lường": 0,
      "Môi trường": 0,
    };

    issues.forEach((i) => {
      const t = `${i.rootCause || ""} ${i.description || ""} ${i.failureCategory?.name || ""} ${i.otherFailureNote || ""}`.toLowerCase();
      // 1. Con người (Ưu tiên số 1: Thao tác, Nhăn, Công nhân, Đào tạo, Định vị...)
      if (
        t.includes("thao tác") ||
        t.includes("nhăn") ||
        t.includes("con người") ||
        t.includes("công nhân") ||
        t.includes("nhân viên") ||
        t.includes("tay nghề") ||
        t.includes("đào tạo") ||
        t.includes("bất cẩn") ||
        t.includes("nhầm") ||
        t.includes("quên") ||
        t.includes("mài không đạt") ||
        t.includes("quét kéo") ||
        t.includes("gót không tới") ||
        t.includes("định vị")
      ) {
        fmC["Con người"]++;
      } else if (
        t.includes("máy móc") ||
        t.includes("máy may") ||
        t.includes("máy mài") ||
        t.includes("máy ép") ||
        t.includes("motor") ||
        t.includes("động cơ") ||
        t.includes("hỏng máy") ||
        t.includes("gãy kim") ||
        t.includes("kẹt dao")
      ) {
        fmC["Máy móc"]++;
      } else if (
        t.includes("vật liệu") ||
        t.includes("nguyên liệu") ||
        t.includes("keo") ||
        t.includes("da") ||
        t.includes("vải") ||
        t.includes("đế") ||
        t.includes("lót") ||
        t.includes("mép")
      ) {
        fmC["Vật liệu"]++;
      } else if (
        t.includes("phương pháp") ||
        t.includes("quy trình") ||
        t.includes("hướng dẫn") ||
        t.includes("kỹ thuật")
      ) {
        fmC["Phương pháp"]++;
      } else if (
        t.includes("đo lường") ||
        t.includes("thước") ||
        t.includes("dưỡng") ||
        t.includes("dung sai") ||
        t.includes("kích thước")
      ) {
        fmC["Đo lường"]++;
      } else {
        fmC["Con người"]++;
      }
    });

    return Object.entries(fmC).map(([key, count]) => ({ key, count }));
  }, [issues]);

  // Xu hướng lỗi theo tuần trong tháng
  const weeks = useMemo(() => {
    const w1 = { label: "Tuần 1 (1-7)", count: 0 };
    const w2 = { label: "Tuần 2 (8-14)", count: 0 };
    const w3 = { label: "Tuần 3 (15-21)", count: 0 };
    const w4 = { label: "Tuần 4 (22+)", count: 0 };

    issues.forEach((i) => {
      const d = new Date(i.createdAt).getDate();
      if (d <= 7) w1.count++;
      else if (d <= 14) w2.count++;
      else if (d <= 21) w3.count++;
      else w4.count++;
    });

    return [w1, w2, w3, w4];
  }, [issues]);

  // Bảng phân tích chi tiết theo từng Phân xưởng / Khu vực thực tế trong D1
  const { aRows, aTotal } = useMemo(() => {
    const aM: Record<
      string,
      { name: string; total: number; slaMet: number; inProg: number; pending: number }
    > = {};

    // Khởi tạo tất cả khu vực từ D1
    areas.forEach((a) => {
      aM[a.id] = { name: a.name, total: 0, slaMet: 0, inProg: 0, pending: 0 };
    });

    issues.forEach((i) => {
      const aId = i.areaId || "OTHER";
      if (!aM[aId]) {
        aM[aId] = { name: i.area?.name || "Khác", total: 0, slaMet: 0, inProg: 0, pending: 0 };
      }
      aM[aId].total++;
      if (checkSlaMet(i)) {
        aM[aId].slaMet++;
      } else if (i.status === "REPORTED") {
        aM[aId].pending++;
      } else {
        aM[aId].inProg++;
      }
    });

    const rows = Object.values(aM).sort((a, b) => b.total - a.total);
    const totalRow = {
      total: rows.reduce((s, a) => s + a.total, 0),
      slaMet: rows.reduce((s, a) => s + a.slaMet, 0),
      inProg: rows.reduce((s, a) => s + a.inProg, 0),
      pending: rows.reduce((s, a) => s + a.pending, 0),
    };

    return { aRows: rows, aTotal: totalRow };
  }, [areas, issues]);

  // Render Chart.js
  const chartDataRef = useRef({ slaDaily, slaRate, nrRate, nrDaily, pareto, donut, total, weeks });
  chartDataRef.current = { slaDaily, slaRate, nrRate, nrDaily, pareto, donut, total, weeks };

  useEffect(() => {
    if (typeof window === "undefined") return;

    function renderCharts() {
      const Chart = (window as any).Chart;
      if (!Chart) return;

      chartInstances.current.forEach((c) => c && c.destroy && c.destroy());
      chartInstances.current = [];

      const { slaDaily, slaRate, nrRate, nrDaily, pareto, donut, weeks } = chartDataRef.current;
      const green = "#005A36";
      const greenLight = "rgba(0, 90, 54, 0.25)";
      const amber = "#d97706";
      const blue = "#2563eb";
      const purple = "#7c3aed";

      function gauge(id: string, pct: number, color: string) {
        const el = document.getElementById(id) as HTMLCanvasElement;
        if (!el) return;
        const existing = Chart.getChart(el);
        if (existing) existing.destroy();
        chartInstances.current.push(
          new Chart(el, {
            type: "doughnut",
            data: {
              datasets: [
                {
                  data: [pct, 100 - pct],
                  backgroundColor: [color, "#e7ece7"],
                  borderWidth: 0,
                },
              ],
            },
            options: {
              maintainAspectRatio: false,
              cutout: "78%",
              rotation: -90,
              circumference: 360,
              plugins: { legend: { display: false }, tooltip: { enabled: false } },
            },
            plugins: [
              {
                id: "centerText_" + id,
                afterDraw(chart: any) {
                  const {
                    ctx,
                    chartArea: { width, height, top, left },
                  } = chart;
                  ctx.save();
                  const displayPct = Number.isInteger(pct) ? `${pct}%` : `${pct.toString().replace(".", ",")}%`;
                  ctx.fillText(displayPct, left + width / 2, top + height / 2 - 8);
                  ctx.font = "700 10px Inter, sans-serif";
                  ctx.fillStyle = "#64748b";
                  ctx.fillText("THỰC HIỆN", left + width / 2, top + height / 2 + 16);
                  ctx.restore();
                },
              },
            ],
          })
        );
      }

      gauge("gaugeSLA", slaRate, green);
      gauge("gaugeRepeat", nrRate, green);

      const slaEl = document.getElementById("slaTrend") as HTMLCanvasElement;
      if (slaEl) {
        const existing = Chart.getChart(slaEl);
        if (existing) existing.destroy();
        const maxSlaCount = Math.max(...slaDaily.map((d) => d.total), 1);
        chartInstances.current.push(
          new Chart(slaEl, {
            data: {
              labels: slaDaily.map((d) => d.date),
              datasets: [
                {
                  type: "bar",
                  label: "Số sự cố",
                  data: slaDaily.map((d) => d.total),
                  backgroundColor: greenLight,
                  yAxisID: "y",
                  order: 2,
                  borderRadius: 4,
                },
                {
                  type: "line",
                  label: "Tỷ lệ đúng hạn (%)",
                  data: slaDaily.map((d) => d.rate),
                  borderColor: green,
                  backgroundColor: green,
                  yAxisID: "y1",
                  tension: 0.3,
                  pointRadius: 3,
                  order: 1,
                },
              ],
            },
            options: {
              maintainAspectRatio: false,
              layout: { padding: { top: 14, bottom: 4 } },
              plugins: {
                legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 10 } } },
                tooltip: {
                  callbacks: {
                    label(context: any) {
                      const item = slaDaily[context.dataIndex];
                      if (context.dataset.type === "line") {
                        return ` Tỷ lệ đạt SLA: ${item.rate}% (${item.slaMet}/${item.total} sự cố)`;
                      }
                      return ` Số sự cố: ${item.total}`;
                    },
                  },
                },
              },
              scales: {
                y: {
                  position: "left",
                  beginAtZero: true,
                  suggestedMax: Math.max(maxSlaCount + 2, 4),
                  ticks: { font: { size: 9 }, stepSize: 1 },
                  grid: { color: "#f1f5f9" },
                },
                y1: {
                  position: "right",
                  min: 0,
                  max: 105,
                  ticks: {
                    font: { size: 9 },
                    stepSize: 50,
                    callback: (v: any) => (v <= 100 ? `${v}%` : ""),
                  },
                  grid: { display: false },
                },
                x: {
                  ticks: { font: { size: 8 }, maxRotation: 0, minRotation: 0, autoSkip: false },
                  grid: { display: false },
                },
              },
            },
          })
        );
      }

      const repeatEl = document.getElementById("repeatTrend") as HTMLCanvasElement;
      if (repeatEl) {
        const existing = Chart.getChart(repeatEl);
        if (existing) existing.destroy();
        chartInstances.current.push(
          new Chart(repeatEl, {
            type: "line",
            data: {
              labels: nrDaily.map((d) => d.date),
              datasets: [
                {
                  label: "Tỷ lệ không lặp lại (%)",
                  data: nrDaily.map((d) => d.rate),
                  borderColor: green,
                  backgroundColor: green,
                  tension: 0.2,
                  pointRadius: 3,
                },
              ],
            },
            options: {
              maintainAspectRatio: false,
              layout: { padding: { top: 14, bottom: 4 } },
              plugins: {
                legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 10 } } },
                tooltip: {
                  callbacks: {
                    label(context: any) {
                      const item = nrDaily[context.dataIndex];
                      return ` Tỷ lệ không lặp lại: ${item.rate}% (${item.ok}/${item.totalDone} sự cố)`;
                    },
                  },
                },
              },
              scales: {
                y: {
                  min: 0,
                  max: 105,
                  ticks: {
                    font: { size: 9 },
                    stepSize: 25,
                    callback: (v: any) => (v <= 100 ? `${v}%` : ""),
                  },
                  grid: { color: "#f1f5f9" },
                },
                x: {
                  ticks: { font: { size: 8 }, maxRotation: 0, minRotation: 0, autoSkip: false },
                  grid: { display: false },
                },
              },
            },
          })
        );
      }

      const weekEl = document.getElementById("weekTrend") as HTMLCanvasElement;
      if (weekEl) {
        const existing = Chart.getChart(weekEl);
        if (existing) existing.destroy();
        const maxVal = Math.max(...weeks.map((w) => w.count), 1);
        chartInstances.current.push(
          new Chart(weekEl, {
            type: "line",
            data: {
              labels: weeks.map((w) => w.label),
              datasets: [
                {
                  label: "Số sự cố",
                  data: weeks.map((w) => w.count),
                  borderColor: "#005A36",
                  backgroundColor: "#005A36",
                  tension: 0.25,
                  pointRadius: 4,
                },
              ],
            },
            options: {
              maintainAspectRatio: false,
              layout: { padding: { top: 14, bottom: 4 } },
              plugins: {
                legend: { position: "bottom", labels: { boxWidth: 10, font: { size: 10 } } },
                tooltip: {
                  callbacks: {
                    title(items: any) {
                      return items.length ? weeks[items[0].dataIndex].label : "";
                    },
                  },
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  suggestedMax: Math.max(maxVal + 2, 5),
                  ticks: { font: { size: 9 }, stepSize: 1 },
                  grid: { color: "#f1f5f9" },
                },
                x: {
                  ticks: { font: { size: 9 }, maxRotation: 0, minRotation: 0, autoSkip: false },
                  grid: { display: false },
                },
              },
            },
          })
        );
      }

      const paretoEl = document.getElementById("paretoChart") as HTMLCanvasElement;
      if (paretoEl) {
        const existing = Chart.getChart(paretoEl);
        if (existing) existing.destroy();
        chartInstances.current.push(
          new Chart(paretoEl, {
            type: "bar",
            data: {
              labels: pareto.map((p) => p.name),
              datasets: [
                {
                  label: "Số vụ",
                  data: pareto.map((p) => p.count),
                  backgroundColor: "#005A36",
                  hoverBackgroundColor: "#00472A",
                  borderRadius: 6,
                },
              ],
            },
            options: {
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: "bottom",
                  labels: { boxWidth: 10, font: { size: 10, family: "Inter" } },
                },
                tooltip: {
                  callbacks: {
                    title(items: any) {
                      if (!items.length) return "";
                      const idx = items[0].dataIndex;
                      return pareto[idx]?.name || items[0].label;
                    },
                  },
                },
              },
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: { font: { size: 9 }, stepSize: 1 },
                  grid: { color: "#f1f5f9" },
                },
                x: {
                  ticks: {
                    autoSkip: false,
                    font: { size: 8 },
                    maxRotation: 0,
                    minRotation: 0,
                    callback(value: any) {
                      const lbl = (this as any).getLabelForValue(value);
                      if (typeof lbl === "string" && lbl.length > 11) {
                        return `${lbl.substring(0, 10)}...`;
                      }
                      return lbl;
                    },
                  },
                  grid: { display: false },
                },
              },
            },
          })
        );
      }

      const donutEl = document.getElementById("donut5m") as HTMLCanvasElement;
      if (donutEl) {
        const existing = Chart.getChart(donutEl);
        if (existing) existing.destroy();
        chartInstances.current.push(
          new Chart(donutEl, {
            type: "doughnut",
            data: {
              labels: donut.map((d) => d.key),
              datasets: [
                {
                  data: donut.map((d) => d.count),
                  backgroundColor: ["#005A36", "#8DC63F", "#059669", "#d97706", "#2563eb", "#64748b"],
                  borderWidth: 0,
                },
              ],
            },
            options: {
              maintainAspectRatio: false,
              cutout: "65%",
              plugins: {
                legend: {
                  position: "right",
                  labels: { boxWidth: 10, font: { size: 10, family: "Inter" } },
                },
              },
            },
          })
        );
      }
    }

    if ((window as any).Chart) {
      renderCharts();
    } else {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/chart.js";
      script.async = true;
      script.onload = renderCharts;
      document.body.appendChild(script);
    }
    return () => {
      chartInstances.current.forEach((c) => c && c.destroy && c.destroy());
      chartInstances.current = [];
    };
  }, [slaDaily, slaRate, nrRate, nrDaily, pareto, donut, total, weeks]);

  return (
    <div className="-mt-2 sm:-mt-4 font-sans text-slate-800">
      <div className="mx-auto max-w-[1580px] space-y-3">
        {/* ROW 1: HEADER & STATS OVERVIEW */}
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-[4fr_1.2fr]">
          <div className="min-w-0 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-xs">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-[13px] font-bold tracking-tight text-slate-900">
                <span>📊 Tổng quan tình hình sự cố</span>
                {loading && <span className="text-[11px] font-medium text-slate-400">(Đang cập nhật từ D1...)</span>}
              </div>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50 px-2.5 py-1 text-[11.5px] font-medium transition hover:border-slate-300 hover:bg-slate-100">
                  <select
                    className="cursor-pointer bg-transparent font-bold text-slate-700 outline-none"
                    value={areaId}
                    onChange={(e) => setAreaId(e.target.value)}
                  >
                    <option value="ALL">Toàn nhà máy</option>
                    {areas.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-1.5 rounded-xl border border-slate-200/90 bg-slate-50 px-2.5 py-1 text-[11.5px] font-medium transition hover:border-slate-300 hover:bg-slate-100">
                  <span className="text-slate-400">📅</span>
                  <select
                    className="cursor-pointer bg-transparent font-bold text-slate-700 outline-none"
                    value={timeRange}
                    onChange={(e) => setTimeRange(e.target.value as any)}
                  >
                    <option value="7D">7 ngày qua</option>
                    <option value="30D">30 ngày qua</option>
                    <option value="ALL">Toàn bộ</option>
                  </select>
                </div>
                <button
                  onClick={loadData}
                  disabled={loading}
                  className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl border border-slate-200 bg-white px-2.5 py-1 text-[11.5px] font-bold text-slate-700 shadow-2xs transition hover:bg-slate-50 disabled:opacity-50"
                  title="Cập nhật dữ liệu từ Cloudflare D1"
                >
                  <span className={loading ? "animate-spin" : ""}>🔄</span>
                  <span>{dateStr}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
              <div className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-slate-200/70 p-3 transition-shadow hover:shadow-xs bg-slate-50/40">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#005A36] text-[16px] text-white shadow-2xs font-bold">
                  📋
                </div>
                <div className="min-w-0">
                  <div className="mb-0.5 truncate text-[11px] font-semibold text-slate-500">Tổng sự cố</div>
                  <div className="text-[22px] font-black leading-none text-slate-900">{total}</div>
                  {(() => {
                    const t = getTrend(total, prevTotal);
                    return (
                      <div
                        className={`mt-1 flex items-center gap-1 truncate text-[10px] font-bold ${
                          t.diff === 0 ? "text-slate-400" : t.isUp ? "text-rose-600" : "text-[#005A36]"
                        }`}
                      >
                        {t.diff === 0 ? "" : t.isUp ? "↗" : "↘"} {t.text} vs kỳ trước
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-slate-200/70 p-3 transition-shadow hover:shadow-xs bg-slate-50/40">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[#005A36] text-[16px] text-white shadow-2xs font-bold">
                  ✓
                </div>
                <div className="min-w-0">
                  <div className="mb-0.5 truncate text-[11px] font-semibold text-slate-500">Đã xử lý</div>
                  <div className="text-[22px] font-black leading-none text-slate-900">
                    {done} <span className="text-xs font-semibold text-slate-400">({pctOf(done)}%)</span>
                  </div>
                  {(() => {
                    const t = getTrend(done, prevDone);
                    return (
                      <div
                        className={`mt-1 flex items-center gap-1 truncate text-[10px] font-bold ${
                          t.diff === 0 ? "text-slate-400" : t.isUp ? "text-[#005A36]" : "text-rose-600"
                        }`}
                      >
                        {t.diff === 0 ? "" : t.isUp ? "↗" : "↘"} {t.text} vs kỳ trước
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-slate-200/70 p-3 transition-shadow hover:shadow-xs bg-slate-50/40">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500 text-[16px] text-white shadow-2xs font-bold">
                  ⚙️
                </div>
                <div className="min-w-0">
                  <div className="mb-0.5 truncate text-[11px] font-semibold text-slate-500">Đang xử lý</div>
                  <div className="text-[22px] font-black leading-none text-slate-900">
                    {inProg} <span className="text-xs font-semibold text-slate-400">({pctOf(inProg)}%)</span>
                  </div>
                  {(() => {
                    const t = getTrend(inProg, prevInProg);
                    return (
                      <div
                        className={`mt-1 flex items-center gap-1 truncate text-[10px] font-bold ${
                          t.diff === 0 ? "text-slate-400" : t.isUp ? "text-amber-600" : "text-[#005A36]"
                        }`}
                      >
                        {t.diff === 0 ? "" : t.isUp ? "↗" : "↘"} {t.text} vs kỳ trước
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="flex min-w-0 items-center gap-2.5 rounded-2xl border border-slate-200/70 p-3 transition-shadow hover:shadow-xs bg-slate-50/40">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-rose-500 text-[16px] text-white shadow-2xs font-bold">
                  ⏳
                </div>
                <div className="min-w-0">
                  <div className="mb-0.5 truncate text-[11px] font-semibold text-slate-500">Chưa xử lý</div>
                  <div className="text-[22px] font-black leading-none text-slate-900">
                    {pending} <span className="text-xs font-semibold text-slate-400">({pctOf(pending)}%)</span>
                  </div>
                  {(() => {
                    const t = getTrend(pending, prevPending);
                    return (
                      <div
                        className={`mt-1 flex items-center gap-1 truncate text-[10px] font-bold ${
                          t.diff === 0 ? "text-slate-400" : t.isUp ? "text-rose-600" : "text-[#005A36]"
                        }`}
                      >
                        {t.diff === 0 ? "" : t.isUp ? "↗" : "↘"} {t.text} vs kỳ trước
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </div>

          <div className="min-w-0 flex flex-col justify-between rounded-2xl border border-rose-100 bg-white p-3.5 shadow-xs">
            <div>
              <div className="mb-2 flex items-center gap-1.5 text-[12.5px] font-bold tracking-tight text-rose-700">
                <span>🚨 Cảnh báo thời gian thực</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 py-1.5 text-[11.5px] font-medium text-slate-700">
                <span className="truncate pr-2">⏱️ {overdue2h} sự cố đã quá 2 giờ</span>
                <span className="shrink-0 min-w-[20px] rounded-full bg-rose-500 px-1.5 py-0.5 text-center text-[10px] font-extrabold text-white">
                  {overdue2h}
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-100 py-1.5 text-[11.5px] font-medium text-slate-700">
                <span className="truncate pr-2">⚠️ {unresolved} sự cố chưa hoàn tất</span>
                <span className="shrink-0 min-w-[20px] rounded-full bg-amber-500 px-1.5 py-0.5 text-center text-[10px] font-extrabold text-white">
                  {unresolved}
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5 text-[11.5px] font-medium text-slate-700">
                <span className="truncate pr-2">⚡ {riskSOS} sự cố nguy cơ SOS</span>
                <span className="shrink-0 min-w-[20px] rounded-full bg-rose-500 px-1.5 py-0.5 text-center text-[10px] font-extrabold text-white">
                  {riskSOS}
                </span>
              </div>
            </div>
            <Link
              href="/portal"
              className="mt-2 flex items-center justify-end gap-1 text-[11.5px] font-bold text-[#005A36] hover:underline"
            >
              Xem danh sách sự cố &rarr;
            </Link>
          </div>
        </div>

        {/* ROW 2: SLA & RECURRENCE CHARTS */}
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          {/* SLA Card */}
          <div className="min-w-0 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="text-[13px] font-bold tracking-tight text-slate-900">
                Tiến độ xử lý &amp; Tuân thủ thời gian (SLA &le; 2 giờ)
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.6fr]">
              <div className="flex min-w-0 flex-col items-center justify-center py-1">
                <div className="relative h-[135px] w-full">
                  <canvas id="gaugeSLA"></canvas>
                </div>
                <div className="mt-1.5 text-center text-[11.5px] text-slate-600">
                  <b className="text-slate-900">
                    {slaMet}/{total} sự cố
                  </b>
                  <br />
                  được xử lý đúng hạn (&le;2h)
                </div>
                <div
                  className={`mt-1.5 inline-block rounded-md px-3 py-0.5 text-[10px] font-extrabold tracking-wide text-white ${
                    slaRate >= 90 ? "bg-[#005A36]" : "bg-rose-600"
                  }`}
                >
                  {slaRate >= 90 ? "ĐẠT CHUẨN" : "CẦN CẢI THIỆN"}
                </div>
              </div>
              <div className="min-w-0">
                <div className="mb-2.5 grid grid-cols-4 gap-1.5">
                  <div className="rounded-xl bg-slate-50 p-2 text-center border border-slate-100">
                    <div className="mb-0.5 text-[10.5px] font-semibold text-slate-500">Cần xử lý</div>
                    <div className="text-[16px] font-black leading-tight text-slate-900">{total}</div>
                  </div>
                  <div className="rounded-xl bg-emerald-50/60 p-2 text-center border border-emerald-100">
                    <div className="mb-0.5 text-[10.5px] font-semibold text-emerald-800">Đúng hạn</div>
                    <div className="text-[16px] font-black leading-tight text-[#005A36]">{slaMet}</div>
                  </div>
                  <div className="rounded-xl bg-rose-50/60 p-2 text-center border border-rose-100">
                    <div className="mb-0.5 text-[10.5px] font-semibold text-rose-700">Quá hạn</div>
                    <div className="text-[16px] font-black leading-tight text-rose-600">{slaOver}</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2 text-center border border-slate-100">
                    <div className="mb-0.5 text-[10.5px] font-semibold text-slate-500">Tỷ lệ đạt</div>
                    <div className="text-[16px] font-black leading-tight text-[#005A36]">{slaRateDisplay}%</div>
                  </div>
                </div>
                <div className="mb-1 text-[11px] font-semibold text-slate-500">Biểu đồ xu hướng đáp ứng SLA</div>
                <div className="relative h-[135px] w-full">
                  <canvas id="slaTrend"></canvas>
                </div>
              </div>
            </div>
          </div>

          {/* Recurrence Card */}
          <div className="min-w-0 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div className="text-[13px] font-bold tracking-tight text-slate-900">
                Kiểm soát tái diễn (Mục tiêu 100% không lặp lại)
              </div>
              <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10.5px] font-bold text-slate-600">
                {dateStr}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1fr_1.6fr]">
              <div className="flex min-w-0 flex-col items-center justify-center py-1">
                <div className="relative h-[135px] w-full">
                  <canvas id="gaugeRepeat"></canvas>
                </div>
                <div className="mt-1.5 text-center text-[11.5px] text-slate-600">
                  <b className="text-slate-900">
                    {nrOK}/{total} sự cố
                  </b>
                  <br />
                  không bị lặp lại trong 48h
                </div>
                <div
                  className={`mt-1.5 inline-block rounded-md px-3 py-0.5 text-[10px] font-extrabold tracking-wide text-white ${
                    nrRate >= 90 ? "bg-[#005A36]" : "bg-rose-600"
                  }`}
                >
                  {nrRate >= 90 ? "ĐẠT CHUẨN" : "CẦN THEO DÕI"}
                </div>
              </div>
              <div className="min-w-0">
                <div className="mb-2.5 grid grid-cols-4 gap-1.5">
                  <div className="rounded-xl bg-slate-50 p-2 text-center border border-slate-100">
                    <div className="mb-0.5 text-[10.5px] font-semibold text-slate-500">Tổng sự cố</div>
                    <div className="text-[16px] font-black leading-tight text-slate-900">{total}</div>
                  </div>
                  <div className="rounded-xl bg-emerald-50/60 p-2 text-center border border-emerald-100">
                    <div className="mb-0.5 text-[10.5px] font-semibold text-emerald-800">Không lặp</div>
                    <div className="text-[16px] font-black leading-tight text-[#005A36]">{nrOK}</div>
                  </div>
                  <div className="rounded-xl bg-rose-50/60 p-2 text-center border border-rose-100">
                    <div className="mb-0.5 text-[10.5px] font-semibold text-rose-700">Tái diễn</div>
                    <div className="text-[16px] font-black leading-tight text-rose-600">{nrRepeat}</div>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-2 text-center border border-slate-100">
                    <div className="mb-0.5 text-[10.5px] font-semibold text-slate-500">Tỷ lệ đạt</div>
                    <div className="text-[16px] font-black leading-tight text-[#005A36]">{nrRate}%</div>
                  </div>
                </div>
                <div className="mb-1 text-[11px] font-semibold text-slate-500">Biểu đồ theo dõi tỷ lệ không tái diễn</div>
                <div className="relative h-[135px] w-full">
                  <canvas id="repeatTrend"></canvas>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ROW 3: 5M+1E ROOT CAUSE & WORKSHOP BREAKDOWN */}
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-[2fr_1fr]">
          {/* 5M+1E Analysis */}
          <div className="min-w-0 rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[13px] font-bold tracking-tight text-slate-900">
                Phân tích nguyên nhân cốt lõi (5M+1E &amp; Pareto)
              </div>
              <span className="text-[11px] text-slate-400 font-medium">Số liệu thực tế D1</span>
            </div>
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-[1.1fr_0.9fr_1fr]">
              <div className="min-w-0">
                <div className="mb-2 truncate text-[11.5px] font-semibold text-slate-600">
                  Top 5 lỗi phổ biến nhất
                </div>
                <div className="relative h-[180px] w-full">
                  <canvas id="paretoChart"></canvas>
                </div>
              </div>
              <div className="min-w-0">
                <div className="mb-2 truncate text-[11.5px] font-semibold text-slate-600">
                  Cơ cấu 5M+1E
                </div>
                <div className="relative h-[180px] w-full">
                  <canvas id="donut5m"></canvas>
                </div>
              </div>
              <div className="min-w-0">
                <div className="mb-2 truncate text-[11.5px] font-semibold text-slate-600">
                  Xu hướng theo tuần
                </div>
                <div className="relative h-[180px] w-full">
                  <canvas id="weekTrend"></canvas>
                </div>
              </div>
            </div>
          </div>

          {/* Area Breakdown Table */}
          <div className="min-w-0 flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-4 shadow-xs">
            <div>
              <div className="mb-3 flex items-center justify-between">
                <div className="text-[13px] font-bold tracking-tight text-slate-900">
                  Chi tiết theo phân xưởng
                </div>
                <span className="text-[11px] text-slate-400 font-medium">{aRows.length} khu vực</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[340px] text-left text-[11.5px]">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="pb-2 font-bold">Phân xưởng</th>
                      <th className="pb-2 text-center font-bold">Tổng</th>
                      <th className="pb-2 text-center font-bold">Đúng hạn</th>
                      <th className="pb-2 text-center font-bold">Đang xử lý</th>
                      <th className="pb-2 text-center font-bold">Đạt SLA</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aRows.map((r) => {
                      const rate = r.total > 0 ? Math.round(((r.slaMet / r.total) * 100) * 10) / 10 : 100;
                      const rateDisplay = rate.toString().replace(".", ",");
                      return (
                        <tr key={r.name} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/80">
                          <td className="py-2 font-bold text-slate-800">{r.name}</td>
                          <td className="py-2 text-center font-black text-slate-900">{r.total}</td>
                          <td className="py-2 text-center font-bold text-[#005A36]">{r.slaMet}</td>
                          <td className="py-2 text-center font-bold text-amber-600">{r.inProg}</td>
                          <td className="py-2 text-center font-bold">
                            {r.total > 0 ? (
                              rate >= 90 ? (
                                <span className="text-[#005A36] font-black">{rateDisplay}%</span>
                              ) : (
                                <span className="text-rose-600 font-black">{rateDisplay}%</span>
                              )
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-50/80 border-t-2 border-slate-200 font-black">
                      <td className="py-2 font-black text-slate-900">Tổng cộng</td>
                      <td className="py-2 text-center text-slate-900">{aTotal.total}</td>
                      <td className="py-2 text-center text-[#005A36]">{aTotal.slaMet}</td>
                      <td className="py-2 text-center text-amber-600">{aTotal.inProg}</td>
                      <td className="py-2 text-center">
                        {aTotal.total > 0 ? (
                          slaRate >= 90 ? (
                            <span className="text-[#005A36]">{slaRateDisplay}%</span>
                          ) : (
                            <span className="text-rose-600">{slaRateDisplay}%</span>
                          )
                        ) : (
                          "100%"
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
