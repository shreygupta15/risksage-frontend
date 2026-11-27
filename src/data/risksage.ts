export type ThreatLevel = "Critical" | "High" | "Medium" | "Low";
export type AlertStatus = "Flagged" | "Investigating" | "Escalated" | "Cleared";
export type BehaviorChannel = "Login" | "File Access" | "Email" | "USB";
export type Department =
  | "R&D"
  | "IT"
  | "Finance"
  | "Legal"
  | "Sales"
  | "HR"
  | "Operations"
  | "Infrastructure"
  | "Analytics"
  | "Compliance";

export interface ShapFactor {
  feature: string;
  channel: BehaviorChannel;
  observed: string;
  baseline: string;
  contribution: number; // positive increases risk, negative reduces risk
}

export interface TimelineEvent {
  id: string;
  timestamp: string;
  channel: BehaviorChannel;
  action: string;
  target: string;
  severity: "Critical" | "High" | "Medium" | "Normal";
  detail: string;
}

export interface DailyBehaviorPoint {
  day: string;
  riskScore: number;
  fileVolumeMb: number;
  baselineMb: number;
  afterHoursLogins: number;
  usbEvents: number;
  externalEmails: number;
}

export interface MonitoredUser {
  id: string;
  certId: string;
  name: string;
  initials: string;
  email: string;
  department: Department;
  role: string;
  hostId: string;
  riskScore: number; // 0-100
  threatLevel: ThreatLevel;
  status: AlertStatus;
  lastActivity: string;
  primaryTrigger: string;
  explanationSummary: string;
  models: {
    isolationForest: number;
    autoencoder: number;
    lstm: number;
    ensemble: number;
  };
  shapBaseValue: number;
  shapFactors: ShapFactor[];
  channelDeviation: {
    channel: string;
    baseline: number;
    observed: number;
  }[];
  timeline: TimelineEvent[];
  history14d: DailyBehaviorPoint[];
  analystNotes: string;
}

// Live data comes from the API (src/lib/api.ts). The mock users,
// benchmarks, and telemetry that used to live in this file are gone.
