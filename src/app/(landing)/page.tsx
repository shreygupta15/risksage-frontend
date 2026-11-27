"use client";

import { useEffect, useState } from "react";
import { ArrowRight, CaretDown } from "@phosphor-icons/react/dist/ssr";
import { ShaderArt } from "@/components/ui/shader-art";
import type { MonitoredUser } from "@/data/risksage";
import {
  getEvaluation,
  getUser,
  getUsers,
  toMonitoredUser,
  type ApiEvaluation,
} from "@/lib/api";

const DIAGRAM_TELEMETRY = JSON.stringify({
  layout: "fanin",
  alt: "Windows, Gmail, Google Drive, and Slack telemetry streams into Kafka and FastAPI for RiskSage scoring.",
  sources: [
    { label: "Kafka", icon: "kafka", sub: "Log streams" },
    { label: "Windows", icon: "windows", sub: "Logon & USB" },
    { label: "Google Drive", icon: "google-drive", sub: "File reads" },
    { label: "Gmail", icon: "gmail", sub: "Outbound mail" },
  ],
  target: { label: "FastAPI", icon: "fastapi" },
  then: { label: "PostgreSQL", icon: "postgres", meta: "Scored data" },
});

const STACK_ICONS = [
  { src: "/assets/icons/kafka.svg", alt: "Apache Kafka", cls: "ic ic-24 ic-tall ic-ink" },
  { src: "/assets/icons/fastapi.svg", alt: "FastAPI", cls: "ic ic-24" },
  { src: "/assets/icons/python.svg", alt: "Python", cls: "ic ic-24" },
  { src: "/assets/icons/postgres.svg", alt: "PostgreSQL", cls: "ic ic-24" },
  { src: "/assets/icons/react.svg", alt: "React", cls: "ic ic-24" },
  { src: "/assets/icons/docker.svg", alt: "Docker", cls: "ic ic-24 ic-land" },
];

function ArrowIcon() {
  return (
    <ArrowRight className="m-arrow inline-block" size={13} weight="bold" aria-hidden="true" />
  );
}

