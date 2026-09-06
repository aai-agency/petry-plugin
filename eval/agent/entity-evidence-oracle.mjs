import assert from 'node:assert/strict';
import { readFile, readdir, realpath, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { join, relative, isAbsolute } from 'node:path';

export async function readEntities(root) {
  const entities = await Promise.all((await readdir(join(root, '.petry/assets'))).filter(x => x.endsWith('.json')).map(async x => JSON.parse(await readFile(join(root, '.petry/assets', x), 'utf8'))));
  for (const entity of entities) {
    assert.match(entity.id, /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i);
    assert.equal(entity.ref, `asset:${entity.id}`);
  }
  assert.equal(new Set(entities.map(x => x.id)).size, entities.length);
  return entities;
}

// Independent reference traversal: includes each member once, never follows an
// inverse or arbitrary relationship, and rejects incomplete/cyclic graphs.
export function scopeFor(entities, rootRef, mode = 'descendants') {
  const byId = new Map(entities.map(x => [x.id, x]));
  const root = entities.find(x => x.ref === rootRef);
  assert.ok(root, 'missing root');
  const visited = new Set(); const stack = new Set(); const refs = [];
  function visit(entity) {
    assert.ok(entity, 'dangling relationship');
    if (entity.archived_at) return;
    assert.ok(!stack.has(entity.id), 'hierarchical cycle');
    if (visited.has(entity.id)) return;
    visited.add(entity.id); stack.add(entity.id); refs.push(entity.ref);
    if (mode === 'descendants') for (const edge of entity.relationships) {
      if (['contains', 'parent_of'].includes(edge.type)) visit(byId.get(edge.target_asset_id));
    }
    stack.delete(entity.id);
  }
  visit(root); return refs.sort();
}

export function assertRollup(artifact, records, entities, rootRef, mode = 'descendants') {
  const refs = scopeFor(entities, rootRef, mode);
  assert.equal(artifact.petry_dependencies.schema_version, 1);
  assert.equal(artifact.petry_dependencies.consumes_insights, true);
  assert.equal(artifact.petry_dependencies.includes_undated, true);
  assert.equal(artifact.petry_dependencies.loaded_world_window.from, null);
  assert.equal(artifact.petry_dependencies.loaded_world_window.to, null);
  assert.ok(artifact.petry_dependencies.insight_fields_used.includes('petry.attachments'));
  assert.deepEqual(artifact.petry_dependencies.entity_scope.root_asset_refs, [rootRef]);
  assert.deepEqual([...artifact.petry_dependencies.loaded_asset_refs].sort(), refs);
  assert.equal(artifact.petry_dependencies.entity_scope.mode, mode);
  const expected = records.filter(x => !x.expired_at && x.petry.asset_refs.some(ref => refs.includes(ref)));
  const activity = artifact.activity.map(x => x.observation ?? x);
  assert.equal(new Set(activity.map(x => x.uuid)).size, activity.length, 'duplicate rollup');
  assert.deepEqual(activity.map(x => x.uuid).sort(), expected.map(x => x.uuid).sort());
  for (const item of activity) {
    const original = expected.find(x => x.uuid === item.uuid);
    assert.equal(item.fact, original.fact);
    assert.deepEqual(item.petry.asset_refs, original.petry.asset_refs, 'rollup changed subjects');
    assert.deepEqual(item.petry.attachments ?? [], original.petry.attachments ?? []);
  }
}

export function assertAttachmentRevision(before, records, count) {
  const old = records.find(x => x.uuid === before.uuid);
  assert.ok(old?.expired_at, 'predecessor not expired');
  assert.deepEqual({...old, expired_at: before.expired_at}, before, 'history altered');
  const next = records.find(x => !x.expired_at && x.petry.supersedes?.includes(before.uuid));
  assert.ok(next, 'missing successor');
  for (const key of ['fact', 'valid_at', 'invalid_at', 'fact_embedding']) assert.deepEqual(next[key], before[key]);
  assert.deepEqual(next.petry.asset_refs, before.petry.asset_refs);
  assert.equal(next.petry.type, before.petry.type);
  assert.equal(next.petry.attachments.length, count);
  return next;
}

export async function assertLocalAttachments(root, record) {
  const ids = new Set(); const rootReal = await realpath(root);
  for (const attachment of record.petry.attachments ?? []) {
    assert.ok(!ids.has(attachment.attachment_id)); ids.add(attachment.attachment_id);
    assert.ok(Number.isInteger(attachment.revision) && attachment.revision > 0);
    assert.match(attachment.attachment_id, /^[a-f\d]{8}(?:-[a-f\d]{4}){3}-[a-f\d]{12}$/i);
    assert.ok(['managed_file', 'project_file'].includes(attachment.location.kind));
    assert.ok(!isAbsolute(attachment.location.path));
    assert.ok(!attachment.location.path.split(/[\\/]/).includes('..'));
    const resolved = await realpath(join(root, attachment.location.path));
    const info = await stat(resolved);
    assert.ok(info.isFile(), 'attachment is not a regular file');
    if (attachment.size_bytes != null) assert.equal(attachment.size_bytes, info.size);
    if (attachment.sha256 != null) assert.equal(attachment.sha256, createHash('sha256').update(await readFile(resolved)).digest('hex'));
    const rel = relative(rootReal, resolved);
    assert.ok(rel.split(/[\\/]/)[0] !== '..' && !isAbsolute(rel));
    if (attachment.location.kind === 'managed_file') {
      const parts = attachment.location.path.split('/');
      assert.equal(parts.length, 5);
      assert.equal(parts[0], '.petry'); assert.equal(parts[1], 'attachments');
      assert.equal(parts[2], attachment.attachment_id);
      assert.match(parts[3], /^[1-9]\d*$/);
      assert.ok(Number(parts[3]) <= attachment.revision, 'content revision cannot be newer than attachment');
    }
  }
}
