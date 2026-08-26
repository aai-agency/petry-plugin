import assert from "node:assert/strict";
import test from "node:test";
import { buildChartModel, normalizeMonthlySeries } from "../build/src/chart-data.mjs";

test("monthly normalization preserves calendar gaps and rejects missing values", () => {
  assert.deepEqual(
    normalizeMonthlySeries(
      ["2026-04", "2026-01", "2026-02", "bad", "2026-05"],
      [90, 100, null, 50, ""]
    ),
    [
      { ordinal: 24312, month: "2026-01", value: 100 },
      { ordinal: 24315, month: "2026-04", value: 90 },
    ]
  );
});

test("chart model aligns sparse oil, gas, water, and annotations by month", () => {
  const model = buildChartModel({
    unit: "bbl/d",
    series: {
      months: ["2026-01", "2026-02", "2026-04", "2026-05"],
      oil: [100, null, 90, "bad"],
      gas: [500, 480, 450, null],
      water: [10, 11, 13, 14],
      units: { gas: "Mcf/d", water: "bbl/d" },
    },
    activity: [
      { type: "event", date: "2026-04-20", text: "Pump changed" },
      { type: "note", date: "2025-12-01", text: "Before series" },
    ],
  });

  assert.deepEqual(model.production, [100, 90]);
  assert.equal(model.primaryKey, "oil");
  assert.deepEqual(model.time, [0, 3]);
  assert.equal(model.startDate, "2026-01-01");
  assert.equal(model.forecastHorizon, 9);
  assert.deepEqual(model.contextSeries.map((series) => series.id), ["gas", "water"]);
  assert.equal(model.contextSeries[0].axis, "right");
  assert.equal(model.contextSeries[1].data[2].date, "2026-04-01");
  assert.equal(model.annotations.length, 1);
  assert.equal(model.annotations[0].tStart, 3);
});

test("chart model falls back to gas when oil is unavailable", () => {
  const model = buildChartModel({
    series: { months: ["2026-01", "2026-03"], oil: [null, null], gas: [500, 450] },
  });
  assert.equal(model.primaryKey, "gas");
  assert.equal(model.unit, "Mcf/d");
  assert.deepEqual(model.time, [0, 2]);
});

test("chart model rejects a series without any valid production points", () => {
  assert.equal(
    buildChartModel({ series: { months: ["2026-01"], oil: [null], gas: [""], water: [null] } }),
    null
  );
});
