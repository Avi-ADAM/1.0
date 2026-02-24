---
description: "Validate code against Strapi GraphQL types - Check field names, types, and structure correctness"
---

# /validate-strapi-types

Use this workflow whenever you need to validate that code correctly uses Strapi types.

## Steps

1. **Read the schema reference** to understand available types:
   - Open `src/generated/STRAPI_SCHEMA_REFERENCE.md`
   - This contains a compact listing of ALL entities, their fields, and field types

2. **Identify which content types are being used** in the code you're reviewing:
   - Look for any Strapi entity names (e.g., `UsersPermissionsUser`, `Project`, `Act`, `OpenMission`, etc.)
   - Check for field access patterns like `.data?.attributes.fieldName`

3. **Validate field names** against the schema:
   - Verify each field name exists on the content type
   - ⚠️ Common misspellings to watch for:
     - `countries` → should be `cuntries`
     - `values` → should be `vallues`
     - `finished_missions` → should be `finnished_missions`
     - `name` on Act → should be `shem`
     - `status` on Ticket → should be `ticket_status`

4. **Validate field types** match the usage:
   - Relations returning single entities use `Maybe<XEntityResponse>` → access via `.data?.attributes`
   - Relations returning arrays use `Maybe<XRelationResponseCollection>` → access via `.data` (returns array)
   - Components use `Maybe<Array<Maybe<ComponentX>>>` → access directly (no `.data.attributes` wrapper)
   - Scalars: `String`, `Boolean`, `Int`, `Float`, `DateTime`, `Date`, `JSON`, `Long`

5. **Validate GraphQL query structure** if present:
   - Ensure queried fields exist in the schema
   - Ensure mutations use correct Input types (e.g., `ActInput`, `ProjectInput`)
   - Ensure filter queries use correct FiltersInput types

6. **Check import statements**:
   - Types should be imported from `$generated/graphql` or `../generated/graphql`
   - Helper types from `$lib/types/strapiTypes`
   - Query response types from `$lib/types/queryTypes`

7. **Report findings**:
   - List any field name mismatches
   - List any type mismatches
   - List any missing null checks (optional chaining)
   - Suggest corrections with the correct field names/types

## Quick Type Lookup

If you need to check a specific type quickly, use:
```
grep -n "export type TypeName = {" src/generated/graphql.ts
```

Then view the surrounding lines to see all fields.

## Automated Validation

### Runtime (automatic on dev server start)
The server automatically validates all qids.js queries when `npm run dev` starts.
Invalid field names will show ❌ errors in the console.

### CLI validation
```bash
npm run validate:qids
```

### Programmatic validation (in code)
```javascript
import { validateNewQuery, getTypeFields } from './qidsValidator.js'

// Validate before adding a new query
validateNewQuery('myNewQuery', `mutation CreateAct($shem: String) {
  createAct(data: { shem: $shem }) { data { id } }
}`);

// Look up available fields for a type
const fields = getTypeFields('ActInput');
console.log(fields); // ['dateF', 'dateS', 'des', 'forums', 'hashivut', ...]
```

## Regenerating Types

If the schema may have changed:
```bash
npm run types:update    # codegen + extract schema reference
npm run validate:qids   # verify all qids are still valid
```
