"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ArrowLeft,
  ArrowsDownUp,
  Bell,
  Brain,
  MagnifyingGlass,
  Pulse,
  Shield,
  Users,
  Warning,
} from "@phosphor-icons/react";
import {
  type AlertStatus,
  type MonitoredUser,
  type ThreatLevel,
} from "@/data/risksage";
import {
  getAlerts,
  getEvaluation,
  getStats,
  getUser,
  getUsers,
  recordAction,
  toMonitoredUser,
  toRiskDistribution,
  toTelemetry,
  type ApiEvaluation,
  type ApiStats,
} from "@/lib/api";
import { ShapInspector } from "@/components/dashboard/ShapInspector";
import { CertBenchmarkPanel } from "@/components/dashboard/CertBenchmarkPanel";
import { AlertTriagePanel } from "@/components/dashboard/AlertTriagePanel";

type DashboardTab = "overview" | "shap" | "alerts" | "cert";

export default function SecurityDashboardPage() {
  const [activeTab, setActiveTab] = useState<DashboardTab>("overview");
  const [users, setUsers] = useState<MonitoredUser[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [telemetry, setTelemetry] = useState<
    { day: string; loginFlags: number; fileFlags: number; emailFlags: number; usbFlags: number }[]
  >([]);
  const [distribution, setDistribution] = useState<
    { bucket: string; count: number; fill: string }[]
  >([]);
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [evaluation, setEvaluation] = useState<ApiEvaluation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [summaries, alerts, st, ev] = await Promise.all([
          getUsers(),
          getAlerts(),
          getStats(),
          getEvaluation(),
        ]);
        const details = await Promise.all(
          summaries.map((s) => getUser(s.userId))
        );
        if (cancelled) return;
        const mapped = details.map(toMonitoredUser);
        setUsers(mapped);
        setSelectedUserId(mapped[0]?.id ?? "");
        setTelemetry(toTelemetry(alerts));
        setDistribution(toRiskDistribution(mapped));
        setStats(st);
        setEvaluation(ev);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Could not reach the API");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Table filters
  const [searchQuery, setSearchQuery] = useState("");
  const [threatFilter, setThreatFilter] = useState<ThreatLevel | "All">("All");
  const [statusFilter, setStatusFilter] = useState<AlertStatus | "All">("All");
  const [sortDesc, setSortDesc] = useState(true);

  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users
      .filter((u) => {
        if (threatFilter !== "All" && u.threatLevel !== threatFilter) return false;
        if (statusFilter !== "All" && u.status !== statusFilter) return false;
        if (!q) return true;
        return (
          u.name.toLowerCase().includes(q) ||
          u.certId.toLowerCase().includes(q) ||
          u.department.toLowerCase().includes(q) ||
          u.primaryTrigger.toLowerCase().includes(q) ||
          u.hostId.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => (sortDesc ? b.riskScore - a.riskScore : a.riskScore - b.riskScore));
  }, [users, searchQuery, threatFilter, statusFilter, sortDesc]);

  const highRiskCount = users.filter(
    (u) => u.threatLevel === "Critical" || u.threatLevel === "High"
  ).length;
  const openThreatsCount = users.filter((u) => u.status !== "Cleared").length;
  const alertDays = stats ? Object.keys(stats.alertsByDay).sort() : [];
  const latestDay = alertDays[alertDays.length - 1];
  const priorDay = alertDays[alertDays.length - 2];
  const threats24h = latestDay && stats ? stats.alertsByDay[latestDay] : 0;
  const threatsDelta =
    priorDay && stats ? threats24h - stats.alertsByDay[priorDay] : 0;
  const ensembleMetric = evaluation?.models?.[0];

  function handleUpdateStatus(id: string, nextStatus: AlertStatus) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, status: nextStatus } : u)));
  }

  function handleUpdateNotes(id: string, notes: string) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, analystNotes: notes } : u)));
  }

  function inspectUser(id: string) {
    setSelectedUserId(id);
    setActiveTab("shap");
  }

  async function handleRecordAction(userId: string, action: string) {
    setActionError(null);
    try {
      await recordAction(userId, action);
      return true;
    } catch {
      setActionError("Could not record that action. The API is unreachable.");
      return false;
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1f10] text-white">
        <p className="text-sm text-[#9aa39a]">Loading live risk data…</p>
      </div>
    );
  }

  if (error || users.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f1f10] px-4 text-white">
        <div className="max-w-md rounded-xl border border-white/10 bg-[#162a17] p-6">
          <h2 className="text-lg font-medium">Could not load the dashboard</h2>
          <p className="mt-2 text-sm text-[#9aa39a]">
            {error ?? "The API returned no users."} The dashboard shows live
            data only, so there is nothing to fall back to. Check the backend
            is running and
            <span className="font-mono-code text-white"> NEXT_PUBLIC_RISKSAGE_API_URL </span>
            points at it.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-4 rounded-lg bg-[#c6f19d] px-4 py-2 text-sm font-medium text-[#0f1f10]"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const selectedUser = users.find((u) => u.id === selectedUserId) ?? users[0];

  return (
    <div className="min-h-screen bg-[#0f1f10] text-white">
      {/* Top Enterprise Header */}
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#0f1f10]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1360px] flex-wrap items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-lg font-medium tracking-tight text-white"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M2.5 21.5V12a9.5 9.5 0 0 1 19 0v9.5h-6V12a3.5 3.5 0 0 0-7 0v9.5z"
                  fill="#c6f19d"
                />
              </svg>
              <span>RiskSage</span>
            </Link>
            <span className="hidden h-4 w-px bg-white/15 sm:block" />
            <span className="hidden items-center gap-1.5 rounded-full border border-[#c6f19d]/25 bg-[#162a17] px-2.5 py-1 font-mono-code text-[11px] text-[#c6f19d] sm:inline-flex">
              <span className="h-1.5 w-1.5 rounded-full bg-[#c6f19d]" />
              Live data · {stats ? stats.eventCounts.total.toLocaleString() : "…"} events
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden font-mono-code text-xs text-[#9aa39a] md:inline">
              Scoring · {stats ? `${stats.scoringLatencyMsPerDay} ms` : "…"} / user-day
            </span>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#162a17] px-3 py-1.5 text-xs font-medium text-white transition hover:border-[#c6f19d]"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Landing Page
            </Link>
          </div>
        </div>

        {/* View Tabs */}
        <div className="mx-auto max-w-[1360px] px-4 sm:px-6 lg:px-8">
          <nav
            className="flex gap-1 overflow-x-auto border-t border-white/10 pt-2"
            aria-label="Dashboard sections"
          >
            {[
              { id: "overview", label: "Security Overview", icon: Shield },
              { id: "shap", label: "SHAP & User Behavior", icon: Brain },
              { id: "alerts", label: `Alert Management (${openThreatsCount})`, icon: Bell },
              { id: "cert", label: "Model Evaluation", icon: Pulse },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as DashboardTab)}
                  className={`inline-flex shrink-0 items-center gap-2 border-b-2 px-3.5 py-2.5 text-xs font-medium transition sm:text-sm ${
                    isActive
                      ? "border-[#c6f19d] text-[#c6f19d]"
                      : "border-transparent text-[#9aa39a] hover:text-white"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-[1360px] space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {/* Top KPI Cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-[#162a17] p-5">
            <div className="flex items-center justify-between text-xs text-[#9aa39a]">
              <span>Total Monitored Users</span>
              <Users className="h-4 w-4 text-[#c6f19d]" />
            </div>
            <p className="mt-2 font-mono-code text-3xl font-semibold tracking-tight text-white">
              {users.length}
            </p>
            <p className="mt-1 text-xs text-[#9aa39a]">
              Across {new Set(users.map((u) => u.department)).size} departments
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#162a17] p-5">
            <div className="flex items-center justify-between text-xs text-[#9aa39a]">
              <span>Detected Threats (24h)</span>
              <Warning className="h-4 w-4 text-[#ffb2af]" />
            </div>
            <p className="mt-2 font-mono-code text-3xl font-semibold tracking-tight text-white">
              {threats24h}
            </p>
            <p className="mt-1 text-xs text-[#ffb2af]">
              {threatsDelta > 0
                ? `+${threatsDelta} vs. prior day`
                : threatsDelta < 0
                  ? `${threatsDelta} vs. prior day`
                  : "Same as prior day"}
            </p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#162a17] p-5">
            <div className="flex items-center justify-between text-xs text-[#9aa39a]">
              <span>High-Risk &amp; Critical Users</span>
              <Shield className="h-4 w-4 text-[#f6cd7a]" />
            </div>
            <p className="mt-2 font-mono-code text-3xl font-semibold tracking-tight text-white">
              {highRiskCount}
            </p>
            <p className="mt-1 text-xs text-[#9aa39a]">Score 60+ requiring analyst review</p>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#162a17] p-5">
            <div className="flex items-center justify-between text-xs text-[#9aa39a]">
              <span>Ensemble AUC (measured)</span>
              <Brain className="h-4 w-4 text-[#c6f19d]" />
            </div>
            <p className="mt-2 font-mono-code text-3xl font-semibold tracking-tight text-[#c6f19d]">
              {ensembleMetric
                ? ensembleMetric.auc === null
                  ? "—"
                  : ensembleMetric.auc.toFixed(3)
                : "—"}
            </p>
            <p className="mt-1 text-xs text-[#9aa39a]">
              {ensembleMetric
                ? `${ensembleMetric.detectionRate}% detection · ${ensembleMetric.falsePositiveRate}% FPR`
                : "Measured on the loaded corpus"}
            </p>
          </div>
        </div>

        {/* Tab 1: Overview */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            {/* Charts Row */}
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
              <div className="rounded-xl border border-white/10 bg-[#162a17] p-5 sm:p-6 xl:col-span-8">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-medium text-white">
                      Anomaly Detection by Behavioral Channel (14 Days)
                    </h2>
                    <p className="text-xs text-[#9aa39a]">
                      Flagged sessions segmented across login, file access, email, and USB telemetry
                    </p>
                  </div>
                  <span className="font-mono-code text-xs text-[#c6f19d]">
                    Flag threshold: risk 60
                  </span>
                </div>
                <div className="mt-4 h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={telemetry}
                      margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
                    >
                      <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                      <XAxis
                        dataKey="day"
                        tick={{ fill: "#9aa39a", fontSize: 11 }}
                        axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fill: "#9aa39a", fontSize: 11, fontFamily: "JetBrains Mono" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f1f10",
                          borderColor: "rgba(255,255,255,0.15)",
                          borderRadius: "8px",
                          fontSize: "12px",
                          color: "#ffffff",
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: "12px" }} />
                      <Bar dataKey="loginFlags" stackId="a" name="Login" fill="#c6f19d" />
                      <Bar dataKey="fileFlags" stackId="a" name="File Access" fill="#79b8ff" />
                      <Bar dataKey="emailFlags" stackId="a" name="Email" fill="#f6cd7a" />
                      <Bar
                        dataKey="usbFlags"
                        stackId="a"
                        name="USB"
                        fill="#ef6461"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#162a17] p-5 sm:p-6 xl:col-span-4">
                <div>
                  <h2 className="text-base font-medium text-white">Overall Risk Distribution</h2>
                  <p className="text-xs text-[#9aa39a]">
                    Population breakdown across {users.length} monitored users
                  </p>
                </div>
                <div className="mt-2 h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distribution}
                        dataKey="count"
                        nameKey="bucket"
                        innerRadius={48}
                        outerRadius={76}
                        paddingAngle={3}
                      >
                        {distribution.map((entry) => (
                          <Cell key={entry.bucket} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#0f1f10",
                          borderColor: "rgba(255,255,255,0.15)",
                          borderRadius: "8px",
                          fontSize: "12px",
                          color: "#ffffff",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-1.5 border-t border-white/10 pt-3">
                  {distribution.map((d) => (
                    <div key={d.bucket} className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-2 text-[#9aa39a]">
                        <span
                          className="h-2.5 w-2.5 rounded-sm"
                          style={{ backgroundColor: d.fill }}
                        />
                        {d.bucket}
                      </span>
                      <span className="font-mono-code text-white">{d.count.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Suspicious User Activity Table */}
            <div className="rounded-xl border border-white/10 bg-[#162a17] p-5 sm:p-6">
              <div className="flex flex-col gap-4 border-b border-white/10 pb-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-base font-medium text-white">
                    Suspicious User Activity Table
                  </h2>
                  <p className="text-xs text-[#9aa39a]">
                    Click any row to open full SHAP feature attribution and behavioral timelines
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <div className="relative">
                    <MagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#9aa39a]" />
                    <input
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search user, host, trigger..."
                      aria-label="Search monitored users"
                      className="h-9 w-56 rounded-lg border border-white/15 bg-[#0f1f10] pl-8 pr-3 text-xs text-white placeholder-[#9aa39a] focus:border-[#c6f19d] focus:outline-none"
                    />
                  </div>
                  <select
                    value={threatFilter}
                    onChange={(e) => setThreatFilter(e.target.value as ThreatLevel | "All")}
                    aria-label="Filter by threat level"
                    className="h-9 rounded-lg border border-white/15 bg-[#0f1f10] px-3 text-xs text-white focus:border-[#c6f19d] focus:outline-none"
                  >
                    <option value="All">All Threat Levels</option>
                    <option value="Critical">Critical</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as AlertStatus | "All")}
                    aria-label="Filter by status"
                    className="h-9 rounded-lg border border-white/15 bg-[#0f1f10] px-3 text-xs text-white focus:border-[#c6f19d] focus:outline-none"
                  >
                    <option value="All">All Statuses</option>
                    <option value="Flagged">Flagged</option>
                    <option value="Investigating">Investigating</option>
                    <option value="Escalated">Escalated</option>
                    <option value="Cleared">Cleared</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/10 text-xs text-[#9aa39a]">
                      <th className="pb-3 font-medium">User</th>
                      <th className="pb-3 font-medium">Department / Host</th>
                      <th className="pb-3 font-medium">
                        <button
                          type="button"
                          onClick={() => setSortDesc((s) => !s)}
                          className="inline-flex items-center gap-1 hover:text-white"
                        >
                          Risk Score
                          <ArrowsDownUp className="h-3 w-3" />
                        </button>
                      </th>
                      <th className="pb-3 font-medium">Threat Level</th>
                      <th className="pb-3 font-medium">SHAP Trigger Summary</th>
                      <th className="pb-3 font-medium">Status</th>
                      <th className="pb-3 text-right font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/10">
                    {filteredUsers.map((u) => (
                      <tr
                        key={u.id}
                        onClick={() => inspectUser(u.id)}
                        className="cursor-pointer transition hover:bg-white/[0.03]"
                      >
                        <td className="py-3.5 pr-3">
                          <div className="flex items-center gap-3">
                            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#0f1f10] font-mono-code text-xs text-[#c6f19d]">
                              {u.initials}
                            </span>
                            <div>
                              <p className="font-medium text-white">{u.name}</p>
                              <p className="font-mono-code text-[11px] text-[#9aa39a]">
                                {u.certId}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 pr-3">
                          <p className="text-white">{u.department}</p>
                          <p className="font-mono-code text-xs text-[#9aa39a]">{u.hostId}</p>
                        </td>
                        <td className="py-3.5 pr-3">
                          <div className="flex items-center gap-2.5">
                            <span className="w-7 font-mono-code text-sm font-semibold text-white">
                              {u.riskScore}
                            </span>
                            <div className="h-1.5 w-16 overflow-hidden rounded-full bg-[#0f1f10]">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${u.riskScore}%`,
                                  backgroundColor:
                                    u.riskScore >= 85
                                      ? "#ef6461"
                                      : u.riskScore >= 70
                                      ? "#d9a441"
                                      : "#c6f19d",
                                }}
                              />
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 pr-3">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              u.threatLevel === "Critical"
                                ? "bg-[#ef6461]/20 text-[#ffb2af]"
                                : u.threatLevel === "High"
                                ? "bg-[#d9a441]/20 text-[#f6cd7a]"
                                : u.threatLevel === "Medium"
                                ? "bg-[#c6f19d]/15 text-[#c6f19d]"
                                : "bg-white/10 text-[#9aa39a]"
                            }`}
                          >
                            {u.threatLevel}
                          </span>
                        </td>
                        <td className="max-w-xs py-3.5 pr-3 text-xs text-[#9aa39a]">
                          <span className="line-clamp-2">{u.primaryTrigger}</span>
                        </td>
                        <td className="py-3.5 pr-3">
                          <span className="rounded-md border border-white/10 bg-[#0f1f10] px-2 py-1 text-xs text-white">
                            {u.status}
                          </span>
                        </td>
                        <td className="py-3.5 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              inspectUser(u.id);
                            }}
                            className="rounded-md bg-[#c6f19d]/15 px-2.5 py-1 text-xs font-medium text-[#c6f19d] transition hover:bg-[#c6f19d] hover:text-[#0f1f10]"
                          >
                            Explain
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Inline Preview of Selected User SHAP Breakdown */}
            <ShapInspector user={selectedUser} onStatusChange={handleUpdateStatus} />
          </div>
        )}

        {/* Tab 2: SHAP & Individual User Behavior */}
        {activeTab === "shap" && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-white/10 bg-[#162a17] p-4">
              <span className="mr-2 text-xs font-medium text-[#9aa39a]">Inspect account:</span>
              {users.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setSelectedUserId(u.id)}
                  className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    u.id === selectedUser.id
                      ? "bg-[#c6f19d] text-[#0f1f10]"
                      : "border border-white/10 bg-[#0f1f10] text-white/80 hover:border-white/25"
                  }`}
                >
                  <span>{u.name}</span>
                  <span className="font-mono-code opacity-80">{u.riskScore}</span>
                </button>
              ))}
            </div>
            <ShapInspector user={selectedUser} onStatusChange={handleUpdateStatus} />
          </div>
        )}

        {/* Tab 3: Alert Management */}
        {activeTab === "alerts" && (
          <AlertTriagePanel
            users={users}
            selectedUserId={selectedUserId}
            onSelectUser={setSelectedUserId}
            onUpdateStatus={handleUpdateStatus}
            onUpdateNotes={handleUpdateNotes}
            onRecordAction={handleRecordAction}
            actionError={actionError}
          />
        )}

        {/* Tab 4: CERT Benchmarks */}
        {activeTab === "cert" && <CertBenchmarkPanel />}
      </div>
    </div>
  );
}
