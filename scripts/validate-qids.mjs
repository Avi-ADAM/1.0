/**
 * CLI Script: Validate all qids.js queries against Strapi GraphQL schema.
 * 
 * Run with: node scripts/validate-qids.mjs
 *       or: npm run validate:qids
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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

// ─── Parse qids entries ───
function loadQids(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const entries = [];
  const regex = /['"]([^'"]+)['"]\s*:\s*`([^`]+)`/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    entries.push({ id: match[1], query: match[2] });
  }
  return entries;
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

const qidEntries = loadQids(join(ROOT, 'src/routes/api/send/qids.js'));
console.log(`📋 Found ${qidEntries.length} queries in qids.js\n`);

let errors = 0;
let warnings = 0;
let checked = 0;

for (const { id, query } of qidEntries) {
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
console.log(`  📊 ${checked} mutations validated`);
console.log(`  🔴 ${errors} errors | 🟡 ${warnings} warnings`);
console.log('═══════════════════════════════════════════\n');

if (errors > 0) {
  console.log('💡 Fix: Check src/generated/STRAPI_SCHEMA_REFERENCE.md');
  process.exit(1);
} else {
  console.log('✅ All mutations use valid schema fields!\n');
}
