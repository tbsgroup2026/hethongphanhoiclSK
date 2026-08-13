"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/page-header";
import { SearchInput } from "@/components/search-input";
import { DetailModal, DetailRow } from "@/components/detail-modal";

type Issue = {
  id: string;
  poCode: string;
  description: string;
  status: string;
  createdAt: string;
  reporter: { name: string; employeeCode: string };
  area: { name: string } | null;
  team: { name: string } | null;
  productionLine: { name: string } | null;
  failureCategory: { name: string } | null;
  rootCause: string | null;
  solution: string | null;
  task: { status: string; assignee: { name: string } | null } | null;
};

const STATUS_LABEL: Record<string, string> = {
  REPORTED: "Vừa báo cáo",
  INVESTIGATING: "Đang điều tra",
  ROOT_CAUSE_FOUND: "Đã có nguyên nhân",
  ASSIGNED: "Đã giao việc",
  IN_PROGRESS: "Đang xử lý",
  DONE: "Hoàn thành",
};

const STATUS_OPTIONS = Object.keys(STATUS_LABEL);

export default function IssuesPage() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [viewing, setViewing] = useState<Issue | null>(null);

  useEffect(() => {
    fetch("/api/issues")
      .then((r) => r.json())
      .then((data) => {
        setIssues(data);
        setLoading(false);
      });
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return issues.filter((i) => {
      const matchesSearch =
        !q || i.poCode.toLowerCase().includes(q) || i.description.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "ALL" || i.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [issues, search, statusFilter]);

  return (
    <div>
      <PageHeader title="Sự cố">
        <SearchInput value={search} onChange={setSearch} placeholder="Tìm theo PO, mô tả..." />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
        >
          <option value="ALL">Tất cả trạng thái</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </PageHeader>

      <div className="overflow-hidden rounded-xl bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-100 text-slate-600">
            <tr>
              <th className="px-4 py-3">PO</th>
              <th className="px-4 py-3">Khu vực / Tổ / Chuyền</th>
              <th className="px-4 py-3">Người báo cáo</th>
              <th className="px-4 py-3">Trạng thái</th>
              <th className="px-4 py-3">Bảo trì phụ trách</th>
              <th className="px-4 py-3">Thời gian</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td className="px-4 py-4 text-slate-400" colSpan={6}>
                  Đang tải...
                </td>
              </tr>
            )}
            {!loading && filtered.length === 0 && (
              <tr>
                <td className="px-4 py-4 text-slate-400" colSpan={6}>
                  {issues.length === 0 ? "Chưa có sự cố nào" : "Không tìm thấy sự cố phù hợp"}
                </td>
              </tr>
            )}
            {filtered.map((issue) => (
              <tr
                key={issue.id}
                onClick={() => setViewing(issue)}
                className="cursor-pointer border-t border-slate-100 hover:bg-slate-50"
              >
                <td className="px-4 py-3 font-mono">{issue.poCode}</td>
                <td className="px-4 py-3">
                  {issue.area?.name || "-"} / {issue.team?.name || "-"} / {issue.productionLine?.name || "-"}
                </td>
                <td className="px-4 py-3">{issue.reporter.name}</td>
                <td className="px-4 py-3">
                  <span className="rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">
                    {STATUS_LABEL[issue.status] || issue.status}
                  </span>
                </td>
                <td className="px-4 py-3">{issue.task?.assignee?.name || "-"}</td>
                <td className="px-4 py-3 text-slate-600">
                  {new Date(issue.createdAt).toLocaleString("vi-VN", {
                    day: "2-digit",
                    month: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewing && (
        <DetailModal title={`PO ${viewing.poCode}`} onClose={() => setViewing(null)}>
          <DetailRow label="Người báo cáo" value={`${viewing.reporter.name} (${viewing.reporter.employeeCode})`} />
          <DetailRow label="Khu vực" value={viewing.area?.name} />
          <DetailRow label="Tổ" value={viewing.team?.name} />
          <DetailRow label="Chuyền" value={viewing.productionLine?.name} />
          <DetailRow label="Danh mục lỗi" value={viewing.failureCategory?.name} />
          <DetailRow label="Mô tả" value={viewing.description} />
          <DetailRow label="Trạng thái" value={STATUS_LABEL[viewing.status] || viewing.status} />
          <DetailRow label="Nguyên nhân gốc" value={viewing.rootCause} />
          <DetailRow label="Giải pháp" value={viewing.solution} />
          <DetailRow label="Bảo trì phụ trách" value={viewing.task?.assignee?.name} />
        </DetailModal>
      )}
    </div>
  );
}
