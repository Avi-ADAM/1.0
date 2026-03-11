/**
 * Script to extract and summarize all GraphQL types from the generated graphql.ts file.
 * Creates a compact reference file that AI agents can use to validate code against the schema.
 * 
 * Run with: node --loader ts-node/esm scripts/extract-graphql-types.mjs
 * Or simply: node scripts/extract-graphql-types.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = join(__dirname, '..');

const graphqlPath = join(ROOT, 'src', 'generated', 'graphql.ts');
const outputPath = join(ROOT, 'src', 'generated', 'STRAPI_SCHEMA_REFERENCE.md');

const content = readFileSync(graphqlPath, 'utf-8');
const lines = content.split('\n');

// ─── Parsing helpers ───
const entities = [];       // Content types (Act, Project, UsersPermissionsUser, etc.)
const components = [];     // Strapi components (ComponentDesisionEditPend, etc.)
const enums = [];          // Enum types
const inputs = [];         // Input types (*Input, *FiltersInput)
const filterInputs = [];   // Filter-specific inputs
const entityResponses = []; // EntityResponse / EntityResponseCollection
const utilityTypes = [];   // Scalars, Maybe, etc.

let currentType = null;
let currentFields = [];
let currentCategory = null;
let braceDepth = 0;
let insideType = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  const trimmed = line.trim();
  
  // Match type declarations
  const typeMatch = trimmed.match(/^export type (\w+)\s*=\s*\{/);
  const enumMatch = trimmed.match(/^export enum (\w+)\s*\{/);
  
  if (typeMatch) {
    const name = typeMatch[1];
    insideType = true;
    braceDepth = 1;
    currentFields = [];
    currentType = name;
    
    // Categorize
    if (name.startsWith('Component')) {
      currentCategory = 'component';
    } else if (name.endsWith('FiltersInput')) {
      currentCategory = 'filterInput';
    } else if (name.endsWith('Input') && !name.endsWith('FiltersInput')) {
      currentCategory = 'input';
    } else if (name.endsWith('EntityResponseCollection') || name.endsWith('EntityResponse')) {
      currentCategory = 'entityResponse';
    } else if (name.endsWith('RelationResponseCollection')) {
      currentCategory = 'entityResponse';
    } else if (name.endsWith('Entity')) {
      currentCategory = 'entityResponse';
    } else if (['Maybe', 'InputMaybe', 'Exact', 'MakeOptional', 'MakeMaybe', 'MakeEmpty', 'Incremental', 'Scalars'].includes(name)) {
      currentCategory = 'utility';
    } else if (name.endsWith('Args')) {
      currentCategory = 'args';
    } else {
      currentCategory = 'entity';
    }
    continue;
  }
  
  if (enumMatch) {
    const name = enumMatch[1];
    insideType = true;
    braceDepth = 1;
    currentFields = [];
    currentType = name;
    currentCategory = 'enum';
    continue;
  }
  
  if (insideType) {
    // Track brace depth
    for (const ch of trimmed) {
      if (ch === '{') braceDepth++;
      if (ch === '}') braceDepth--;
    }
    
    // Collect fields (top-level properties only)
    if (braceDepth === 1) {
      const fieldMatch = trimmed.match(/^(\w+)[\?]?\s*:\s*(.+?)[\;]?\s*$/);
      if (fieldMatch && fieldMatch[1] !== '__typename') {
        const fieldName = fieldMatch[1];
        let fieldType = fieldMatch[2].replace(/;$/, '').trim();
        // Simplify long types
        if (fieldType.length > 80) {
          fieldType = fieldType.substring(0, 77) + '...';
        }
        currentFields.push({ name: fieldName, type: fieldType });
      }
    }
    
    if (braceDepth <= 0) {
      insideType = false;
      const entry = { name: currentType, fields: currentFields };
      
      switch (currentCategory) {
        case 'component': components.push(entry); break;
        case 'enum': enums.push(entry); break;
        case 'input': inputs.push(entry); break;
        case 'filterInput': filterInputs.push(entry); break;
        case 'entityResponse': entityResponses.push(entry); break;
        case 'utility': utilityTypes.push(entry); break;
        case 'entity': entities.push(entry); break;
        // args types are skipped for brevity
      }
      
      currentType = null;
      currentFields = [];
      currentCategory = null;
    }
  }
}

// ─── Build markdown output ───
let md = `# Strapi GraphQL Schema Reference
> Auto-generated from \`src/generated/graphql.ts\`
> Last updated: ${new Date().toISOString().split('T')[0]}
> Source: \`codegen.ts\` → \`http://localhost:1337/graphql\`

This file provides a compact reference of all types available from the Strapi backend.
AI agents should use this to validate that code follows the correct schema.

---

## 📋 How to Use These Types

\`\`\`typescript
// Import types from the generated file
import type { UsersPermissionsUser, Project, Act } from '$generated/graphql';

// Or from the index
import type { UsersPermissionsUser } from '../generated/graphql';

// Use with Strapi helpers from src/lib/types/strapiTypes.ts
import type { StrapiEntity, StrapiCollection, StrapiMedia } from '$lib/types/strapiTypes';
\`\`\`

---

## 🏗️ Content Type Entities (${entities.length})

These are the main content types in the Strapi backend.

`;

for (const entity of entities) {
  md += `### ${entity.name}\n`;
  if (entity.fields.length > 0) {
    md += '| Field | Type |\n|-------|------|\n';
    for (const field of entity.fields) {
      md += `| \`${field.name}\` | \`${field.type}\` |\n`;
    }
  }
  md += '\n';
}

md += `---

## 🧩 Component Types (${components.length})

These are Strapi components (reusable field groups).

`;

for (const comp of components) {
  md += `### ${comp.name}\n`;
  if (comp.fields.length > 0) {
    md += '| Field | Type |\n|-------|------|\n';
    for (const field of comp.fields) {
      md += `| \`${field.name}\` | \`${field.type}\` |\n`;
    }
  }
  md += '\n';
}

md += `---

## 📝 Input Types (${inputs.length})

Used for creating/updating content.

`;

for (const input of inputs) {
  md += `### ${input.name}\n`;
  if (input.fields.length > 0) {
    md += '| Field | Type |\n|-------|------|\n';
    for (const field of input.fields) {
      md += `| \`${field.name}\` | \`${field.type}\` |\n`;
    }
  }
  md += '\n';
}

md += `---

## 🔍 Filter Input Types (${filterInputs.length})

Used for querying/filtering content. Each content type has a corresponding filter input.

<details>
<summary>Click to expand all ${filterInputs.length} filter types</summary>

`;

for (const filter of filterInputs) {
  md += `#### ${filter.name}\n`;
  md += `Fields: ${filter.fields.map(f => `\`${f.name}\``).join(', ')}\n\n`;
}

md += `</details>

---

## 📦 Entity Response Types (${entityResponses.length})

Wrapper types for GraphQL responses.

<details>
<summary>Click to expand all ${entityResponses.length} response types</summary>

`;

for (const resp of entityResponses) {
  md += `- **${resp.name}**: ${resp.fields.map(f => `\`${f.name}: ${f.type}\``).join(', ')}\n`;
}

md += `</details>

---

## 🔢 Enum Types (${enums.length})

<details>
<summary>Click to expand all ${enums.length} enum types</summary>

`;

for (const en of enums) {
  md += `- **${en.name}**: ${en.fields.map(f => `\`${f.name}\``).join(', ')}\n`;
}

md += `</details>

---

## 🛠️ Utility Types (${utilityTypes.length})

`;

for (const ut of utilityTypes) {
  md += `- **${ut.name}**: ${ut.fields.map(f => `\`${f.name}: ${f.type}\``).join(', ')}\n`;
}

md += `
---

## File Structure

\`\`\`
src/
├── generated/
│   ├── graphql.ts              # Auto-generated types (codegen) - ${lines.length} lines
│   ├── index.ts                # Re-export hub
│   └── STRAPI_SCHEMA_REFERENCE.md  # This file (AI agent reference)
├── lib/
│   ├── generated/
│   │   ├── contentTypes.d.ts   # Strapi content type definitions (server-side)
│   │   └── components.d.ts     # Strapi component definitions (server-side)
│   └── types/
│       ├── strapiTypes.ts      # Helper types (StrapiEntity, StrapiCollection, etc.)
│       ├── queryTypes.ts       # Pre-defined query response types
│       ├── validation.ts       # Yup runtime validation schemas
│       ├── chat.ts             # Chat-specific types
│       └── README.md           # Usage documentation
\`\`\`
`;

writeFileSync(outputPath, md, 'utf-8');

console.log(`✅ Schema reference generated: ${outputPath}`);
console.log(`   📊 Stats:`);
console.log(`   - ${entities.length} content type entities`);
console.log(`   - ${components.length} component types`);
console.log(`   - ${inputs.length} input types`);
console.log(`   - ${filterInputs.length} filter input types`);
console.log(`   - ${entityResponses.length} entity response types`);
console.log(`   - ${enums.length} enum types`);
console.log(`   - ${utilityTypes.length} utility types`);
console.log(`   - Total source: ${lines.length} lines`);
