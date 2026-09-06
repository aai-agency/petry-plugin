import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { mkdtemp, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { scopeFor, assertRollup, assertAttachmentRevision, assertLocalAttachments } from '../eval/agent/entity-evidence-oracle.mjs';

const skills = ['manage-assets', 'capture', 'get-asset-data'].map(name => readFileSync(`skills/${name}/SKILL.md`, 'utf8'));
const section = (s, heading) => s.split(`## ${heading}\n`)[1].split('\n## ')[0];
test('independently loaded skills agree on entity and evidence contracts', () => {
  for (const heading of ['Entity types and parent insight scope', 'Capture attachments and local evidence']) {
    assert.ok(section(skills[0], heading));
    for (const skill of skills) assert.equal(section(skill, heading), section(skills[0], heading));
  }
  for (const skill of skills) {
    const example = [...skill.matchAll(/```json\n([\s\S]*?)\n```/g)].map(m => JSON.parse(m[1])).find(x => x.attachment_id);
    assert.equal(example.location.kind, 'project_file');
    assert.equal(example.locator.page, 14);
  }
});
const entity = (id, edges = [], archived = false) => ({id, ref: `asset:${id}`, relationships: edges.map(([type, target]) => ({type, target_asset_id: target})), archived_at: archived ? '2026-01-01T00:00:00Z' : null});
const graph = [entity('deal', [['contains', 'facility'], ['contains', 'case'], ['related_to', 'outside'], ['contains', 'archived']]), entity('facility', [['contains', 'well']]), entity('case', [['parent_of', 'well']]), entity('well'), entity('outside'), entity('archived', [['contains', 'hidden']], true), entity('hidden')];
test('scope oracle handles shared descendants, direction, unrelated and archived branches', () => {
  assert.deepEqual(scopeFor(graph, 'asset:deal'), ['asset:case', 'asset:deal', 'asset:facility', 'asset:well']);
  assert.deepEqual(scopeFor(graph, 'asset:well'), ['asset:well']);
  assert.deepEqual(scopeFor(graph, 'asset:deal', 'direct'), ['asset:deal']);
  assert.throws(() => scopeFor([...graph.filter(x => x.id !== 'well'), entity('well', [['contains', 'deal']])], 'asset:deal'), /cycle/);
  assert.throws(() => scopeFor(graph.filter(x => x.id !== 'well'), 'asset:deal'), /dangling/);
});
const note = (uuid, refs, expired_at = null) => ({uuid, fact: uuid, expired_at, valid_at: null, invalid_at: null, fact_embedding: null, petry: {asset_refs: refs, type: 'note', attachments: [], supersedes: []}});
test('rollup oracle rejects duplicated multi-subject notes, ancestor leakage and lost evidence', () => {
  const records = [note('a', ['asset:case', 'asset:well']), note('b', ['asset:deal']), note('c', ['asset:outside']), note('old', ['asset:well'], '2026-01-01T00:00:00Z')];
  const artifact = {petry_dependencies: {loaded_asset_refs: scopeFor(graph, 'asset:deal'), entity_scope: {mode: 'descendants'}}, activity: records.slice(0, 2)};
  assertRollup(artifact, records, graph, 'asset:deal');
  assertRollup({...artifact, activity: artifact.activity.map(observation => ({observation}))}, records, graph, 'asset:deal');
  assert.throws(() => assertRollup({...artifact, activity: [...artifact.activity, records[0]]}, records, graph, 'asset:deal'), /duplicate/);
  assert.throws(() => assertRollup({...artifact, activity: [...artifact.activity, records[2]]}, records, graph, 'asset:deal'));
  const child = {petry_dependencies: {loaded_asset_refs: ['asset:well'], entity_scope: {mode: 'direct'}}, activity: [records[0]]};
  assertRollup(child, records, graph, 'asset:well', 'direct');
  assert.throws(() => assertRollup({...child, activity: records.slice(0, 2)}, records, graph, 'asset:well', 'direct'));
});
test('revision oracle rejects in-place edits and damaged predecessors', () => {
  const before = note('old', ['asset:well']);
  before.petry.attachments = [{attachment_id: 'attachment', revision: 1}];
  const old = {...structuredClone(before), expired_at: '2026-09-06T15:00:00Z'};
  const next = {...structuredClone(before), uuid: 'new', petry: {...before.petry, attachments: [], supersedes: ['old']}};
  assert.equal(assertAttachmentRevision(before, [old, next], 0).uuid, 'new');
  assert.throws(() => assertAttachmentRevision(before, [before, next], 0), /not expired/);
  assert.throws(() => assertAttachmentRevision(before, [{...old, fact: 'rewritten'}, next], 0), /history altered/);
  assert.throws(() => assertAttachmentRevision(before, [old, {...next, fact: 'drift'}], 0));
});
test('attachment oracle rejects traversal, escaping symlinks, duplicate IDs and invalid managed locations', async () => {
  const root = await mkdtemp(join(tmpdir(), 'petry-attachment-test-'));
  const outside = await mkdtemp(join(tmpdir(), 'petry-outside-test-'));
  try {
    await mkdir(join(root, 'docs')); await writeFile(join(root, 'docs/file.bin'), Buffer.from([0, 255, 128]));
    await writeFile(join(outside, 'file.bin'), 'outside'); await symlink(outside, join(root, 'docs/escape'), process.platform === 'win32' ? 'junction' : 'dir');
    const a = {attachment_id: 'bc13b59a-f3e8-4d74-8a04-0f758b3e177b', revision: 1, name: 'file.bin', location: {kind: 'project_file', path: 'docs/file.bin'}};
    const record = attachments => ({petry: {attachments}});
    await assertLocalAttachments(root, record([a]));
    const managedPath = `.petry/attachments/${a.attachment_id}/1/file.bin`;
    await mkdir(join(root, `.petry/attachments/${a.attachment_id}/1`), {recursive: true});
    await writeFile(join(root, managedPath), Buffer.from([0, 255, 128]));
    await assertLocalAttachments(root, record([{...a, revision: 2, caption: 'Edited caption', location: {kind: 'managed_file', path: managedPath}}]));
    await assert.rejects(assertLocalAttachments(root, record([{...a, location: {...a.location, path: 'docs'}}])));
    await assert.rejects(assertLocalAttachments(root, record([a, a])));
    await assert.rejects(assertLocalAttachments(root, record([{...a, location: {...a.location, path: '../file.bin'}}])));
    await assert.rejects(assertLocalAttachments(root, record([{...a, location: {...a.location, path: 'docs/escape/file.bin'}}])));
    await assert.rejects(assertLocalAttachments(root, record([{...a, location: {...a.location, kind: 'managed_file'}}])));
  } finally { await rm(root, {recursive: true, force: true}); await rm(outside, {recursive: true, force: true}); }
});
