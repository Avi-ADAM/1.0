/**
 * GraphQL Query Validator for qids.js
 * 
 * This module wraps the qids object and validates each query/mutation
 * against the Strapi GraphQL schema at import time (server startup).
 * 
 * If a query references fields that don't exist on the Strapi schema,
 * it will log warnings (or throw in strict mode).
 * 
 * Usage:
 *   import { validatedQids, validateNewQuery } from './qidsValidator.js'
 */

import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ─── Lazy-loaded schema cache ───
let _schemaTypes = null;
let _inputTypes = null;
let _entityLookup = null;

/**
 * Parse the generated graphql.ts file and build a fast field lookup.
 * Only runs once, caches the result.
 */
function loadSchema() {
  if (_schemaTypes) return;
  
  try {
    const graphqlPath = join(__dirname, '../../../generated/graphql.ts');
    const content = readFileSync(graphqlPath, 'utf-8');
    
    _schemaTypes = new Map();
    _inputTypes = new Map();
    _entityLookup = new Map();
    
    let currentType = null;
    let currentFields = new Map();
    let braceDepth = 0;
    let insideType = false;
    
    const lines = content.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      
      const typeMatch = trimmed.match(/^export type (\w+)\s*=\s*\{/);
      if (typeMatch) {
        currentType = typeMatch[1];
        insideType = true;
        braceDepth = 1;
        currentFields = new Map();
        continue;
      }
      
      if (insideType) {
        for (const ch of trimmed) {
          if (ch === '{') braceDepth++;
          if (ch === '}') braceDepth--;
        }
        
        if (braceDepth === 1) {
          const fieldMatch = trimmed.match(/^(\w+)[\?]?\s*:\s*(.+?)[\;]?\s*$/);
          if (fieldMatch && fieldMatch[1] !== '__typename') {
            currentFields.set(fieldMatch[1], fieldMatch[2].replace(/;$/, '').trim());
          }
        }
        
        if (braceDepth <= 0) {
          insideType = false;
          const fieldSet = new Set(currentFields.keys());
          _schemaTypes.set(currentType, fieldSet);
          
          if (currentType.endsWith('Input') && !currentType.endsWith('FiltersInput')) {
            _inputTypes.set(currentType, fieldSet);
          }
          
          // Build entity lookup
          const lower = currentType.charAt(0).toLowerCase() + currentType.slice(1);
          _entityLookup.set(lower, currentType);
          _entityLookup.set(currentType, currentType);
          
          currentType = null;
        }
      }
    }
    
    // Add common Strapi-specific query name mappings
    const strapiMappings = {
      'usersPermissionsUser': 'UsersPermissionsUser',
      'usersPermissionsUsers': 'UsersPermissionsUser',
      'openMission': 'OpenMission', 'openMissions': 'OpenMission',
      'openMashaabim': 'OpenMashaabim',
      'mesimabetahalich': 'Mesimabetahalich', 'mesimabetahaliches': 'Mesimabetahalich',
      'finnishedMission': 'FinnishedMission', 'finnishedMissions': 'FinnishedMission',
      'pgishauser': 'Pgishauser', 'pgishausers': 'Pgishauser',
      'pgishauserpend': 'Pgishauserpend', 'pgishauserpends': 'Pgishauserpend',
      'matanot': 'Matanot', 'matanots': 'Matanot',
      'negotiation': 'Negotiation', 'negotiations': 'Negotiation',
      'machshir': 'Machshir', 'machshirs': 'Machshir',
      'forumLastSeen': 'ForumLastSeen', 'forumLastSeens': 'ForumLastSeen',
      'conventionText': 'ConventionText', 'conventionTexts': 'ConventionText',
      'welcomTop': 'WelcomTop', 'welcomTops': 'WelcomTop',
      'contentReleasesRelease': 'ContentReleasesRelease',
    };
    
    for (const [k, v] of Object.entries(strapiMappings)) {
      _entityLookup.set(k, v);
    }
    
  } catch (err) {
    console.warn('⚠️ [qidsValidator] Could not load GraphQL schema:', err.message);
    console.warn('   Schema validation will be skipped. Run: npm run codegen');
    _schemaTypes = new Map();
    _inputTypes = new Map();
    _entityLookup = new Map();
  }
}

/**
 * Extract fields from a GraphQL mutation's `data: { ... }` block.
 */
function extractMutationDataFields(queryStr) {
  const fields = [];
  const dataRegex = /data\s*:\s*\{([^{}]*(?:\{[^{}]*\}[^{}]*)*)\}/;
  const match = queryStr.match(dataRegex);
  
  if (match) {
    const dataContent = match[1];
    const fieldRegex = /\b(\w+)\s*:/g;
    let fieldMatch;
    while ((fieldMatch = fieldRegex.exec(dataContent)) !== null) {
      const name = fieldMatch[1];
      if (!['data', 'attributes', 'id', 'meta', 'eq', 'ne', 'in', 'true', 'false', 'null'].includes(name)) {
        fields.push(name);
      }
    }
  }
  
  return [...new Set(fields)];
}

/**
 * Find mutation operations in a query string.
 */
