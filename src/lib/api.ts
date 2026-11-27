import type {
  AlertStatus,
  BehaviorChannel,
  MonitoredUser,
  ThreatLevel,
} from "@/data/risksage";

const BASE =
  process.env.NEXT_PUBLIC_RISKSAGE_API_URL ?? "http://127.0.0.1:8000";

export interface ApiUserSummary {
  alertId: string;
  userId: string;
  name: string;
  initials: string;
  email: string;
  department: string;
  role: string;
  hostId: string;
  riskScore: number;
  threatLevel: ThreatLevel;
  status: "Active" | "Watch" | "Normal";
  lastActive: string;
}

export interface ApiShapFactor {
  feature: string;
  name: string;
  contribution: number;
  share: number;
  value: string;
  baseline: string;
}

export interface ApiAlert {
  id: string;
  userId: string;
  day: string;
  severity: ThreatLevel;
  title: string;
  detail: string;
  target: string;
  riskScore: number;
  shapFactors: ApiShapFactor[];
}

export interface ApiUserDetail extends ApiUserSummary {
  history14d: {
    day: string;
    riskScore: number;
    fileVolumeMb: number;
    baselineMb: number;
    afterHoursLogins: number;
    usbEvents: number;
    externalEmails: number;
  }[];
  shapFactors: ApiShapFactor[];
  shapBaseValue: number;
  models: {
    isolationForest: number;
    autoencoder: number;
    lstm: number;
    ensemble: number;
  };
  channelDeviation: { channel: string; baseline: number; observed: number }[];
  alerts: ApiAlert[];
}

export interface ApiStats {
  totalUsers: number;
  usersAtRisk: number;
  criticalCount: number;
  alertsTotal: number;
  avgRisk: number;
  alertsByDay: Record<string, number>;
  topFeatures: { feature: string; ratio: number }[];
  eventCounts: Record<string, number>;
  scoringLatencyMsPerDay: number;
}

export interface ApiEvaluation {
  hasLabels: boolean;
  corpus?: { users: number; days: number; rows: number; maliciousDays: number };
  threshold?: number;
  models?: {
    key: string;
    model: string;
    focus: string;
    auc: number | null;
    detectionRate: number;
    falsePositiveRate: number;
    f1Score: number;
    precision: number;
    recall: number;
  }[];
  rocCurves?: Record<string, number>[];
  scoringLatencyMsPerDay?: number;
  note?: string;
}

async function getJson<T>(path: string): Promise<T> {
  const r = await fetch(`${BASE}${path}`);
  if (!r.ok) throw new Error(`RiskSage API ${path} returned ${r.status}`);
  return r.json() as Promise<T>;
}

