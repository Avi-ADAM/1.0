/**
 * CLI Script: Validate all qids.js queries against Strapi GraphQL schema.
 * 
 * Run with: node scripts/validate-qids.mjs
 *       or: npm run validate:qids
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { parse } from 'graphql';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

// ─── Parse types from graphql.ts ───
function loadInputTypes(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const inputTypes = new Map(); // typeName -> Set<fieldName>
  
  let currentType = null;
  let currentFields = new Set();
  let braceDepth = 0;
  let insideType = false;
  
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    
    const typeMatch = trimmed.match(/^export type (\w+)\s*=\s*\{/);
    if (typeMatch) {
      currentType = typeMatch[1];
      insideType = true;
      braceDepth = 1;
      currentFields = new Set();
      continue;
    }
    
    if (insideType) {
      for (const ch of trimmed) {
        if (ch === '{') braceDepth++;
        if (ch === '}') braceDepth--;
      }
      
      if (braceDepth === 1) {
        const fieldMatch = trimmed.match(/^(\w+)[\?]?\s*:\s*/);
        if (fieldMatch && fieldMatch[1] !== '__typename') {
          currentFields.add(fieldMatch[1]);
        }
      }
      
      if (braceDepth <= 0) {
        insideType = false;
        if (currentType.endsWith('Input') && !currentType.endsWith('FiltersInput')) {
          inputTypes.set(currentType, currentFields);
        }
        currentType = null;
      }
    }
  }
  
  return inputTypes;
}

// ─── Load qids entries ───
// The module is imported rather than regex-scraped so that template
// interpolations (${NOT_ARCHIVED} and friends) are already resolved — the
// string here is byte-for-byte what /api/send sends to Strapi.
async function loadQids(filePath) {
  const mod = await import(pathToFileURL(filePath).href);
  return Object.entries(mod.qids).map(([id, query]) => ({ id, query }));
}

// ─── Extract mutation data fields ───
function extractDataFields(queryStr) {
  const fields = [];
  const dataRegex = /data\s*:\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/;
  const match = queryStr.match(dataRegex);
  if (match) {
    const fieldRegex = /\b(\w+)\s*:/g;
    let m;
    while ((m = fieldRegex.exec(match[1])) !== null) {
      if (!['data', 'attributes', 'id', 'meta', 'eq', 'ne', 'in'].includes(m[1])) {
        fields.push(m[1]);
      }
    }
  }
  return [...new Set(fields)];
}

// ─── Find mutation operations ───
function findMutations(queryStr) {
  const ops = [];
  const regex = /\b(create|update)(\w+)\s*\(/g;
  let match;
  while ((match = regex.exec(queryStr)) !== null) {
    ops.push({ action: match[1], entity: match[2] });
  }
  return ops;
}

// ═══ MAIN ═══
console.log('🔍 Validating qids.js against Strapi GraphQL schema...\n');

const inputTypes = loadInputTypes(join(ROOT, 'src/generated/graphql.ts'));
console.log(`📊 Loaded ${inputTypes.size} Input types from schema`);

const qidEntries = await loadQids(join(ROOT, 'src/routes/api/send/qids.js'));
console.log(`📋 Found ${qidEntries.length} queries in qids.js\n`);

let errors = 0;
let warnings = 0;
let checked = 0;
let syntaxErrors = 0;

// ─── Pass 1: is every qid valid GraphQL? ───
// The field checks below are regex-based and happily accept a query that no
// parser would. Strapi does not: it answers a malformed query with
// "Syntax Error: …", which surfaces as a 500 from /api/send.
for (const { id, query } of qidEntries) {
  if (typeof query !== 'string') {
    syntaxErrors++;
    console.log(`  ❌ [${id}] is not a string (got ${typeof query})`);
    continue;
  }
  try {
    parse(query);
  } catch (err) {
    syntaxErrors++;
    const at = err.locations?.[0];
    console.log(`  ❌ [${id}] ${err.message.split('\n')[0]}${at ? ` (line ${at.line}, column ${at.column})` : ''}`);
  }
}
if (syntaxErrors === 0) console.log('✅ All queries parse as valid GraphQL');
console.log('');

// ─── Pass 2: do mutation input fields exist on the schema? ───
for (const { id, query } of qidEntries) {
  if (typeof query !== 'string') continue;
  const mutations = findMutations(query);
  
  for (const { action, entity } of mutations) {
    checked++;
    const inputName = `${entity}Input`;
    const inputFields = inputTypes.get(inputName);
    
    if (!inputFields) {
      warnings++;
      console.log(`  ⚠️  [${id}] Input type '${inputName}' not found in schema`);
      continue;
    }
    
    const dataFields = extractDataFields(query);
    for (const field of dataFields) {
      if (field === 'publishedAt') continue; // always allowed
      if (!inputFields.has(field)) {
        errors++;
        console.log(`  ❌ [${id}] Field '${field}' does NOT exist on '${inputName}'`);
        console.log(`     Available: ${[...inputFields].join(', ')}\n`);
      }
    }
  }
}

console.log('\n═══════════════════════════════════════════');
console.log(`  📊 ${qidEntries.length} queries parsed | ${checked} mutations validated`);
console.log(`  🔴 ${syntaxErrors} syntax errors | ${errors} field errors | 🟡 ${warnings} warnings`);
console.log('═══════════════════════════════════════════\n');

if (syntaxErrors > 0 || errors > 0) {
  if (errors > 0) console.log('💡 Fix: Check src/generated/STRAPI_SCHEMA_REFERENCE.md');
  process.exit(1);
} else {
  console.log('✅ All mutations use valid schema fields!\n');
}