function findMutationOperations(queryStr) {
  const operations = [];
  const mutationRegex = /\b(create|update|delete)(\w+)\s*\(/g;
  let match;
  while ((match = mutationRegex.exec(queryStr)) !== null) {
    operations.push({
      action: match[1],
      entityName: match[2],
      fullName: match[1] + match[2]
    });
  }
  return operations;
}

/**
 * Validate a single GraphQL query/mutation string against the schema.
 * 
 * @param {string} qid - The query ID (key in qids object)
 * @param {string} queryStr - The GraphQL query string
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
export function validateQuery(qid, queryStr) {
  loadSchema();
  
  const result = { valid: true, errors: [], warnings: [] };
  
  if (!_schemaTypes || _schemaTypes.size === 0) {
    result.warnings.push('Schema not loaded - validation skipped');
    return result;
  }
  
  const isMutation = /^\s*mutation/i.test(queryStr);
  
  if (isMutation) {
    const operations = findMutationOperations(queryStr);
    
    for (const op of operations) {
      if (op.action === 'create' || op.action === 'update') {
        const inputTypeName = `${op.entityName}Input`;
        const inputFields = _inputTypes.get(inputTypeName);
        
        if (!inputFields) {
          result.warnings.push(`Input type '${inputTypeName}' not found in schema`);
          continue;
        }
        
        const dataFields = extractMutationDataFields(queryStr);
        
        for (const field of dataFields) {
          // publishedAt is always allowed even if not in the Input type
          if (field === 'publishedAt') continue;
          
          if (!inputFields.has(field)) {
            result.valid = false;
            result.errors.push(
              `Field '${field}' does NOT exist on '${inputTypeName}'. ` +
              `Available: ${[...inputFields].join(', ')}`
            );
          }
        }
      }
    }
  }
  
  return result;
}

/**
 * Validate a new query before adding it to qids.
 * Throws an error if the query has invalid fields.
 * 
 * @param {string} qid - The query ID
 * @param {string} queryStr - The GraphQL query string
 * @throws {Error} If the query is invalid
 */
export function validateNewQuery(qid, queryStr) {
  const result = validateQuery(qid, queryStr);
  
  if (!result.valid) {
    const errorMsg = [
      `❌ Query '${qid}' has invalid fields:`,
      ...result.errors.map(e => `  - ${e}`),
      '',
      '💡 Check src/generated/STRAPI_SCHEMA_REFERENCE.md for correct field names.',
      '   Run: npm run types:update  (to refresh schema)',
    ].join('\n');
    
    throw new Error(errorMsg);
  }
  
  if (result.warnings.length > 0) {
    console.warn(`⚠️ [${qid}]`, result.warnings.join('; '));
  }
}

/**
 * Validate ALL queries in a qids object and return results.
 * 
 * @param {Record<string, string>} qidsObj - The qids object
 * @param {{ strict?: boolean, silent?: boolean }} options
 * @returns {{ totalChecked: number, errors: Array, warnings: Array, valid: boolean }}
 */
export function validateAllQids(qidsObj, options = {}) {
  const { strict = false, silent = false } = options;
  
  loadSchema();
  
  let totalErrors = 0;
  let totalWarnings = 0;
  const allErrors = [];
  const allWarnings = [];
  
  for (const [qid, queryStr] of Object.entries(qidsObj)) {
    const result = validateQuery(qid, queryStr);
    
    if (!result.valid) {
      totalErrors += result.errors.length;
      allErrors.push({ qid, errors: result.errors });
      
      if (!silent) {
        console.error(`❌ [${qid}]`);
        result.errors.forEach(e => console.error(`   ${e}`));
      }
    }
    
    if (result.warnings.length > 0) {
      totalWarnings += result.warnings.length;
      allWarnings.push({ qid, warnings: result.warnings });
    }
  }
  
  if (!silent) {
    const checked = Object.keys(qidsObj).length;
    console.log(`\n📊 Validated ${checked} queries: ${totalErrors} errors, ${totalWarnings} warnings`);
    
    if (totalErrors > 0) {
      console.log('💡 Check src/generated/STRAPI_SCHEMA_REFERENCE.md for correct field names.');
    }
  }
  
  if (strict && totalErrors > 0) {
    throw new Error(`Schema validation failed: ${totalErrors} errors found in qids`);
  }
  
  return {
    totalChecked: Object.keys(qidsObj).length,
    errors: allErrors,
    warnings: allWarnings,
    valid: totalErrors === 0
  };
}

/**
 * Get available fields for a Strapi entity or input type.
 * Useful for AI agents and debugging.
 * 
 * @param {string} typeName - e.g., 'ActInput', 'UsersPermissionsUser', 'Project'
 * @returns {string[] | null} Array of field names, or null if type not found
 */
export function getTypeFields(typeName) {
  loadSchema();
  const fields = _schemaTypes.get(typeName);
  return fields ? [...fields] : null;
}

/**
 * Look up the correct entity type name from a query operation name.
 * 
 * @param {string} operationName - e.g., 'usersPermissionsUser', 'openMissions', 'project'
 * @returns {string | null} The entity type name, or null
 */
export function resolveEntityType(operationName) {
  loadSchema();
  return _entityLookup.get(operationName) || null;
}
