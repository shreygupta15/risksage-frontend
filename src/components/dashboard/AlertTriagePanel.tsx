"use client";

import { useState } from "react";
import { Check, Lock, ShieldCheck, Usb, WarningOctagon } from "@phosphor-icons/react";
import type { AlertStatus, MonitoredUser } from "@/data/risksage";

interface AlertTriagePanelProps {
  users: MonitoredUser[];
  selectedUserId: string;
  onSelectUser: (id: string) => void;
  onUpdateStatus: (id: string, status: AlertStatus) => void;
  onUpdateNotes: (id: string, notes: string) => void;
  onRecordAction: (userId: string, action: string) => Promise<boolean>;
  actionError: string | null;
}

export function AlertTriagePanel({
  users,
  selectedUserId,
  onSelectUser,
  onUpdateStatus,
  onUpdateNotes,
  onRecordAction,
  actionError,
}: AlertTriagePanelProps) {
  const [statusFilter, setStatusFilter] = useState<AlertStatus | "All">("All");
  const [actionBanner, setActionBanner] = useState<string | null>(null);

  const flaggedQueue = users
    .filter((u) => (statusFilter === "All" ? u.riskScore >= 40 : u.status === statusFilter))
    .sort((a, b) => b.riskScore - a.riskScore);

  const activeUser =
    flaggedQueue.find((u) => u.id === selectedUserId) || flaggedQueue[0] || users[0];

  async function triggerContainment(label: string) {
    const ok = await onRecordAction(activeUser.id, label);
    if (!ok) return;
    setActionBanner(`${label} recorded for ${activeUser.name} (${activeUser.hostId}).`);
    if (activeUser.status === "Flagged") {
      onUpdateStatus(activeUser.id, "Investigating");
    }
  }

  return (
    <div className="space-y-6">
      {actionError && (
        <div className="rounded-xl border border-[#ef6461]/40 bg-[#ef6461]/10 px-4 py-3 text-sm text-[#ffb2af]">
          {actionError}
        </div>
      )}
      {actionBanner && (
        <div className="flex items-center justify-between rounded-xl border border-[#c6f19d]/40 bg-[#c6f19d]/10 px-4 py-3 text-sm text-[#c6f19d]">
          <span className="flex items-center gap-2">
            <Check className="h-4 w-4" />
            {actionBanner}
          </span>
          <button
            type="button"
            onClick={() => setActionBanner(null)}
            className="text-xs underline underline-offset-4 hover:text-white"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Prioritized Alert Queue */}
        <div className="rounded-xl border border-white/10 bg-[#162a17] p-5 lg:col-span-5">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4">
            <div>
              <h2 className="text-base font-medium text-white">Alert Triage Queue</h2>
              <p className="text-xs text-[#9aa39a]">Prioritized by ensemble risk score</p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {(["All", "Flagged", "Investigating", "Escalated", "Cleared"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setStatusFilter(f)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                    statusFilter === f
                      ? "bg-[#c6f19d] text-[#0f1f10]"
                      : "border border-white/10 bg-[#0f1f10] text-[#9aa39a] hover:text-white"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2.5">
            {flaggedQueue.length === 0 ? (
              <p className="rounded-lg border border-white/10 bg-[#0f1f10]/50 p-4 text-sm text-[#9aa39a]">
                No alerts match the selected filter.
              </p>
            ) : (
              flaggedQueue.map((u) => {
                const isSelected = activeUser.id === u.id;
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => onSelectUser(u.id)}
                    className={`w-full rounded-xl border p-4 text-left transition ${
                      isSelected
                        ? "border-[#c6f19d]/60 bg-[#0f1f10]"
                        : "border-white/10 bg-[#0f1f10]/50 hover:border-white/25"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#162a17] font-mono-code text-xs text-[#c6f19d]">
                          {u.initials}
                        </span>
                        <div>
                          <p className="text-sm font-medium text-white">{u.name}</p>
                          <p className="text-xs text-[#9aa39a]">
                            {u.department} · {u.hostId}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-mono-code text-sm font-semibold text-white">
                          {u.riskScore}
                        </span>
                        <span className="block text-[11px] text-[#9aa39a]">{u.status}</span>
                      </div>
                    </div>
                    <p className="mt-2.5 line-clamp-2 text-xs text-[#9aa39a]">
                      {u.primaryTrigger}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Active Investigation & Response Panel */}
        <div className="rounded-xl border border-white/10 bg-[#162a17] p-5 sm:p-6 lg:col-span-7">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <p className="font-mono-code text-xs text-[#c6f19d]">
                ACTIVE CASE · {activeUser.certId}
              </p>
              <h3 className="mt-1 text-xl font-medium text-white">
                {activeUser.name} ({activeUser.role})
              </h3>
              <p className="mt-0.5 text-sm text-[#9aa39a]">
                {activeUser.email} · Host {activeUser.hostId}
              </p>
            </div>
            <div className="text-right">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ef6461]/20 px-3 py-1 text-xs font-medium text-[#ffb2af]">
                <WarningOctagon className="h-3.5 w-3.5" />
                {activeUser.threatLevel} · {activeUser.riskScore}/100
              </span>
            </div>
          </div>

          <div className="mt-5 space-y-5">
            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#9aa39a]">
                Top SHAP Contributors
              </p>
              <div className="mt-2.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {activeUser.shapFactors.slice(0, 4).map((f) => (
                  <div
                    key={f.feature}
                    className="flex items-center justify-between rounded-lg border border-white/10 bg-[#0f1f10]/70 px-3.5 py-2.5 text-xs"
                  >
                    <span className="pr-2 text-white">{f.feature}</span>
                    <span
                      className={`shrink-0 font-mono-code font-semibold ${
                        f.contribution > 0 ? "text-[#ffb2af]" : "text-[#c6f19d]"
                      }`}
                    >
                      {f.contribution > 0
                        ? `+${f.contribution.toFixed(2)}`
                        : f.contribution.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wider text-[#9aa39a]">
                Update Investigation Status
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {(["Flagged", "Investigating", "Escalated", "Cleared"] as const).map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onUpdateStatus(activeUser.id, status)}
                    className={`rounded-lg px-3.5 py-2 text-xs font-medium transition ${
                      activeUser.status === status
                        ? "bg-[#c6f19d] text-[#0f1f10]"
                        : "border border-white/10 bg-[#0f1f10] text-[#9aa39a] hover:border-white/25 hover:text-white"
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                htmlFor="triage-notes"
                className="block text-xs font-medium uppercase tracking-wider text-[#9aa39a]"
              >
                Analyst Investigation Notes
              </label>
              <textarea
                id="triage-notes"
                rows={3}
                value={activeUser.analystNotes}
                onChange={(e) => onUpdateNotes(activeUser.id, e.target.value)}
                className="mt-2 w-full rounded-lg border border-white/15 bg-[#0f1f10] px-3.5 py-2.5 text-sm text-white placeholder-[#9aa39a] focus:border-[#c6f19d] focus:outline-none"
              />
            </div>

            <div className="border-t border-white/10 pt-4">
              <p className="text-xs font-medium uppercase tracking-wider text-[#9aa39a]">
                Response Actions
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => triggerContainment("Host session isolation")}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#0f1f10] px-3.5 py-2 text-xs font-medium text-white transition hover:border-[#c6f19d]"
                >
                  <Lock className="h-3.5 w-3.5 text-[#c6f19d]" />
                  Isolate Host
                </button>
                <button
                  type="button"
                  onClick={() => triggerContainment("USB mass storage block")}
                  className="inline-flex items-center gap-2 rounded-lg border border-white/15 bg-[#0f1f10] px-3.5 py-2 text-xs font-medium text-white transition hover:border-[#c6f19d]"
                >
                  <Usb className="h-3.5 w-3.5 text-[#c6f19d]" />
                  Revoke USB Policy
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateStatus(activeUser.id, "Escalated");
                    triggerContainment("SOC Tier-2 escalation");
                  }}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#c6f19d] px-3.5 py-2 text-xs font-medium text-[#0f1f10] transition hover:bg-[#d5f5b5]"
                >
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Escalate to SOC Tier 2
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
