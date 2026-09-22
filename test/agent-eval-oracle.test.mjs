import assert from "node:assert/strict";
import { test } from "node:test";
import { assertCorrection, assertRelevant, assertLocalCapture, assertRevision, utcMillis } from "../eval/agent/oracle.mjs";

const base = {
  artifact_id: "a-1",
  revision: 1,
  telemetry: [{ time: "t", value: 1 }],
  activity: [],
  petry_dependencies: { loaded_asset_refs: ["M-101"] },
};
const captureWindow = {started_at: "2026-09-22T18:31:00.123Z", completed_at: "2026-09-22T18:32:00.000Z"};
const correctionWindow = {started_at: "2026-09-22T18:35:00.456Z", completed_at: "2026-09-22T18:36:00.000Z"};
const record = {
  uuid: "188e65d4-1484-4e4e-a529-33e84c7e4b01",
  group_id: null, source_node_uuid: null, target_node_uuid: null, name: null,
  created_at: captureWindow.started_at, reference_time: captureWindow.started_at,
  fact_embedding: null, episodes: [], attributes: {}, expired_at: null,
  fact: "M-101 line pressure was constrained from August 5 through August 6, 2026.",
  valid_at: "2026-08-05", invalid_at: "2026-08-07",
  petry: {
    schema_version: 2, asset_refs: ["M-101"], supersedes: [], type: "event",
    source: "session", captured_at: captureWindow.started_at,
    temporal_kind: "interval", time_precision: {valid_at: "date", invalid_at: "date"},
    timezone: null, original_time_expression: "August 5 through August 6, 2026",
  },
};

function corrected(predecessor = record) {
  const old = {...structuredClone(predecessor), expired_at: correctionWindow.started_at};
  const next = {
    ...structuredClone(predecessor),
    uuid: "404f29f2-40cd-421a-987b-e9f50f2b92a9",
    created_at: correctionWindow.started_at, reference_time: correctionWindow.started_at,
    fact: "M-101 line pressure was constrained from August 20 through August 21, 2026.",
    fact_embedding: null, valid_at: "2026-08-20", invalid_at: "2026-08-22",
    petry: {...structuredClone(predecessor.petry), captured_at: correctionWindow.started_at,
      original_time_expression: "August 20 through August 21, 2026", supersedes: [predecessor.uuid]},
  };
  return [old, next];
}
const after = () => ({...structuredClone(base), revision: 2});
const checkCorrection = (records, predecessor = record) => assertCorrection(base, after(), records, predecessor, correctionWindow);


test("agent eval oracle accepts a relevant same-artifact refresh", () => {
  assertRelevant(base, { ...structuredClone(base), revision: 2, activity: [record] }, [record], captureWindow);
});

test("agent eval oracle accepts a normalized render projection", () => {
  const projection = {
    uuid: record.uuid,
    type: record.petry.type,
    fact: record.fact,
    valid_at: record.valid_at,
    invalid_at: record.invalid_at,
    expired_at: null,
  };
  assertRelevant(base, { ...structuredClone(base), revision: 2, activity: [projection] }, [record], captureWindow);
});

test("agent eval oracle accepts a manifest-named dotted field projection", () => {
  const projection = {
    uuid: record.uuid,
    "petry.type": record.petry.type,
    fact: record.fact,
    valid_at: record.valid_at,
    invalid_at: record.invalid_at,
    expired_at: null,
  };
  assertRelevant(base, { ...structuredClone(base), revision: 2, activity: [projection] }, [record], captureWindow);
});

test("agent eval oracle rejects a projection missing a consumed field", () => {
  const projection = {
    uuid: record.uuid,
    type: record.petry.type,
    fact: record.fact,
    valid_at: record.valid_at,
    expired_at: null,
  };
  assert.throws(() => assertRelevant(
    base,
    { ...structuredClone(base), revision: 2, activity: [projection] },
    [record], captureWindow,
  ));
});

test("agent eval oracle rejects telemetry mutation", () => {
  assert.throws(() => assertRelevant(
    base,
    { ...structuredClone(base), revision: 2, telemetry: [], activity: [record] },
    [record], captureWindow,
  ));
});

test("agent eval oracle accepts an out-of-window linked correction", () => {
  checkCorrection(corrected());
});

test("correction preserves graph data, attachments and unknown nested fields", () => {
  const rich = structuredClone(record);
  rich.group_id = "partition";
  rich.source_node_uuid = "fe09cbd5-3716-4225-9563-7769d964ef45";
  rich.episodes = ["episode"];
  rich.fact_embedding = [0.1, 0.2];
  rich.attributes = {engineering: {approved: false}};
  rich.extension = {original: [1, 2]};
  rich.petry.extension = {keep: true};
  rich.petry.attachments = [{attachment_id: "f258a791-6b20-4f92-a415-e1987bc617c9", caption: "Evidence"}];
  checkCorrection(corrected(rich), rich);
  for (const mutate of [
    x => { x.group_id = "wrong"; },
    x => { x.source_node_uuid = null; },
    x => { x.episodes = []; },
    x => { x.attributes.engineering.approved = true; },
    x => { delete x.extension; },
    x => { delete x.petry.extension; },
    x => { x.petry.attachments = []; },
    x => { x.fact_embedding = [0.1, 0.2]; },
  ]) {
    const records = corrected(rich); mutate(records[1]);
    assert.throws(() => checkCorrection(records, rich));
  }
});

