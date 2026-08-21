// Entry bundled into the artifact. Exposes window.OGChart.render(el, chartData),
// which mounts the REAL @aai-agency/og-components Chart (kind="line") — the oil
// production series with an opt-in decline-forecast layer, plus the well's
// captured vault events as native on-chart annotation bands.
import React from "react";
import { createRoot } from "react-dom/client";
import { Chart } from "@aai-agency/og-components/chart";

// Vault observation type -> annotation color (matches the card's Activity panel).
const ANNO_COLOR = {
  event: "#f59e0b", decision: "#8b5cf6", correction: "#ef4444",
  measurement: "#10b981", instruction: "#0ea5e9", preference: "#0ea5e9", note: "#64748b",
};
// -> a valid AnnotationType (drives grouping; color is overridden above).
const ANNO_TYPE = { note: "note", measurement: "note" };

const ym = (v) => String(v || "").slice(0, 7);

const monthsBetween = (startYM, val) => {
  const [sy, sm] = ym(startYM).split("-").map(Number);
  const [y, m] = ym(val).split("-").map(Number);
  if ([sy, sm, y, m].some((n) => Number.isNaN(n))) return NaN;
  return (y - sy) * 12 + (m - sm);
};

// Captured activity -> Chart annotations (time axis is months from startDate).
const toAnnotations = (activity, months) => {
  if (!Array.isArray(activity) || !months.length) return [];
  const start = ym(months[0]);
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

// number[] aligned to months[] -> a TimeSeries { data: {date, value}[] }.
const toSeries = (id, associatedType, unit, values, months, axis) => ({
  id,
  associatedType,
  unit,
  frequency: "monthly",
  axis,
  data: values
    .map((v, i) => ({ date: (ym(months[i]) || "2024-01") + "-01", value: Number(v) }))
    .filter((d) => !Number.isNaN(d.value)),
});

const render = (el, cd) => {
  const s = (cd && cd.series) || {};
  const months = s.months || [];
  const oil = (s.oil || []).map(Number).filter((v) => !Number.isNaN(v));
  if (!oil.length) { el.textContent = "No production series to plot."; return; }

  const unit = cd.unit || "bbl/d";
  const startDate = (ym(months[0]) || "2024-01") + "-01";

  const series = [toSeries("oil", "oil", unit, oil, months, "left")];
  const gas = (s.gas || []).map(Number).filter((v) => !Number.isNaN(v));
  if (gas.length) series.push(toSeries("gas", "gas", "mcf/d", gas, months, "right"));
  const water = (s.water || []).map(Number).filter((v) => !Number.isNaN(v));
  if (water.length) series.push(toSeries("water", "water", unit, water, months, "left"));

  createRoot(el).render(
    React.createElement(Chart, {
      kind: "line",
      series,
      height: 360,
      showForecast: true,
      // Opt-in decline forecast on the oil series (read-only in the artifact
      // preview; the interactive editor is Path B in the skill).
      forecast: {
        seriesId: "oil",
        editable: false,
        horizon: oil.length + 6, // ~6 months past the actuals, so data isn't compressed
        unitsPerYear: 12,
        startDate,
        timeUnit: "month",
      },
      annotations: toAnnotations(cd.activity, months),
      rightAxisFluids: gas.length ? ["gas"] : undefined,
    })
  );
};

window.OGChart = { render };