export default function LandingPage() {
  const [users, setUsers] = useState<MonitoredUser[]>([]);
  const [evaluation, setEvaluation] = useState<ApiEvaluation | null>(null);

  useEffect(() => {
    let cancelled = false;
    getUsers()
      .then((s) => Promise.all(s.map((x) => getUser(x.userId))))
      .then((d) => {
        if (!cancelled) setUsers(d.map(toMonitoredUser));
      })
      .catch(() => {});
    getEvaluation()
      .then((ev) => {
        if (!cancelled) setEvaluation(ev);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const leadUser = users[0];
  const heroRows = users.slice(0, 6);
  const workbenchRows = users;
  const ensemble = evaluation?.models?.[0];
  const activeCount = users.filter((u) => u.riskScore >= 40).length;
  const criticalCount = users.filter((u) => u.threatLevel === "Critical").length;
  const escalatedCount = users.filter((u) => u.status === "Escalated").length;
  const clearedCount = users.filter((u) => u.status === "Cleared").length;
  const loaded = users.length > 0;

  return (
    <>
      <header className="nav nav--centre">
        <div className="wrap nav__bar">
          <a className="skip-link" href="#top">
            Skip to content
          </a>
          <a className="nav__logo" href="#top">
            <span className="mark" data-mark="arc" aria-hidden="true" />
            RiskSage
          </a>
          <nav className="nav__links" aria-label="Main">
            <div className="nav__item">
              <a className="nav__link" href="#workbench">
                Platform{" "}
                <CaretDown className="chev inline-block" size={12} weight="bold" aria-hidden="true" />
              </a>
              <div className="nav__menu">
                <div className="wrap grid">
                  <div className="menu-col span-3">
                    <p className="t-label">Detection</p>
                    <a href="#workbench">
                      Analyst workbench<span>Ranked user risk and SHAP scores</span>
                    </a>
                    <a href="#signals">
                      Behavioral signals<span>Login, file, email, and USB logs</span>
                    </a>
                    <a href="#workflow">
                      Triage workflow<span>Inspect, trace, and escalate alerts</span>
                    </a>
                  </div>
                  <div className="menu-col span-3">
                    <p className="t-label">Evaluation</p>
                    <a href="#explainability">
                      SHAP attribution<span>Plain factors behind every score</span>
                    </a>
                    <a href="#benchmarks">
                      CERT benchmarks<span>Metrics on r5.2 and r6.2 datasets</span>
                    </a>
                  </div>
                  <a className="menu-card span-3 start-10" href="/dashboard">
                    <div
                      className="panel"
                      data-fx-palette='{"bg":"#d9ccb7","surface":"#e9e0d2","ink":"#2a2622","accent":"#a8794a"}'
                    >
                      <div className="stage stage--fade-br">
                        <div className="at-corner" style={{ ["--ax" as string]: "24px", ["--ay" as string]: "24px" }}>
                          <div className="ui ui-notify" data-ui="notify">
                            <ul className="ui-notify__list" data-notify-list="">
                              <li className="ui-note">
                                <span className="ui-agent ui-note__av" aria-hidden="true" />
                                <span className="ui-note__text">
                                  <span className="ui-note__title">
                                    {leadUser ? `${leadUser.name} flagged` : "…" }<time>{leadUser?.lastActivity ?? ""}</time>
                                  </span>
                                  <span className="ui-note__body">{leadUser?.primaryTrigger ?? "Loading live data…"}</span>
                                </span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                    <span className="t-card">Security dashboard</span>
                    <span className="t-small muted">Inspect active threats and SHAP factors</span>
                  </a>
                </div>
              </div>
            </div>
            <div className="nav__item">
              <a className="nav__link" href="#explainability">
                Explainability
              </a>
            </div>
            <div className="nav__item">
              <a className="nav__link" href="#benchmarks">
                Benchmarks
              </a>
            </div>
            <div className="nav__item">
              <a className="nav__link" href="#faq">
                Questions
              </a>
            </div>
          </nav>
          <div className="nav__actions">
            <a className="btn btn--primary" href="/dashboard">
              See dashboard
              <ArrowIcon />
            </a>
          </div>
          <button className="nav__toggle" type="button" aria-expanded="false" aria-label="Menu">
            <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
              <path d="M2 5h14M2 13h14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </header>

      <main id="top">
        {/* Hero: dealt collage with interactive WebGL ShaderArt */}
        <section className="hero hero--collage" data-enter="" aria-labelledby="hero-h">
          <ShaderArt
            className="hero-shader-backdrop"
            colors={{
              base: "#0f1f10",
              accent: "#c6f19d",
              ink: "#ffffff",
            }}
            speed={0.8}
            intensity={0.65}
            scale={1.2}
            interactive={true}
          />
          <div className="wrap">
            <div className="hero-text grid hero__grid">
              <div className="hero__text span-5">
                <h1 id="hero-h">Explainable insider threat detection</h1>
                <p className="hero__lead">
                  RiskSage scores login, file, email, and USB activity across Isolation Forest,
                  Autoencoder, and LSTM models, printing SHAP factors at{" "}
                  {ensemble ? (ensemble.auc === null ? "…" : ensemble.auc.toFixed(3)) : "…"} AUC on a synthetic CERT-format
                  corpus.
                </p>
                <div className="btn-row">
                  <a className="btn btn--primary" href="/dashboard">
                    See dashboard
                    <ArrowIcon />
                  </a>
                  <a className="btn btn--secondary" href="#benchmarks">
                    Compare models
                  </a>
                </div>
                <p className="hero__proof">
                  Evaluated on a synthetic CERT-format corpus, scored by a FastAPI backend.
                </p>
              </div>
              <div
                className="hero__art span-6 start-7"
                role="img"
                aria-label="RiskSage alert queue showing flagged users with SHAP explanations"
                data-fx="fluted-glass"
                data-fx-palette='{"bg":"#d9ccb7","surface":"#e9e0d2","ink":"#2a2622","accent":"#a8794a"}'
              >
                <div className="ly-piece ly-piece--main rs-win" aria-hidden="true">
                  <div className="rs-win__bar">
                    <span className="rs-win__dots">
                      <i />
                      <i />
                      <i />
                    </span>
                    <span>RiskSage · Insider Threat Queue</span>
                  </div>
                  <div className="rs-win__body">
                    <div className="rs-win__side">
                      <span className="is-on">Flagged users</span>
                      <span>SHAP trace</span>
                      <span>User timelines</span>
                      <span>Alert triage</span>
                      <span className="rs-win__side-label">Telemetry</span>
                      <span>Kafka stream</span>
                      <span>Live data</span>
                    </div>
                    <div className="rs-win__main">
                      <div className="rs-win__head">
                        <h4>Active anomalies</h4>
                        <span className="rs-win__badge">Live data · 3 models</span>
                      </div>
                      <div className="rs-win__rows">
                        {heroRows.map((u) => (
                          <div className="rs-win__row" key={u.id}>
                            <span className="rs-win__av">{u.initials}</span>
                            <div>
                              <b>{u.name}</b>
                              <small>{u.department} · {u.role}</small>
                            </div>
                            <span className="rs-win__score">{u.riskScore}</span>
                            <span
                              className={`rs-chip ${
                                u.threatLevel === "Critical"
                                  ? "rs-chip--crit"
                                  : u.threatLevel === "High"
                                  ? "rs-chip--high"
                                  : ""
                              }`}
                            >
                              {u.threatLevel}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="ly-piece ly-piece--note rs-note" aria-hidden="true" data-ly-steps="700">
                  <div className="rs-note__row">
                    <h5>SHAP factors · {leadUser?.name ?? "…"}</h5>
                    <span className="rs-note__tag" data-step="" data-step-at="4">
                      {leadUser ? `Score ${leadUser.riskScore}` : "Score …"}
                    </span>
                  </div>
                  {(leadUser?.shapFactors.slice(0, 3) ?? []).map((f) => (
                    <div className="rs-note__line" data-step="" key={f.feature}>
                      <span>{f.feature}</span>
                      <span className="rs-note__val">
                        {f.contribution > 0 ? `+${f.contribution.toFixed(2)}` : f.contribution.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 2: app-frame */}
        <section className="section" id="workbench" aria-labelledby="workbench-h">
          <div className="wrap">
            <div className="grid grid--top">
              <div className="span-5">
                <h2 id="workbench-h">RiskSage account queue and SHAP workbench</h2>
              </div>
              <div className="span-6 start-7 stack-4">
                <p className="t-lead">
                  Security analysts review the prioritized user queue on the left and inspect exact
                  feature attributions, model scores, and raw behavioral events on the right.
                </p>
                <p>
                  <a className="link" href="/dashboard">
                    See full dashboard
                  </a>
                </p>
              </div>
            </div>

            <div
              className="ui app fill"
              role="img"
              aria-label="RiskSage security workbench showing monitored employee accounts beside SHAP feature attributions and event timeline"
              data-ui-pause-host=""
            >
              <div className="app__pane app__pane--list">
                <div className="ui ui-panel ui-win" data-ui="window" data-open="Flagged" data-work="Investigating" data-done="Cleared">
                  <div className="ui-win__bar">
                    <span className="ui-dots" aria-hidden="true">
                      <i />
                      <i />
                      <i />
                    </span>
                    <span className="ui-win__crumb">
                      RiskSage <i>/</i> <b>Monitored accounts</b>
                    </span>
                    <span className="ui-spacer" />
                    <span className="ui-win__search" aria-hidden="true">
                      <svg className="ui-icon" viewBox="0 0 16 16">
                        <circle cx="7" cy="7" r="4.5" />
                        <path d="m10.5 10.5 3 3" />
                      </svg>
                      <span className="ui-win__ph">Filter</span>
                      <span className="ui-kbd">/</span>
                    </span>
                  </div>
                  <div className="ui-win__body">
                    <nav className="ui-win__side" aria-hidden="true">
                      <span className="ui-win__nav is-on">
                        Queue<em>{loaded ? activeCount : "…"}</em>
                      </span>
                      <span className="ui-win__nav">
                        Critical<em>{loaded ? criticalCount : "…"}</em>
                      </span>
                      <span className="ui-win__nav">
                        Escalated<em>{loaded ? escalatedCount : "…"}</em>
                      </span>
                      <span className="ui-win__nav">
                        Cleared<em>{loaded ? clearedCount : "…"}</em>
                      </span>
                      <span className="ui-win__label">Channels</span>
                      <span className="ui-win__nav">
                        <span className="ui-win__hash">#</span>Logon
                      </span>
                      <span className="ui-win__nav">
                        <span className="ui-win__hash">#</span>USB
                      </span>
                    </nav>
                    <div className="ui-win__main">
                      <div className="ui-win__cols" aria-hidden="true">
                        <span>User</span>
                        <span>Primary trigger</span>
                        <span>Status</span>
                        <span>Score</span>
                      </div>
                      <ul className="ui-win__rows">
                        {workbenchRows.map((u) => (
                          <li className="ui-win__row" data-row="" key={u.id}>
                            <span className="ui-avatar" data-tone={u.threatLevel === "Critical" ? "2" : "1"}>
                              {u.initials}
                            </span>
                            <span className="ui-win__who">{u.name}</span>
                            <span className="ui-win__sub">{u.primaryTrigger}</span>
                            <span
                              className={`ui-win__st ${
                                u.status === "Flagged" || u.status === "Escalated"
                                  ? "is-you"
                                  : u.status === "Cleared"
                                  ? "is-done"
                                  : ""
                              }`}
                              data-st=""
                            >
                              {u.status}
                            </span>
                            <span className="ui-win__age">{u.riskScore}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              <div className="app__pane app__pane--open">
                <div className="rs-shap-pane">
                  <div className="rs-shap-pane__top">
                    <div>
                      <h3 className="rs-shap-pane__title">
                        {leadUser?.name ?? "…"} · {leadUser?.certId ?? ""}
                      </h3>
                      <span className="rs-shap-pane__sub">
                        {leadUser
                          ? `${leadUser.department} · ${leadUser.hostId} · Base expected risk ${leadUser.shapBaseValue.toFixed(2)}`
                          : "Loading live data…"}
                      </span>
                    </div>
                    <span className="rs-win__badge">{leadUser ? `Ensemble ${leadUser.models.ensemble.toFixed(2)}` : "Ensemble …"}</span>
                  </div>

                  <div className="rs-shap-models">
                    <div className="rs-shap-model">
                      <span>Isolation Forest</span>
                      <strong>{leadUser ? leadUser.models.isolationForest.toFixed(2) : "…"}</strong>
                    </div>
                    <div className="rs-shap-model">
                      <span>Autoencoder</span>
                      <strong>{leadUser ? leadUser.models.autoencoder.toFixed(2) : "…"}</strong>
                    </div>
                    <div className="rs-shap-model">
                      <span>LSTM Sequence</span>
                      <strong>{leadUser ? leadUser.models.lstm.toFixed(2) : "…"}</strong>
                    </div>
                    <div className="rs-shap-model">
                      <span>Ensemble Output</span>
                      <strong>{leadUser ? leadUser.models.ensemble.toFixed(2) : "…"}</strong>
                    </div>
                  </div>

                  <div className="rs-shap-bars">
                    {(leadUser?.shapFactors ?? []).map((f) => {
                      const pct = Math.min(100, Math.round((Math.abs(f.contribution) / 0.35) * 100));
                      return (
                        <div className="rs-shap-row" key={f.feature}>
                          <span className="rs-shap-row__name">{f.feature}</span>
                          <span className="rs-shap-row__track">
                            <span
                              className={`rs-shap-row__fill ${
                                f.contribution < 0 ? "rs-shap-row__fill--neg" : ""
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </span>
                          <span className="rs-shap-row__val">
                            {f.contribution > 0 ? `+${f.contribution.toFixed(2)}` : f.contribution.toFixed(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="rs-shap-events">
                    {(leadUser?.timeline ?? []).map((ev) => (
                      <div className="rs-shap-ev" key={ev.id}>
                        <time>{ev.timestamp}</time>
                        <b>{ev.channel}</b>
                        <span>{ev.action} ({ev.target})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: word-highlight dealt moment + bg-dots */}
        <section
          className="section statement bg-dots"
          id="explainability"
          data-moment="word-highlight"
          aria-labelledby="explainability-h"
        >
          <div className="wrap">
            <h2 id="explainability-h" className="mo-wh__text">
              Opaque risk scores stall investigations. <strong>RiskSage</strong> pairs three
              anomaly detectors with SHAP attributions so analysts verify unusual logins, file
              exports, and USB mounts in seconds.
            </h2>
          </div>
        </section>

        {/* Section 4: features-2x2 on .ground-surface with silk-folds */}
        <section className="section g2 ground-surface" id="signals" aria-labelledby="signals-h">
          <div className="wrap">
            <div className="group">
              <div className="section-head">
                <h2 id="signals-h">
                  RiskSage behavioral channels and detection features.{" "}
                  <span className="muted">Sudden spikes and gradual drift caught together.</span>
                </h2>
              </div>
              <div className="grid">
                <article className="card card--row span-6">
                  <h3>Flags unusual login and USB events</h3>
                  <p>
                    Detects off-hours authentication, cross-host jumps, and unregistered removable
                    drives as they happen.
                  </p>
                  <div
                    className="panel panel--flush"
                    data-fx="silk-folds"
                    data-fx-seed="14"
                    data-fx-params='{"drift":0}'
                    data-fx-palette='{"bg":"#d9ccb7","surface":"#e9e0d2","ink":"#2a2622","accent":"#a8794a"}'
                    role="img"
                    aria-label="Live alert notifications for login, file download, and USB events"
                  >
                    <div className="stage stage--fade-b">
                      <div
                        className="at-rise fit"
                        style={{
                          ["--fit-max" as string]: "396px",
                          ["--ax" as string]: "max(24px, 50% - 198px)",
                          ["--ay" as string]: "48px",
                          ["--ay-sm" as string]: "20px",
                        }}
                        data-ui-loop=""
                      >
                        <div className="ui ui-notify" data-ui="notify">
                          <ul className="ui-notify__list" data-notify-list="">
                            {users.slice(0, 3).map((u) => (
                              <li className="ui-note" key={u.id}>
                                <span className="ui-avatar ui-note__av" data-tone={u.threatLevel === "Critical" ? "2" : "1"}>
                                  {u.initials}
                                </span>
                                <span className="ui-note__text">
                                  <span className="ui-note__title">
                                    {u.name} {u.status === "Flagged" ? "flagged" : u.status.toLowerCase()}<time>{u.lastActivity}</time>
                                  </span>
                                  <span className="ui-note__body">{u.primaryTrigger}</span>
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>

                <article className="card card--row span-6">
                  <h3>Scores log events through FastAPI</h3>
                  <p>
                    Ingests logon, file, email, and USB logs into FastAPI scoring workers. A Kafka
                    broker can feed the same stream when one is configured.
                  </p>
                  <div
                    className="panel panel--flush"
                    data-fx="silk-folds"
                    data-fx-seed="29"
                    data-fx-params='{"drift":0}'
                    data-fx-palette='{"bg":"#d9ccb7","surface":"#e9e0d2","ink":"#2a2622","accent":"#a8794a"}'
                  >
                    <div className="dg" data-diagram={DIAGRAM_TELEMETRY} data-dg-still="" />
                  </div>
                </article>
              </div>
            </div>

            <div className="grid">
              <article className="card card--row span-6">
                <h3>Measures multi-model ensemble agreement</h3>
                <p>
                  Combines Isolation Forest, Autoencoder, and LSTM sequence memory to reduce false
                  positives to {ensemble ? `${ensemble.falsePositiveRate}%` : "…"} on the loaded corpus.
                </p>
                <div
                  className="panel panel--flush"
                  data-fx="silk-folds"
                  data-fx-seed="43"
                  data-fx-params='{"drift":0}'
                  data-fx-palette='{"bg":"#d9ccb7","surface":"#e9e0d2","ink":"#2a2622","accent":"#a8794a"}'
                  role="img"
                  aria-label="Ensemble detection rate on the loaded corpus"
                >
                  <div className="stage stage--fade-b">
                    <div
                      className="at-rise fit to-edge"
                      style={{
                        ["--fit-max" as string]: "400px",
                        ["--ax" as string]: "max(24px, 50% - 200px)",
                        ["--ay" as string]: "40px",
                        ["--ay-sm" as string]: "20px",
                      }}
                    >
                      <div className="ui ui-panel ui-stat" data-ui="stat" data-from="88" data-to="95" data-suffix="%">
                        <div className="ui-stat__head">
                          <div className="ui-stat__top">
                            <span className="ui-stat__label">Ensemble detection rate</span>
                            <span className="ui-stat__range">Last 14 days</span>
                          </div>
                          <div className="ui-stat__line">
                            <span className="ui-stat__num" data-stat-num="">
                              {ensemble ? `${ensemble.detectionRate}%` : "…"}
                            </span>
                            <span className="ui-chip ui-chip--plain ui-stat__delta">{ensemble ? `${ensemble.auc === null ? "…" : ensemble.auc.toFixed(3)} AUC` : "… AUC"}</span>
                            <span className="ui-stat__sub">Ensemble fusion</span>
                          </div>
                        </div>
                        <div className="ui-stat__chart">
                          <svg className="ui-stat__svg" viewBox="0 0 400 120" preserveAspectRatio="none" aria-hidden="true">
                            <path className="ui-stat__grid" d="M0 30.5H400M0 60.5H400M0 90.5H400" />
                            <path className="ui-stat__cover" fillRule="evenodd" d="" />
                            <g className="ui-stat__bars">
                              <rect rx="3" x="0" y="54" width="21" height="66" />
                              <rect rx="3" x="29" y="49" width="21" height="71" />
                              <rect rx="3" x="58" y="45" width="21" height="75" />
                              <rect rx="3" x="87" y="42" width="21" height="78" />
                              <rect rx="3" x="116" y="38" width="21" height="82" />
                              <rect rx="3" x="145" y="35" width="21" height="85" />
                              <rect rx="3" x="174" y="32" width="21" height="88" />
                              <rect rx="3" x="204" y="30" width="21" height="90" />
                              <rect rx="3" x="233" y="26" width="21" height="94" />
                              <rect rx="3" x="262" y="23" width="21" height="97" />
                              <rect rx="3" x="291" y="20" width="21" height="100" />
                              <rect rx="3" x="320" y="18" width="21" height="102" />
                              <rect rx="3" x="349" y="15" width="21" height="105" />
                              <rect rx="3" x="378" y="12" width="21" height="108" />
                            </g>
                          </svg>
                          <div className="ui-stat__axis" aria-hidden="true">
                            <span>Nov 13</span>
                            <span>Nov 20</span>
                            <span>Today</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>

              <article className="card card--row span-6">
                <h3>Controls channel alert policies</h3>
                <p>
                  Configures per-channel anomaly thresholds and escalation triggers across
                  departments.
                </p>
                <div
                  className="panel panel--flush"
                  data-fx="silk-folds"
                  data-fx-seed="58"
                  data-fx-params='{"drift":0}'
                  data-fx-palette='{"bg":"#d9ccb7","surface":"#e9e0d2","ink":"#2a2622","accent":"#a8794a"}'
                  role="img"
                  aria-label="Policy switches for off-hours logins, bulk file downloads, external mail, and USB storage"
                >
                  <div className="stage stage--fade-b">
                    <div
                      className="at-right to-edge"
                      style={{ ["--ax" as string]: "32px", ["--ay" as string]: "44px" }}
                    >
                      <div className="ui ui-panel ui-toggles" data-ui="toggles">
                        <div className="ui-head">
                          <div className="ui-title">Active detection policies</div>
                          <span className="ui-spacer" />
                          <div className="ui-meta" data-tg-count="">
                            3 of 4 on
                          </div>
                        </div>
                        <ul className="ui-toggles__list">
                          <li className="ui-tg">
                            <span className="ui-tg__text">
                              <span className="ui-tg__label">After-hours login drift</span>
                              <span className="ui-tg__sub">Flag 3+ hours outside shift baseline</span>
                            </span>
                            <button
                              className="ui-switch is-on"
                              type="button"
                              role="switch"
                              aria-checked="true"
                              aria-label="After-hours login drift"
                            >
                              <i />
                            </button>
                          </li>
                          <li className="ui-tg">
                            <span className="ui-tg__text">
                              <span className="ui-tg__label">Bulk confidential downloads</span>
                              <span className="ui-tg__sub">Alert above 500 MB per session</span>
                            </span>
                            <button
                              className="ui-switch is-on"
                              type="button"
                              role="switch"
                              aria-checked="true"
                              aria-label="Bulk confidential downloads"
                            >
                              <i />
                            </button>
                          </li>
                          <li className="ui-tg">
                            <span className="ui-tg__text">
                              <span className="ui-tg__label">Unregistered USB mass storage</span>
                              <span className="ui-tg__sub">Immediate Critical escalation</span>
                            </span>
                            <button
                              className="ui-switch is-on"
                              type="button"
                              role="switch"
                              aria-checked="true"
                              aria-label="Unregistered USB mass storage"
                            >
                              <i />
                            </button>
                          </li>
                          <li className="ui-tg">
                            <span className="ui-tg__text">
                              <span className="ui-tg__label">Personal webmail attachments</span>
                              <span className="ui-tg__sub">Inspect outbound mail bursts</span>
                            </span>
                            <button
                              className="ui-switch"
                              type="button"
                              role="switch"
                              aria-checked="false"
                              aria-label="Personal webmail attachments"
                            >
                              <i />
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>

        {/* Section 5: tabs-tour + line-carries-colour dealt moment */}
        <section
          className="section"
          id="workflow"
          data-moment="line-carries-colour"
          data-moment-opts='{"from":"surface"}'
          aria-labelledby="workflow-h"
        >
          <div className="wrap">
            <div className="grid grid--top">
              <div className="span-5">
                <div className="section-head">
                  <h2 id="workflow-h">
                    One triage workflow from alert to resolution.{" "}
                    <span className="muted">Built for security analysts.</span>
                  </h2>
                </div>
                <div className="tabs" role="tablist" aria-label="Analyst workflow">
                  <button
                    className="tab"
                    type="button"
                    role="tab"
                    id="tab-btn-1"
                    aria-selected="true"
                    aria-controls="tab-panel-1 tab-screen-1"
                  >
                    Inspect SHAP factors
                  </button>
                  <button
                    className="tab"
                    type="button"
                    role="tab"
                    id="tab-btn-2"
                    aria-selected="false"
                    aria-controls="tab-panel-2 tab-screen-2"
                  >
                    Trace user timeline
                  </button>
                  <button
                    className="tab"
                    type="button"
                    role="tab"
                    id="tab-btn-3"
                    aria-selected="false"
                    aria-controls="tab-panel-3 tab-screen-3"
                  >
                    Triage active alerts
                  </button>
                </div>

                <div className="tabs-panels">
                  <div id="tab-panel-1" role="tabpanel" aria-labelledby="tab-btn-1" className="stack-4">
                    <p className="t-lead">
                      Every user risk score decomposes into signed Shapley values across login time,
                      file volume, email recipients, and USB mounts so analysts verify why a model
                      fired.
                    </p>
                    <p>
                      <a className="link" href="/dashboard">
                        Inspect SHAP views
                      </a>
                    </p>
                  </div>
                  <div
                    id="tab-panel-2"
                    role="tabpanel"
                    aria-labelledby="tab-btn-2"
                    className="stack-4"
                    hidden
                  >
                    <p className="t-lead">
                      Correlate 14-day baseline behavior against observed daily bursts across
                      workstation sessions, file paths, and removable media logs.
                    </p>
                    <p>
                      <a className="link" href="/dashboard">
                        See user timelines
                      </a>
                    </p>
                  </div>
                  <div
                    id="tab-panel-3"
                    role="tabpanel"
                    aria-labelledby="tab-btn-3"
                    className="stack-4"
                    hidden
                  >
                    <p className="t-lead">
                      Prioritize flagged accounts by ensemble score, record investigation notes, and
                      move incidents from Flagged through Escalated or Cleared.
                    </p>
                    <p>
                      <a className="link" href="/dashboard">
                        Open alert queue
                      </a>
                    </p>
                  </div>
                </div>
              </div>

              <div
                className="frame frame--split frame--lit span-6 start-7"
                data-fx-palette='{"bg":"#d9ccb7","surface":"#e9e0d2","ink":"#2a2622","accent":"#a8794a"}'
              >
                <div className="stage stage--fade-br">
                  <div
                    id="tab-screen-1"
                    className="at-rise fit to-edge"
                    style={{
                      ["--fit-max" as string]: "460px",
                      ["--ax" as string]: "max(24px, 50% - 230px)",
                      ["--ay" as string]: "48px",
                    }}
                  >
                    <div className="ui ui-panel rs-shap-pane">
                      <div className="rs-shap-pane__top">
                        <div>
                          <h3 className="rs-shap-pane__title">SHAP Attribution · {leadUser?.name ?? "…"}</h3>
                          <span className="rs-shap-pane__sub">{leadUser ? `Risk score ${leadUser.riskScore}/100` : "…"}</span>
                        </div>
                        <span className="rs-win__badge">Critical</span>
                      </div>
                      <div className="rs-shap-bars">
                        {(leadUser?.shapFactors ?? []).map((f) => (
                          <div className="rs-shap-row" key={f.feature}>
                            <span className="rs-shap-row__name">{f.feature}</span>
                            <span className="rs-shap-row__track">
                              <span
                                className={`rs-shap-row__fill ${
                                  f.contribution < 0 ? "rs-shap-row__fill--neg" : ""
                                }`}
                                style={{
                                  width: `${Math.min(100, Math.round((Math.abs(f.contribution) / 0.35) * 100))}%`,
                                }}
                              />
                            </span>
                            <span className="rs-shap-row__val">
                              {f.contribution > 0 ? `+${f.contribution.toFixed(2)}` : f.contribution.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div
                    id="tab-screen-2"
                    className="at-rise fit to-edge"
                    style={{
                      ["--fit-max" as string]: "460px",
                      ["--ax" as string]: "max(24px, 50% - 230px)",
                      ["--ay" as string]: "48px",
                    }}
                    hidden
                  >
                    <div className="ui ui-panel rs-shap-pane">
                      <div className="rs-shap-pane__top">
                        <div>
                          <h3 className="rs-shap-pane__title">Event Timeline · {leadUser?.hostId ?? "…"}</h3>
                          <span className="rs-shap-pane__sub">{leadUser ? `${leadUser.timeline.length} flagged days` : "…"}</span>
                        </div>
                        <span className="rs-win__badge">Nov 26</span>
                      </div>
                      <div className="rs-shap-events">
                        {(leadUser?.timeline ?? []).map((ev) => (
                          <div className="rs-shap-ev" key={ev.id}>
                            <time>{ev.timestamp}</time>
                            <b>{ev.channel}</b>
                            <span>{ev.action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div
                    id="tab-screen-3"
                    className="at-rise fit to-edge"
                    style={{
                      ["--fit-max" as string]: "460px",
                      ["--ax" as string]: "max(24px, 50% - 230px)",
                      ["--ay" as string]: "48px",
                    }}
                    hidden
                  >
                    <div className="ui ui-panel rs-shap-pane">
                      <div className="rs-shap-pane__top">
                        <div>
                          <h3 className="rs-shap-pane__title">Analyst Triage Queue</h3>
                          <span className="rs-shap-pane__sub">Ordered by ensemble risk score</span>
                        </div>
                        <span className="rs-win__badge">{loaded ? `${activeCount} active` : "…"}</span>
                      </div>
                      <div className="rs-shap-events">
                        {users.slice(0, 5).map((u) => (
                          <div className="rs-shap-ev" key={u.id}>
                            <time>{u.riskScore}/100</time>
                            <b>{u.status}</b>
                            <span>{u.name} · {u.primaryTrigger}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 6: CERT model comparison cards on bg-band (calm section) */}
        <section className="section bg-band bg-bleed" id="benchmarks" aria-labelledby="benchmarks-h">
          <div className="wrap">
            <div className="section-head">
              <h2 id="benchmarks-h">Model comparison on the loaded corpus</h2>
              <p className="t-lead">
                Ensemble detection pairs Isolation Forest, Autoencoder, and LSTM sequence models,
                measured on the synthetic CERT-format corpus the API is running on.
              </p>
            </div>
            <div className="grid rs-bench-grid">
              {(evaluation?.models ?? []).map((row) => {
                const shortScope =
                  row.model === "RiskSage Ensemble"
                    ? "Weighted fusion + SHAP"
                    : row.model === "LSTM Sequence"
                    ? "Multi-day sequence drift"
                    : row.model === "Autoencoder"
                    ? "Feature reconstruction"
                    : "Single-session outliers";
                const aucWidth = Math.round((row.auc ?? 0) * 220);
                const detWidth = Math.round((row.detectionRate / 100) * 220);
                return (
                  <article className="card card--row m-nolift span-3 rs-bench-card" key={row.model}>
                    <h3>{row.model}</h3>
                    <p>{shortScope}</p>
                    <svg
                      className="rs-bench-meter"
                      viewBox="0 0 220 26"
                      width="220"
                      height="26"
                      role="img"
                      aria-label={`${row.model} AUC ${row.auc === null ? "—" : row.auc.toFixed(3)} and detection rate ${row.detectionRate.toFixed(1)}%`}
                    >
                      <rect x="0" y="2" width="220" height="8" rx="4" fill="currentColor" opacity="0.12" />
                      <rect x="0" y="2" width={aucWidth} height="8" rx="4" fill="var(--accent)" />
                      <rect x="0" y="16" width="220" height="8" rx="4" fill="currentColor" opacity="0.12" />
                      <rect x="0" y="16" width={detWidth} height="8" rx="4" fill="currentColor" opacity="0.72" />
                    </svg>
                    <ul className="rows rs-bench-rows">
                      <li>
                        <span className="rows__name">AUC</span>
                        <span className="rows__value">{row.auc === null ? "—" : row.auc.toFixed(3)}</span>
                      </li>
                      <li>
                        <span className="rows__name">F1 score</span>
                        <span className="rows__value">{row.f1Score.toFixed(3)}</span>
                      </li>
                      <li>
                        <span className="rows__name">Detection rate</span>
                        <span className="rows__value">{row.detectionRate.toFixed(1)}%</span>
                      </li>
                      <li>
                        <span className="rows__name">False positive</span>
                        <span className="rows__value">{row.falsePositiveRate.toFixed(1)}%</span>
                      </li>
                    </ul>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        {/* Section 7: faq (calm section with real stack icons) */}
        <section className="section" id="faq" aria-labelledby="faq-h">
          <div className="wrap">
            <div className="grid grid--top">
              <div className="span-5 stack-4">
                <h2 id="faq-h">Questions</h2>
                <p className="t-lead">
                  How RiskSage ingests activity streams, runs ensemble scoring, and explains alerts.
                </p>
                <div className="rs-stack-icons" aria-label="RiskSage technology stack">
                  {STACK_ICONS.map((ic) => (
                    <span className="ic-tile" key={ic.alt} title={ic.alt}>
                      <img className={ic.cls} src={ic.src} alt={ic.alt} />
                    </span>
                  ))}
                </div>
                <p>
                  <a className="link" href="/dashboard">
                    Inspect live alerts
                  </a>
                </p>
              </div>
              <div className="span-6 start-7">
                <div className="faq">
                  <div className="faq__item">
                    <h3>Which user behaviors does RiskSage monitor?</h3>
                    <p>
                      Workstation login times, file access volumes, outbound email activity, and
                      removable USB mounts.
                    </p>
                  </div>
                  <div className="faq__item">
                    <h3>Why combine Isolation Forest, Autoencoder, and LSTM?</h3>
                    <p>
                      Isolation Forest catches sudden spikes while Autoencoders and LSTMs detect
                      correlated and gradual drift.
                    </p>
                  </div>
                  <div className="faq__item">
                    <h3>How do SHAP explanations help security analysts?</h3>
                    <p>
                      SHAP prints signed feature values so analysts verify which login, file, or USB
                      actions drove an alert.
                    </p>
                  </div>
                  <div className="faq__item">
                    <h3>Which datasets validate RiskSage model benchmarks?</h3>
                    <p>
                      AUC, detection rate, and false positive rate are measured on the corpus
                      the API is running on. In the demo that is a synthetic CERT-format set,
                      not the real CERT datasets.
                    </p>
                  </div>
                  <div className="faq__item">
                    <h3>How does the production pipeline process events?</h3>
                    <p>
                      Log events flow into the FastAPI scoring service, which returns SHAP
                      vectors to the dashboard. A Kafka broker can feed the same stream when
                      one is configured.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer: dealt close-type + footer-columns */}
      <footer className="footer closing" id="contact" aria-labelledby="close-h">
        <div className="wrap">
          <div className="closing__cta close--type">
            <div className="section-head">
              <h2 id="close-h">Inspect insider threat alerts in RiskSage</h2>
              <p>
                Explore interactive user timelines, SHAP attribution charts, and measured
                model comparisons.
              </p>
            </div>
            <a className="btn btn--primary btn--xl btn--wide" href="/dashboard">
              See dashboard
              <ArrowIcon />
            </a>
          </div>
          <div className="closing__links">
            <div className="grid">
              <div className="span-4 stack-4">
                <a className="nav__logo" href="#top">
                  <span className="mark" data-mark="arc" aria-hidden="true" />
                  RiskSage
                </a>
                <p className="footer__lede">
                  Explainable insider threat detection for enterprise security teams.
                </p>
              </div>
              <div className="span-2 footer__col">
                <h3>Platform</h3>
                <ul>
                  <li>
                    <a href="#workbench">Workbench</a>
                  </li>
                  <li>
                    <a href="#signals">Signals</a>
                  </li>
                  <li>
                    <a href="#workflow">Workflow</a>
                  </li>
                </ul>
              </div>
              <div className="span-2 footer__col">
                <h3>Explainability</h3>
                <ul>
                  <li>
                    <a href="#explainability">SHAP factors</a>
                  </li>
                  <li>
                    <a href="#workbench">User queue</a>
                  </li>
                </ul>
              </div>
              <div className="span-2 footer__col">
                <h3>Benchmarks</h3>
                <ul>
                  <li>
                    <a href="#benchmarks">Benchmarks</a>
                  </li>
                  <li>
                    <a href="#faq">Questions</a>
                  </li>
                </ul>
              </div>
              <div className="span-2 footer__col">
                <h3>Product</h3>
                <ul>
                  <li>
                    <a href="/dashboard">Dashboard</a>
                  </li>
                  <li>
                    <a href="#contact">Contact</a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="footer__legal">
              <span>
                &copy; 2026 RiskSage &nbsp; <a href="/privacy">Privacy</a> &nbsp;{" "}
                <a href="/terms">Terms</a>
              </span>
              <div className="socials" />
              <span className="t-small muted">
                Product names and logos are trademarks of their owners
              </span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
