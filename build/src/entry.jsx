// Entry bundled into the artifact. Exposes window.OGChart.render(el, chartData),
// which mounts the REAL @aai-agency/og-components DeclineCurve — the oil decline
// with the well's captured vault events as native on-chart annotations.
import React from "react";
import { createRoot } from "react-dom/client";
import { DeclineCurve } from "@aai-agency/og-components";

// Vault observation type -> annotation color (matches the card's Activity panel).
const ANNO_COLOR = {
  event: "#f59e0b", decision: "#8b5cf6", correction: "#ef4444",
  measurement: "#10b981", instruction: "#0ea5e9", preference: "#0ea5e9", note: "#64748b",
};
// -> a valid AnnotationType (drives grouping; color is overridden above).
const ANNO_TYPE = { note: "note", measurement: "note" };

const monthsBetween = (startYM, ym) => {
  const [sy, sm] = String(startYM).slice(0, 7).split("-").map(Number);
  const [y, m] = String(ym).slice(0, 7).split("-").map(Number);
  if ([sy, sm, y, m].some((n) => Number.isNaN(n))) return NaN;
  return (y - sy) * 12 + (m - sm);
};

// Captured activity -> DeclineCurve annotations (time axis is months from startDate).
const toAnnotations = (activity, months) => {
  if (!Array.isArray(activity) || !months.length) return [];
  const start = String(months[0]).slice(0, 7);
  const out = [];
  let i = 0;
  for (const a of activity) {
    if (!a || !a.date) continue;
    const t = monthsBetween(start, a.date);
    if (!Number.isFinite(t) || t < 0 || t > months.length) continue;
    out.push({
      id: "vault-" + i++,
      tStart: t,
      tEnd: t + 0.6,
      type: ANNO_TYPE[a.type] || "other",
      color: ANNO_COLOR[a.type] || "#64748b",
      label: a.text,
    });
  }
  return out;
};

const render = (el, cd) => {
  const s = (cd && cd.series) || {};
  const months = s.months || [];
  const oil = (s.oil || []).map(Number).filter((v) => !Number.isNaN(v));
  if (!oil.length) { el.textContent = "No production series to plot."; return; }
  const time = oil.map((_, i) => i);
  const startDate = String(months[0] || "2024-01").slice(0, 7) + "-01";
  createRoot(el).render(
    React.createElement(DeclineCurve, {
      production: oil,
      time,
      startDate,
      timeUnit: "month",
      unitsPerYear: 12,
      unit: cd.unit || "bbl/d",
      height: 360,
      showVariance: false,               // cleaner profile card
      forecastHorizon: oil.length + 6,   // ~6 months past the actuals, so the data isn't compressed
      initialAnnotations: toAnnotations(cd.activity, months),
    })
  );
};

window.OGChart = { render };
