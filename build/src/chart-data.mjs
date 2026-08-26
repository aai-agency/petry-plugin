const SERIES_META = {
  oil: { label: "Oil", color: "#10b981", axis: "left", defaultUnit: "bbl/d" },
  gas: { label: "Gas", color: "#f59e0b", axis: "right", defaultUnit: "Mcf/d" },
  water: { label: "Water", color: "#0ea5e9", axis: "left", defaultUnit: "bbl/d" },
};

const ANNOTATION_COLOR = {
  event: "#f59e0b",
  decision: "#8b5cf6",
  correction: "#ef4444",
  measurement: "#10b981",
  instruction: "#0ea5e9",
  preference: "#0ea5e9",
  note: "#64748b",
};

const ANNOTATION_TYPE = { note: "note", measurement: "note" };

const monthOrdinal = (value) => {
  const match = /^(\d{4})-(\d{2})(?:-\d{2})?$/.exec(String(value ?? ""));
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(year) || month < 1 || month > 12) return null;
  return year * 12 + month - 1;
};

const monthFromOrdinal = (ordinal) => {
  const year = Math.floor(ordinal / 12);
  const month = (ordinal % 12) + 1;
  return `${year}-${String(month).padStart(2, "0")}`;
};

const finiteNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const number = typeof value === "number" ? value : Number(String(value).trim());
  return Number.isFinite(number) ? number : null;
};

export const normalizeMonthlySeries = (months, values) => {
  if (!Array.isArray(months) || !Array.isArray(values)) return [];
  const byMonth = new Map();
  for (let i = 0; i < Math.min(months.length, values.length); i++) {
    const ordinal = monthOrdinal(months[i]);
    const value = finiteNumber(values[i]);
    if (ordinal === null || value === null) continue;
    byMonth.set(ordinal, { ordinal, month: monthFromOrdinal(ordinal), value });
  }
  return [...byMonth.values()].sort((a, b) => a.ordinal - b.ordinal);
};

const contextSeries = (series, key, points) => {
  if (!points.length) return null;
  const meta = SERIES_META[key];
  return {
    id: key,
    seriesType: "actual",
    associatedType: key,
    fluidType: key,
    curveType: "actual",
    unit: series.units?.[key] || meta.defaultUnit,
    frequency: "monthly",
    label: meta.label,
    color: meta.color,
    axis: meta.axis,
    data: points.map((point) => ({ date: `${point.month}-01`, value: point.value })),
  };
};

export const buildAnnotations = (activity, startOrdinal, horizon) => {
  if (!Array.isArray(activity)) return [];
  const annotations = [];
  for (const item of activity) {
    if (!item?.date) continue;
    const ordinal = monthOrdinal(item.date);
    if (ordinal === null) continue;
    const t = ordinal - startOrdinal;
    if (t < 0 || t > horizon) continue;
    annotations.push({
      id: `vault-${annotations.length}`,
      tStart: t,
      tEnd: t + 0.6,
      type: ANNOTATION_TYPE[item.type] || "other",
      color: ANNOTATION_COLOR[item.type] || ANNOTATION_COLOR.note,
      label: String(item.text ?? ""),
    });
  }
  return annotations;
};

export const buildChartModel = (chartData) => {
  const series = chartData?.series || {};
  const pointsByKey = Object.fromEntries(
    Object.keys(SERIES_META).map((key) => [key, normalizeMonthlySeries(series.months, series[key])])
  );
  const primaryKey = ["oil", "gas", "water"].find((key) => pointsByKey[key].length);
  if (!primaryKey) return null;

  const primaryPoints = pointsByKey[primaryKey];
  const primaryMeta = SERIES_META[primaryKey];
  const startOrdinal = primaryPoints[0].ordinal;
  const time = primaryPoints.map((point) => point.ordinal - startOrdinal);
  const lastActualTime = time[time.length - 1];
  const lastSourceTime = Math.max(
    ...Object.values(pointsByKey).flatMap((points) => points.map((point) => point.ordinal - startOrdinal))
  );
  const forecastHorizon = Math.max(lastActualTime + 6, lastSourceTime);
  const contextual = Object.keys(SERIES_META)
    .filter((key) => key !== primaryKey)
    .map((key) => contextSeries(series, key, pointsByKey[key]))
    .filter(Boolean);

  return {
    primaryKey,
    primaryLabel: primaryMeta.label,
    actualColor: primaryMeta.color,
    unit: chartData.unit || series.units?.[primaryKey] || primaryMeta.defaultUnit,
    production: primaryPoints.map((point) => point.value),
    time,
    startDate: `${primaryPoints[0].month}-01`,
    forecastHorizon,
    contextSeries: contextual,
    annotations: buildAnnotations(chartData.activity, startOrdinal, forecastHorizon),
  };
};
