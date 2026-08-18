// Entry bundled into the artifact. Exposes window.OGChart.render(el, chartData),
// which mounts the REAL @aai-agency/og-components chart from the well data.
import React from "react";
import { createRoot } from "react-dom/client";
import { LineChart } from "@aai-agency/og-components";

// "2024-08" | "2024-08-14" -> "2024-08-01" (DataPoint.date is an ISO date string)
const toDate = (ym) => {
  const s = String(ym || "");
  if (s.length >= 10) return s.slice(0, 10);
  if (s.length >= 7) return s.slice(0, 7) + "-01";
  return s;
};

// Build TimeSeries[] (the real library shape) from the flat chartData.series.
const toSeries = (cd) => {
  const s = (cd && cd.series) || {};
  const months = s.months || [];
  const mk = (fluid, arr, unit) =>
    Array.isArray(arr) && arr.length
      ? [{
          id: fluid,
          fluidType: fluid,
          curveType: "actual",
          unit: unit,
          frequency: "monthly",
          data: months
            .map((m, i) => ({ date: toDate(m), value: arr[i] }))
            .filter((d) => d.value != null && !Number.isNaN(d.value)),
        }]
      : [];
  return [
    ...mk("oil", s.oil, cd.unit || "bbl/d"),
    ...mk("gas", s.gas, "mcf/d"),
    ...mk("water", s.water, "bbl/d"),
  ];
};

const render = (el, chartData) => {
  const series = toSeries(chartData);
  if (!series.length) { el.textContent = "No production series to plot."; return; }
  createRoot(el).render(React.createElement(LineChart, { series, height: 340 }));
};

window.OGChart = { render };
