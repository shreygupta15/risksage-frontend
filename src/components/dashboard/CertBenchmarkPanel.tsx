"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Cpu, Pulse } from "@phosphor-icons/react";
import {
  getEvaluation,
  getStats,
  type ApiEvaluation,
  type ApiStats,
} from "@/lib/api";

const MODEL_STYLE: Record<string, { label: string; color: string; dash?: string }> = {
  ensemble: { label: "RiskSage Ensemble", color: "#c6f19d" },
  lstm: { label: "LSTM Sequence", color: "#79b8ff" },
  autoencoder: { label: "Autoencoder", color: "#f6cd7a" },
  isolation_forest: { label: "Isolation Forest", color: "#9aa39a", dash: "4 4" },
};

export function CertBenchmarkPanel() {
  const [evaluation, setEvaluation] = useState<ApiEvaluation | null>(null);
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([getEvaluation(), getStats()])
      .then(([ev, st]) => {
        if (!cancelled) {
          setEvaluation(ev);
          setStats(st);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Could not reach the API");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#162a17] p-6 text-sm text-[#9aa39a]">
        Could not load evaluation data: {error}
      </div>
    );
  }
  if (!evaluation || !stats) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#162a17] p-6 text-sm text-[#9aa39a]">
        Loading evaluation data…
      </div>
    );
  }
  if (!evaluation.hasLabels || !evaluation.models || !evaluation.rocCurves) {
    return (
      <div className="rounded-xl border border-white/10 bg-[#162a17] p-6">
        <h2 className="text-lg font-medium text-white">Model Evaluation</h2>
        <p className="mt-2 text-sm text-[#9aa39a]">
          {evaluation.note ??
            "No labelled attack days in this data, so detection rates cannot be measured."}
        </p>
      </div>
    );
  }

  const metrics = evaluation.models;
  const ensemble = metrics[0];
  const corpus = evaluation.corpus!;
  const comparisonBarData = metrics.map((m) => ({
    model: m.model.replace("RiskSage ", ""),
    detectionRate: m.detectionRate,
    aucPct: m.auc === null ? 0 : Number((m.auc * 100).toFixed(1)),
    fpr: m.falsePositiveRate,
  }));
  const topics = [
    { topic: "cert.auth.logon", count: stats.eventCounts.logon ?? 0 },
    { topic: "cert.file.access", count: stats.eventCounts.file ?? 0 },
    { topic: "cert.email.outbound", count: stats.eventCounts.email ?? 0 },
    { topic: "cert.device.usb", count: stats.eventCounts.device ?? 0 },
    { topic: "cert.http", count: stats.eventCounts.http ?? 0 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-[#162a17] p-5 sm:p-6">
        <div>
          <h2 className="text-lg font-medium text-white">
            Model Evaluation on the Loaded Corpus
          </h2>
          <p className="mt-1 text-sm text-[#9aa39a]">
            Measured on {corpus.users} users over {corpus.days} days (
            {corpus.rows.toLocaleString()} user-days, {corpus.maliciousDays}{" "}
            labelled attack days). The ensemble is judged at risk 60; each
            single model at its own benign 99th-percentile threshold. This is
            a synthetic CERT-format corpus, not the real CERT r5.2 or r6.2
            dataset.
          </p>
        </div>
      </div>

      {/* Charts: ROC Curve + Detection/AUC Bar Chart */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="rounded-xl border border-white/10 bg-[#162a17] p-5 sm:p-6 xl:col-span-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-medium text-white">ROC Curve Comparison</h3>
              <p className="text-xs text-[#9aa39a]">
                True Positive Rate (%) vs. False Positive Rate (%)
              </p>
            </div>
            <span className="font-mono-code text-xs text-[#c6f19d]">
              Ensemble AUC {ensemble.auc === null ? "—" : ensemble.auc.toFixed(3)}
            </span>
          </div>
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={evaluation.rocCurves} margin={{ top: 10, right: 16, left: -12, bottom: 4 }}>
                <CartesianGrid stroke="rgba(255,255,255,0.06)" />
                <XAxis
                  dataKey="fpr"
                  tickFormatter={(v) => `${v}%`}
                  tick={{ fill: "#9aa39a", fontSize: 11, fontFamily: "JetBrains Mono" }}
                  axisLine={{ stroke: "rgba(255,255,255,0.12)" }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tickFormatter={(v) => `${v}%`}
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
                {Object.entries(MODEL_STYLE).map(([key, s]) => (
                  <Line
                    key={key}
                    type="monotone"
                    dataKey={key}
                    name={s.label}
                    stroke={s.color}
                    strokeWidth={key === "ensemble" ? 2.5 : 2}
                    strokeDasharray={s.dash}
                    dot={key === "ensemble" ? { r: 3 } : false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#162a17] p-5 sm:p-6 xl:col-span-6">
          <div>
            <h3 className="text-base font-medium text-white">Detection Rate &amp; AUC by Model</h3>
            <p className="text-xs text-[#9aa39a]">
              Ensemble improves recall while suppressing false alarms to {ensemble.falsePositiveRate}%
            </p>
          </div>
          <div className="mt-4 h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonBarData}
                margin={{ top: 10, right: 16, left: -12, bottom: 4 }}
              >
                <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                <XAxis
                  dataKey="model"
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
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Bar dataKey="aucPct" name="AUC (%)" fill="#c6f19d" radius={[4, 4, 0, 0]} />
                <Bar
                  dataKey="detectionRate"
                  name="Detection Rate (%)"
                  fill="#6b9963"
                  radius={[4, 4, 0, 0]}
                />
                <Bar dataKey="fpr" name="False Positive (%)" fill="#ef6461" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Metrics Table + Event Ingestion */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        <div className="overflow-x-auto rounded-xl border border-white/10 bg-[#162a17] p-5 sm:p-6 xl:col-span-7">
          <div className="flex items-center justify-between pb-4">
            <h3 className="text-base font-medium text-white">Model Evaluation Table</h3>
            <Cpu className="h-4 w-4 text-[#c6f19d]" />
          </div>
          <table className="w-full min-w-[540px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs text-[#9aa39a]">
                <th className="pb-3 font-medium">Model</th>
                <th className="pb-3 font-medium">AUC</th>
                <th className="pb-3 font-medium">Detection Rate</th>
                <th className="pb-3 font-medium">FPR</th>
                <th className="pb-3 font-medium">F1</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {metrics.map((m, idx) => (
                <tr key={m.model} className={idx === 0 ? "bg-[#c6f19d]/5" : ""}>
                  <td className="py-3 pr-4">
                    <p className="font-medium text-white">{m.model}</p>
                    <p className="text-xs text-[#9aa39a]">{m.focus}</p>
                  </td>
                  <td className="py-3 font-mono-code text-white">
                    {m.auc === null ? "—" : m.auc.toFixed(3)}
                  </td>
                  <td className="py-3 font-mono-code text-[#c6f19d]">
                    {m.detectionRate.toFixed(1)}%
                  </td>
                  <td className="py-3 font-mono-code text-white">
                    {m.falsePositiveRate.toFixed(1)}%
                  </td>
                  <td className="py-3 font-mono-code text-white">{m.f1Score.toFixed(3)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-[#9aa39a]">
            Scoring takes {evaluation.scoringLatencyMsPerDay} ms per user-day,
            timed on the machine the API runs on.
          </p>
        </div>

        <div className="rounded-xl border border-white/10 bg-[#162a17] p-5 sm:p-6 xl:col-span-5">
          <div className="flex items-center justify-between pb-4">
            <div>
              <h3 className="text-base font-medium text-white">Event Ingestion</h3>
              <p className="text-xs text-[#9aa39a]">
                Raw events in the loaded corpus, by log kind
              </p>
            </div>
            <Pulse className="h-4 w-4 text-[#c6f19d]" />
          </div>
          <div className="space-y-3">
            {topics.map((t) => (
              <div
                key={t.topic}
                className="flex items-center justify-between rounded-lg border border-white/10 bg-[#0f1f10]/70 px-4 py-3"
              >
                <div>
                  <p className="font-mono-code text-xs font-medium text-white">{t.topic}</p>
                  <p className="mt-0.5 text-xs text-[#9aa39a]">Events in corpus</p>
                </div>
                <div className="text-right">
                  <p className="font-mono-code text-xs text-[#c6f19d]">
                    {t.count.toLocaleString()}
                  </p>
                </div>
              </div>
            ))}
            <p className="text-xs text-[#9aa39a]">
              {stats.eventCounts.total.toLocaleString()} events in total. The
              live stream replays events from this corpus; with a Kafka broker
              configured it reads from the broker instead.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