export function getUsers() {
  return getJson<ApiUserSummary[]>("/api/users");
}
export function getUser(userId: string) {
  return getJson<ApiUserDetail>(`/api/users/${userId}`);
}
export function getAlerts(severity?: string) {
  const q = severity ? `?severity=${severity}` : "";
  return getJson<ApiAlert[]>(`/api/alerts${q}`);
}
export function getStats() {
  return getJson<ApiStats>("/api/stats");
}
export function getEvaluation() {
  return getJson<ApiEvaluation>("/api/evaluation");
}
export async function recordAction(userId: string, action: string, note = "") {
  const r = await fetch(`${BASE}/api/actions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, action, note }),
  });
  if (!r.ok) throw new Error("Action was not recorded");
  return r.json();
}

// -- adapter: API shapes -> the dashboard's MonitoredUser type --------

const CHANNEL_FOR_FEATURE: Record<string, BehaviorChannel> = {
  after_hours_logins: "Login",
  weekend_login: "Login",
  session_max_min: "Login",
  late_session_min: "Login",
  privilege_retries: "Login",
  unique_pcs: "Login",
  rare_domain_hits: "Login",
  file_volume_mb: "File Access",
  files_opened: "File Access",
  files_copied: "File Access",
  files_deleted: "File Access",
  large_attach_mb: "File Access",
  email_count: "Email",
  external_emails: "Email",
  external_ratio: "Email",
  usb_events: "USB",
  unknown_usb: "USB",
};

const STATUS_MAP: Record<ApiUserSummary["status"], AlertStatus> = {
  Active: "Flagged",
  Watch: "Investigating",
  Normal: "Cleared",
};

function formatDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export function toMonitoredUser(d: ApiUserDetail): MonitoredUser {
  const topAlert = d.alerts[0];
  const dept = [
    "R&D",
    "IT",
    "Finance",
    "Legal",
    "Sales",
    "HR",
    "Operations",
    "Infrastructure",
    "Analytics",
    "Compliance",
  ].includes(d.department)
    ? (d.department as MonitoredUser["department"])
    : "IT";
  return {
    id: d.userId,
    certId: d.alertId,
    name: d.name,
    initials: d.initials,
    email: d.email,
    department: dept,
    role: d.role,
    hostId: d.hostId,
    riskScore: Math.round(d.riskScore),
    threatLevel: d.threatLevel,
    status: STATUS_MAP[d.status],
    lastActivity: d.lastActive ? formatDay(d.lastActive) : "no data",
    primaryTrigger: topAlert
      ? topAlert.detail
      : "No days scored 40 or above in the last 14 days.",
    explanationSummary: topAlert
      ? topAlert.detail
      : "No days scored 40 or above in the last 14 days. Behaviour sits within the normal range for this user.",
    models: d.models,
    shapBaseValue: d.shapBaseValue,
    shapFactors: d.shapFactors.map((f) => ({
      feature: f.feature,
      channel: CHANNEL_FOR_FEATURE[f.name] ?? "Login",
      observed: f.value,
      baseline: f.baseline,
      contribution: f.contribution,
    })),
    channelDeviation: d.channelDeviation,
    timeline: d.alerts.map((a) => ({
      id: a.id,
      timestamp: formatDay(a.day),
      channel: CHANNEL_FOR_FEATURE[a.shapFactors[0]?.name ?? ""] ?? "Login",
      action: a.title,
      target: a.target || a.day,
      severity: a.severity === "Low" ? "Normal" : a.severity,
      detail: a.detail,
    })),
    history14d: d.history14d.map((h) => ({
      day: h.day,
      riskScore: Math.round(h.riskScore),
      fileVolumeMb: h.fileVolumeMb,
      baselineMb: h.baselineMb,
      afterHoursLogins: h.afterHoursLogins,
      usbEvents: h.usbEvents,
      externalEmails: h.externalEmails,
    })),
    analystNotes: "No analyst notes yet.",
  };
}

// 14-day anomaly counts by channel, built from real alerts.
export function toTelemetry(alerts: ApiAlert[]) {
  const days: Record<string, { login: number; file: number; email: number; usb: number }> = {};
  const channelOf = (a: ApiAlert): "login" | "file" | "email" | "usb" => {
    const ch = CHANNEL_FOR_FEATURE[a.shapFactors[0]?.name ?? ""];
    if (ch === "Email") return "email";
    if (ch === "USB") return "usb";
    if (ch === "File Access") return "file";
    return "login";
  };
  for (const a of alerts) {
    const day = formatDay(a.day);
    days[day] ??= { login: 0, file: 0, email: 0, usb: 0 };
    days[day][channelOf(a)] += 1;
  }
  return Object.entries(days)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, c]) => ({
      day,
      loginFlags: c.login,
      fileFlags: c.file,
      emailFlags: c.email,
      usbFlags: c.usb,
    }));
}

const BUCKETS: { bucket: string; fill: string; match: ThreatLevel }[] = [
  { bucket: "Low (0-39)", fill: "#2f5732", match: "Low" },
  { bucket: "Medium (40-59)", fill: "#6b9963", match: "Medium" },
  { bucket: "High (60-79)", fill: "#d9a441", match: "High" },
  { bucket: "Critical (80-100)", fill: "#ef6461", match: "Critical" },
];

export function toRiskDistribution(users: MonitoredUser[]) {
  return BUCKETS.map((b) => ({
    bucket: b.bucket,
    count: users.filter((u) => u.threatLevel === b.match).length,
    fill: b.fill,
  }));
}
