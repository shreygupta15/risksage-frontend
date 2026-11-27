import type { Metadata } from "next";
import { KitScripts } from "@/components/KitScripts";
import "./landing.css";

export const metadata: Metadata = {
  title: "RiskSage: explainable insider threat detection for security teams",
  description:
    "RiskSage scores login, file, email, and USB telemetry across Isolation Forest, Autoencoder, and LSTM models and prints the SHAP factors behind every alert.",
  other: {
    "site-kind": "software",
    "page-type": "software",
  },
  openGraph: {
    type: "website",
    title: "RiskSage: explainable insider threat detection for security teams",
    description:
      "Scores login, file, email, and USB telemetry across three models with SHAP attribution, measured on a synthetic CERT-format corpus.",
    images: ["/share.jpg"],
  },
  twitter: {
    card: "summary_large_image",
  },
};

export default function LandingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <link rel="stylesheet" href="/assets/system.css" precedence="default" />
      <link rel="stylesheet" href="/assets/ui/cards.css" precedence="default" />
      <link rel="stylesheet" href="/assets/motion/motion.css" precedence="default" />
      <link rel="stylesheet" href="/assets/backgrounds/backgrounds.css" precedence="default" />
      <link rel="stylesheet" href="/assets/layout/layout.css" precedence="default" />
      <link rel="stylesheet" href="/assets/icons/icon.css" precedence="default" />
      <link rel="stylesheet" href="/assets/ui/base.css" precedence="default" />
      <link rel="stylesheet" href="/assets/ui/window/fragment.css" precedence="default" />
      <link rel="stylesheet" href="/assets/ui/notify/fragment.css" precedence="default" />
      <link rel="stylesheet" href="/assets/ui/stat/fragment.css" precedence="default" />
      <link rel="stylesheet" href="/assets/ui/toggles/fragment.css" precedence="default" />
      <link rel="stylesheet" href="/assets/diagrams/diagram.css" precedence="default" />
      <link rel="modulepreload" href="/assets/moments/moments.js" />
      <link rel="modulepreload" href="/assets/moments/lib.js" />
      <link rel="modulepreload" href="/assets/moments/word-highlight/moment.js" />
      <link rel="modulepreload" href="/assets/moments/line-carries-colour/moment.js" />
      {children}
      <KitScripts />
    </>
  );
}
