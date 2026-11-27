"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  CheckCircle,
  Clock,
  Envelope,
  FileText,
  HardDrive,
  ShieldWarning,
  SignIn,
  Warning,
} from "@phosphor-icons/react";
import type { BehaviorChannel, MonitoredUser } from "@/data/risksage";

interface ShapInspectorProps {
  user: MonitoredUser;
  onStatusChange?: (userId: string, nextStatus: MonitoredUser["status"]) => void;
}

function channelIcon(channel: BehaviorChannel) {
  switch (channel) {
    case "Login":
      return <SignIn className="h-3.5 w-3.5" />;
    case "File Access":
      return <FileText className="h-3.5 w-3.5" />;
    case "Email":
      return <Envelope className="h-3.5 w-3.5" />;
    case "USB":
      return <HardDrive className="h-3.5 w-3.5" />;
  }
}

export function ShapInspector({ user, onStatusChange }: ShapInspectorProps) {
  const shapData = user.shapFactors.map((f) => ({
    name: f.feature,
    contribution: Number(f.contribution.toFixed(2)),
    observed: f.observed,
    baseline: f.baseline,
    channel: f.channel,
  }));
  const shapMin = Math.min(0, ...shapData.map((d) => d.contribution));
  const shapMax = Math.max(0.1, ...shapData.map((d) => d.contribution));
  const shapDomain: [number, number] = [
    Math.floor(shapMin * 10) / 10 - 0.05,
    Math.ceil(shapMax * 10) / 10 + 0.05,
  ];

  return (
    <div className="space-y-6">
      {/* User Header & Plain-English SHAP Summary */}
      <div className="rounded-xl border border-white/10 bg-[#162a17] p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-[#c6f19d]/30 bg-[#0f1f10] font-mono-code text-sm font-medium text-[#c6f19d]">
              {user.initials}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h2 className="text-xl font-medium tracking-tight text-white">{user.name}</h2>
                <span className="rounded-md border border-white/10 bg-[#0f1f10] px-2 py-0.5 font-mono-code text-xs text-[#9aa39a]">
                  {user.certId}
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    user.threatLevel === "Critical"
                      ? "bg-[#ef6461]/20 text-[#ffb2af]"
                      : user.threatLevel === "High"
                      ? "bg-[#d9a441]/20 text-[#f6cd7a]"
                      : user.threatLevel === "Medium"
                      ? "bg-[#c6f19d]/15 text-[#c6f19d]"
                      : "bg-white/10 text-[#9aa39a]"
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {user.threatLevel} · Score {user.riskScore}/100
                </span>
              </div>
              <p className="mt-1 text-sm text-[#9aa39a]">
                {user.role} · {user.department} · Host{" "}
                <span className="font-mono-code text-white/80">{user.hostId}</span> · Active{" "}
                {user.lastActivity}
              </p>
            </div>
          </div>

          {onStatusChange && (
            <div className="flex flex-wrap items-center gap-2">
              {(["Flagged", "Investigating", "Escalated", "Cleared"] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => onStatusChange(user.id, st)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                    user.status === st
                      ? "bg-[#c6f19d] text-[#0f1f10]"
                      : "border border-white/10 bg-[#0f1f10] text-[#9aa39a] hover:border-white/25 hover:text-white"
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mt-5 rounded-lg border border-[#c6f19d]/20 bg-[#0f1f10]/80 p-4">
          <div className="flex items-start gap-3">
            <ShieldWarning className="mt-0.5 h-4 w-4 shrink-0 text-[#c6f19d]" />
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#c6f19d]">
                SHAP Plain-Language Explanation
              </p>
              <p className="mt-1 text-sm leading-relaxed text-white/90">
                {user.explanationSummary}
              </p>
            </div>
          </div>
        </div>

        {/* Ensemble Model Sub-scores */}
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Isolation Forest", value: user.models.isolationForest, note: "Point outlier" },
            { label: "Autoencoder", value: user.models.autoencoder, note: "Reconstruction" },
            { label: "LSTM Sequence", value: user.models.lstm, note: "Temporal drift" },
            { label: "Ensemble Fusion", value: user.models.ensemble, note: "Weighted output", highlight: true },
          ].map((m) => (
            <div
              key={m.label}
              className={`rounded-lg border p-3.5 ${
                m.highlight
                  ? "border-[#c6f19d]/40 bg-[#c6f19d]/10"
                  : "border-white/10 bg-[#0f1f10]/60"
              }`}
            >
              <p className="text-xs text-[#9aa39a]">{m.label}</p>
              <p className="mt-1 font-mono-code text-xl font-semibold text-white">
                {m.value.toFixed(2)}
              </p>
              <p className="mt-0.5 text-[11px] text-[#9aa39a]">{m.note}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SHAP Feature Contributions + Behavioral Channel Deviation */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="rounded-xl border border-white/10 bg-[#162a17] p-5 sm:p-6 xl:col-span-7">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-medium text-white">SHAP Feature Attributions</h3>
              <p className="text-xs text-[#9aa39a]">
                Base expected risk <span className="font-mono-code text-white">{user.shapBaseValue.toFixed(2)}</span> → Final
                ensemble <span className="font-mono-code text-[#c6f19d]">{user.models.ensemble.toFixed(2)}</span>
              </p>
            </div>
            <span className="rounded-md border border-white/10 bg-[#0f1f10] px-2.5 py-1 font-mono-code text-xs text-[#9aa39a]">
              Shapley Additive Values
            </span>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={shapData}
                layout="vertical"
                margin={{ top: 8, right: 24, left: 10, bottom: 8 }}
              >
                <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                <XAxis
                  type="number"
                  domain={shapDomain}
                  tick={{ fill: "#9aa39a", fontSize: 11, fontFamily: "JetBrains Mono" }}
                  axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={185}
                  tick={{ fill: "#e6ebe6", fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <ReferenceLine x={0} stroke="rgba(255,255,255,0.25)" />
                <Tooltip
                  cursor={{ fill: "rgba(255,255,255,0.04)" }}
                  contentStyle={{
                    backgroundColor: "#0f1f10",
                    borderColor: "rgba(255,255,255,0.15)",
                    borderRadius: "8px",
                    fontSize: "12px",
                    color: "#ffffff",
                  }}
                  formatter={(value: number) => [
                    value > 0 ? `+${value.toFixed(2)} risk` : `${value.toFixed(2)} risk`,
                    "SHAP impact",
                  ]}
                />
                <Bar dataKey="contribution" radius={[0, 4, 4, 0]}>
                  {shapData.map((entry) => (
                    <Cell
                      key={entry.name}
                      fill={
                        entry.contribution >= 0.25
                          ? "#ef6461"
                          : entry.contribution > 0
                          ? "#c6f19d"
                          : "#6b9963"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 divide-y divide-white/10 border-t border-white/10">
            {user.shapFactors.map((factor) => (
              <div
                key={factor.feature}
                className="flex flex-col gap-1 py-2.5 text-xs sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-2 text-white">
                  <span className="text-[#c6f19d]">{channelIcon(factor.channel)}</span>
                  <span className="font-medium">{factor.feature}</span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[#9aa39a]">
                  <span>
                    Observed: <strong className="font-normal text-white">{factor.observed}</strong>
                  </span>
                  <span>Baseline: {factor.baseline}</span>
                  <span
                    className={`font-mono-code font-medium ${
                      factor.contribution > 0 ? "text-[#ffb2af]" : "text-[#c6f19d]"
                    }`}
                  >
                    {factor.contribution > 0
                      ? `+${factor.contribution.toFixed(2)}`
                      : factor.contribution.toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Baseline vs Observed Channel Deviation */}
        <div className="rounded-xl border border-white/10 bg-[#162a17] p-5 sm:p-6 xl:col-span-5">
          <div>
            <h3 className="text-base font-medium text-white">Channel Deviation vs. Baseline</h3>
            <p className="text-xs text-[#9aa39a]">
              Value as a share of the benign 99th percentile (100 = at or above it)
            </p>
          </div>

          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={user.channelDeviation}
                margin={{ top: 10, right: 12, left: -16, bottom: 8 }}
              >
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="channel"
                  tick={{ fill: "#9aa39a", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
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
                <Bar dataKey="baseline" name="90d Baseline" fill="#325035" radius={[4, 4, 0, 0]} />
                <Bar dataKey="observed" name="Observed 24h" fill="#c6f19d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 rounded-lg border border-white/10 bg-[#0f1f10]/60 p-3.5">
            <p className="text-xs font-medium text-[#9aa39a]">Analyst Notes</p>
            <p className="mt-1 text-sm text-white/90">{user.analystNotes}</p>
          </div>
        </div>
      </div>

      {/* 14-day Trajectory + Chronological Event Timeline */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="rounded-xl border border-white/10 bg-[#162a17] p-5 sm:p-6 xl:col-span-6">
          <div>
            <h3 className="text-base font-medium text-white">14-Day Risk Score &amp; Drift Trajectory</h3>
            <p className="text-xs text-[#9aa39a]">
              Tracks gradual LSTM sequence escalation alongside daily risk score
            </p>
          </div>
          <div className="mt-4 h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={user.history14d}
                margin={{ top: 10, right: 12, left: -16, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="riskFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#c6f19d" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#c6f19d" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="day"
                  tick={{ fill: "#9aa39a", fontSize: 11 }}
                  axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
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
                <Area
                  type="monotone"
                  dataKey="riskScore"
                  name="Risk Score"
                  stroke="#c6f19d"
                  strokeWidth={2}
                  fill="url(#riskFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#162a17] p-5 sm:p-6 xl:col-span-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium text-white">Activity Timeline</h3>
              <p className="text-xs text-[#9aa39a]">Correlated host events ordered by timestamp</p>
            </div>
            <Clock className="h-4 w-4 text-[#9aa39a]" />
          </div>

          <ol className="mt-4 space-y-3">
            {user.timeline.map((ev) => (
              <li
                key={ev.id}
                className="rounded-lg border border-white/10 bg-[#0f1f10]/70 p-3.5 transition hover:border-white/20"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono-code text-xs text-[#c6f19d]">{ev.timestamp}</span>
                    <span className="inline-flex items-center gap-1 rounded bg-white/5 px-2 py-0.5 text-[11px] text-white/80">
                      {channelIcon(ev.channel)}
                      {ev.channel}
                    </span>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                      ev.severity === "Critical"
                        ? "bg-[#ef6461]/20 text-[#ffb2af]"
                        : ev.severity === "High"
                        ? "bg-[#d9a441]/20 text-[#f6cd7a]"
                        : ev.severity === "Medium"
                        ? "bg-[#c6f19d]/15 text-[#c6f19d]"
                        : "bg-white/10 text-[#9aa39a]"
                    }`}
                  >
                    {ev.severity === "Normal" ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <Warning className="h-3 w-3" />
                    )}
                    {ev.severity}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-medium text-white">{ev.action}</p>
                <p className="mt-0.5 font-mono-code text-xs text-[#9aa39a] break-all">{ev.target}</p>
                <p className="mt-1 text-xs text-[#9aa39a]">{ev.detail}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}
