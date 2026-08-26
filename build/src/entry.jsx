// Entry bundled into the artifact. Exposes window.OGChart.render(el, chartData),
// which mounts the REAL @aai-agency/og-components DeclineCurve — the preferred
// production series with captured vault events as native on-chart annotations.
import React from "react";
import { createRoot } from "react-dom/client";
import { DeclineCurve } from "@aai-agency/og-components/decline-curve";
import { buildChartModel } from "./chart-data.mjs";

const render = (el, cd) => {
  const model = buildChartModel(cd);
  if (!model) {
    el.textContent = "No valid monthly production series to plot.";
    return;
  }
  createRoot(el).render(
    React.createElement(DeclineCurve, {
      production: model.production,
      time: model.time,
      startDate: model.startDate,
      timeUnit: "month",
      unitsPerYear: 12,
      unit: model.unit,
      actualColor: model.actualColor,
      height: 360,
      showVariance: false,
      forecastEditable: false,
      forecastHorizon: model.forecastHorizon,
      contextSeries: model.contextSeries,
      initialAnnotations: model.annotations,
    })
  );
};

window.OGChart = { render };
