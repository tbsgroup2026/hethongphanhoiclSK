"use client";

import dynamic from "next/dynamic";
import type { ComponentProps } from "react";
import type ReportsChartsType from "./reports-charts";

// Tải recharts (thư viện nặng) hoàn toàn phía trình duyệt, không đưa vào bundle server/Worker.
const ReportsCharts = dynamic(() => import("./reports-charts"), {
  ssr: false,
  loading: () => (
    <div className="flex h-64 items-center justify-center text-sm text-slate-400">
      Đang tải biểu đồ...
    </div>
  ),
});

export default function ReportsChartsLazy(props: ComponentProps<typeof ReportsChartsType>) {
  return <ReportsCharts {...props} />;
}
