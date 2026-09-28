#!/usr/bin/env node
/**
 * One-off: publish consensus rows that were saved as drafts.
 *
 * Every consensus content type (negotiation, position, argument, issue,
 * clause) has draft & publish on. Until the consensus client started sending
 * `publishedAt` on create, what it wrote landed as a draft — invisible to every
 * read, which runs in the default LIVE publication state. This finds those
 * drafts and sets their `publishedAt`.
 *
 *   node scripts/publish-consensus-drafts.mjs                      # dry run, all negotiations
 *   node scripts/publish-consensus-drafts.mjs --negotiation=2      # dry run, one negotiation
 *   node scripts/publish-consensus-drafts.mjs --negotiation=2 --apply
 *
 * Dry run by default: it lists what it would publish and writes nothing.
 *
 * Reads STRAPI_URL, CONSENSUS_PUBLIC_TOKEN (the token /api/send spends on
 * consensus qids — the admin token is not granted these types; ADMINMONTHER is
 * the fallback) and STRAPI_GATE_KEY
 * from the environment, falling back to `.env` in the working directory.
 * Point STRAPI_URL at the instance you mean — the default is local Strapi.
 *
 * Without a script: Strapi admin → Content Manager → the type → filter
 * "Published at" is null (or the Draft tab), select the rows → Publish.
 * Repeat for Negotiation, Position, Argument, Issue and Clause.
 */

import fs from 'node:fs';
import path from 'node:path';

function loadEnvFile(file) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z_0-9]*)\s*=\s*(.*)$/.exec(line);
    if (!m) continue;
    let value = m[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"') && value.length > 1) ||
      (value.startsWith("'") && value.endsWith("'") && value.length > 1)
    ) {
      value = value.slice(1, -1);
    }
    out[m[1]] = value;
  }
  return out;
}

const fileEnv = loadEnvFile(path.join(process.cwd(), '.env'));
const cfg = (name, fallback = '') => process.env[name] ?? fileEnv[name] ?? fallback;
const secret = (name) => String(cfg(name)).replace(/\s+/g, '').replace(new RegExp(`^${name}=`), '');

const args = process.argv.slice(2);
const APPLY = args.includes('--apply');
const negArg = args.find((a) => a.startsWith('--negotiation='));
const NEGOTIATION = negArg ? negArg.split('=')[1] : null;
if (negArg && !/^\d+$/.test(NEGOTIATION)) {
  console.error('--negotiation must be a numeric id');
  process.exit(1);
}

const STRAPI_URL = cfg('STRAPI_URL', 'http://127.0.0.1:1337').replace(/\/+$/, '');
const TOKEN = secret('CONSENSUS_PUBLIC_TOKEN') || secret('ADMINMONTHER');
const GATE = secret('STRAPI_GATE_KEY');
if (!TOKEN) {
  console.error('CONSENSUS_PUBLIC_TOKEN (or ADMINMONTHER) is not set (env or .env)');
  process.exit(1);
}

/**
 * Each type: its GraphQL collection + update mutation, and how to narrow it to
 * one negotiation (the negotiation itself by id, everything else by relation).
 */
const TYPES = [
  { name: 'negotiation', list: 'negotiations', update: 'updateNegotiation', label: 'topic', scope: (id) => ({ id: { eq: id } }) },
  { name: 'position', list: 'positions', update: 'updatePosition', label: 'heading', scope: (id) => ({ negotiation: { id: { eq: id } } }) },
  { name: 'argument', list: 'arguments', update: 'updateArgument', label: 'body', scope: (id) => ({ negotiation: { id: { eq: id } } }) },
  { name: 'issue', list: 'issues', update: 'updateIssue', label: 'title', scope: (id) => ({ negotiation: { id: { eq: id } } }) },
  { name: 'clause', list: 'clauses', update: 'updateClause', label: 'body', scope: (id) => ({ negotiation: { id: { eq: id } } }) }
];

async function gql(query, variables) {
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` };
  if (GATE) headers['x-strapi-gate'] = GATE;
  const res = await fetch(`${STRAPI_URL}/graphql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables })
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body || body.errors) {
    throw new Error(`Strapi ${res.status}: ${JSON.stringify(body?.errors ?? body)}`);
  }
  return body.data;
}

/** Page through every draft of one type. */
async function listDrafts(type) {
  const filters = { publishedAt: { null: true }, ...(NEGOTIATION ? type.scope(NEGOTIATION) : {}) };
  const rows = [];
  for (let page = 1; ; page++) {
    const data = await gql(
      `query Drafts($filters: ${cap(type.name)}FiltersInput, $page: Int) {
        ${type.list}(filters: $filters, publicationState: PREVIEW, pagination: { page: $page, pageSize: 100 }) {
          data { id attributes { ${type.label} } }
          meta { pagination { pageCount } }
        }
      }`,
      { filters, page }
    );
    const coll = data[type.list];
    rows.push(...coll.data);
    if (page >= (coll.meta?.pagination?.pageCount ?? 1)) break;
  }
  return rows;
}

function cap(s) {
  return s[0].toUpperCase() + s.slice(1);
}

async function publish(type, id, at) {
  await gql(
    `mutation Publish($id: ID!, $at: DateTime) { ${type.update}(id: $id, data: { publishedAt: $at }) { data { id } } }`,
    { id, at }
  );
}

const now = new Date().toISOString();
console.log(`${APPLY ? 'APPLY' : 'DRY RUN'} · ${STRAPI_URL}${NEGOTIATION ? ` · negotiation ${NEGOTIATION}` : ' · all negotiations'}\n`);

let total = 0;
let failed = 0;
const unreadable = [];
for (const type of TYPES) {
  let drafts;
  try {
    drafts = await listDrafts(type);
  } catch (e) {
    // Most often the token was never granted this type (Settings → API Tokens).
    unreadable.push(type.name);
    console.log(`${type.name}: cannot read — ${e.message}`);
    continue;
  }
  console.log(`${type.name}: ${drafts.length} draft(s)`);
  for (const row of drafts) {
    const label = String(row.attributes?.[type.label] ?? '').replace(/\s+/g, ' ').slice(0, 60);
    if (APPLY) {
      try {
        await publish(type, row.id, now);
        console.log(`  ✓ ${row.id}  ${label}`);
      } catch (e) {
        failed++;
        console.log(`  ✗ ${row.id}  ${e.message}`);
      }
    } else {
      console.log(`  · ${row.id}  ${label}`);
    }
    total++;
  }
}

console.log(`\n${total} draft(s)${APPLY ? ` processed, ${failed} failed` : ' — rerun with --apply to publish'}.`);
if (unreadable.length) {
  console.log(`Not checked (token has no access): ${unreadable.join(', ')} — publish those from the Strapi admin.`);
}
if (failed || unreadable.length) process.exit(1);