const corruptions = {
  "wrong fact": x => { x.fact = "WRONG FACT"; },
  "wrong asset": x => { x.petry.asset_refs = ["M-999"]; },
  "wrong type": x => { x.petry.type = "note"; },
  "wrong source": x => { x.petry.source = "guessed"; },
  "missing creation time": x => { delete x.created_at; },
  "missing capture time": x => { delete x.petry.captured_at; },
  "missing required graph field": x => { delete x.group_id; },
  "missing schema version": x => { delete x.petry.schema_version; },
  "invalid UUID": x => { x.uuid = "new"; },
  "reused UUID": x => { x.uuid = record.uuid; },
  "stale clock": x => { x.created_at = x.petry.captured_at = record.created_at; },
  "local time mislabeled UTC": x => { x.created_at = x.petry.captured_at = "2026-09-22T14:35:00.456Z"; },
  "future clock": x => { x.created_at = x.petry.captured_at = "2026-09-23T18:35:00.456Z"; },
  "invented reference time": x => { x.reference_time = "2026-01-01T00:00:00Z"; },
  "wrong predecessor": x => { x.petry.supersedes = []; },
  "wrong temporal kind": x => { x.petry.temporal_kind = "point"; },
  "wrong precision": x => { x.petry.time_precision.valid_at = "datetime"; },
};
for (const [label, mutate] of Object.entries(corruptions)) {
  test(`correction oracle rejects ${label}`, () => {
    const records = corrected(); mutate(records[1]);
    assert.throws(() => checkCorrection(records));
  });
}

test("correction oracle rejects broken history and duplicate successors", () => {
  for (const mutate of [
    x => { x[0].expired_at = "not-a-time"; },
    x => { x[0].expired_at = "2026-09-22T18:35:01.456Z"; },
    x => { x[0].fact = "rewritten history"; },
    x => { x.push({...structuredClone(x[1]), uuid: "f258a791-6b20-4f92-a415-e1987bc617c9"}); },
    x => { x.push(structuredClone(x[1])); },
  ]) {
    const records = corrected(); mutate(records);
    assert.throws(() => checkCorrection(records));
  }
});

test("as-of selection retains the predecessor until the correction instant", () => {
  const records = corrected(); checkCorrection(records);
  const asOf = instant => records.filter(x => utcMillis(x.created_at) <= instant && (x.expired_at === null || instant < utcMillis(x.expired_at))).map(x => x.uuid);
  assert.deepEqual(asOf(utcMillis(record.created_at)), [record.uuid]);
  assert.deepEqual(asOf(utcMillis(correctionWindow.started_at) - 1), [record.uuid]);
  assert.deepEqual(asOf(utcMillis(correctionWindow.started_at)), [records[1].uuid]);
  const collapsed = corrected();
  collapsed[0].expired_at = collapsed[1].created_at = collapsed[1].petry.captured_at = record.created_at;
  assert.throws(() => assertCorrection(base, after(), collapsed, record, captureWindow), /nonempty/);
});

test("local capture oracle rejects missing fields and stale or impossible clocks", () => {
  assertLocalCapture(record, captureWindow);
  for (const mutate of [
    x => { delete x.attributes; },
    x => { delete x.reference_time; },
    x => { x.petry.captured_at = "2026-09-22T18:00:00Z"; },
    x => { x.created_at = x.petry.captured_at = "2026-09-22T14:31:00Z"; },
    x => { x.created_at = x.petry.captured_at = "2026-09-22T18:40:00Z"; },
  ]) {
    const candidate = structuredClone(record); mutate(candidate);
    assert.throws(() => assertLocalCapture(candidate, captureWindow));
  }
  for (const time of ["2026-02-30T12:00:00Z", "2026-09-22", "2026-09-22T24:00:00Z", "2026-09-22T18:00:00", "not-a-time"]) {
    assert.throws(() => utcMillis(time));
  }
});

test("case-only unit correction must persist the exact replacement", () => {
  const unit = structuredClone(record);
  unit.fact = "M-101 power was 5 mW.";
  const records = corrected(unit);
  records[1].fact = "M-101 power was 5 MW.";
  const expected = {fact: records[1].fact, valid_at: records[1].valid_at, invalid_at: records[1].invalid_at};
  assertRevision(records, unit, correctionWindow, expected);
  records[1].fact = unit.fact;
  assert.throws(() => assertRevision(records, unit, correctionWindow, expected));
  assert.throws(() => assertRevision([unit], unit, correctionWindow, expected));
});
