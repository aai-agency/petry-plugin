import assert from "node:assert/strict";
import { test } from "node:test";
import { assertCorrection, assertRelevant } from "../eval/agent/oracle.mjs";

const base = {
  artifact_id: "a-1",
  revision: 1,
  telemetry: [{ time: "t", value: 1 }],
  activity: [],
  petry_dependencies: { loaded_asset_refs: ["M-101"] },
};
const record = {
  uuid: "old",
  expired_at: null,
  fact: "M-101 line pressure was constrained from August 5 through August 6, 2026.",
  valid_at: "2026-08-05",
  invalid_at: "2026-08-07",
  petry: { asset_refs: ["M-101"], supersedes: [], type: "event" },
};

test("agent eval oracle accepts a relevant same-artifact refresh", () => {
  assertRelevant(base, { ...structuredClone(base), revision: 2, activity: [record] }, [record]);
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
  assertRelevant(base, { ...structuredClone(base), revision: 2, activity: [projection] }, [record]);
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
    [record],
  ));
});

test("agent eval oracle rejects telemetry mutation", () => {
  assert.throws(() => assertRelevant(
    base,
    { ...structuredClone(base), revision: 2, telemetry: [], activity: [record] },
    [record],
  ));
});

test("agent eval oracle accepts an out-of-window linked correction", () => {
  const old = { ...record, expired_at: "2026-09-05T00:00:00Z" };
  const replacement = {
    ...record,
    uuid: "new",
    valid_at: "2026-08-20",
    invalid_at: "2026-08-22",
    petry: { ...record.petry, supersedes: ["old"] },
  };
  assertCorrection(base, { ...structuredClone(base), revision: 2 }, [old, replacement], record);
});
