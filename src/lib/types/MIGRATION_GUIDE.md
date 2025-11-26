# TypeScript Migration Guide for Strapi Types Integration

This guide provides a step-by-step process for converting existing JavaScript/Svelte components to use TypeScript with Strapi type definitions. It includes practical examples, common patterns, and solutions to common issues you'll encounter during migration.

## Table of Contents

- [Migration Strategy](#migration-strategy)
- [Step-by-Step Migration Process](#step-by-step-migration-process)
- [Before/After Examples](#beforeafter-examples)
- [Common Migration Patterns](#common-migration-patterns)
- [Migration Gotchas](#migration-gotchas)
- [Testing Your Migration](#testing-your-migration)
- [Rollback Strategy](#rollback-strategy)

## Migration Strategy

### Three Approaches to Type Safety

You can adopt types at your own pace using one of these three approaches:

1. **JSDoc Only (No Migration)** - Add type hints to existing `.js` and `.svelte` files
2. **Gradual TypeScript** - Convert critical files to `.ts` while keeping others as `.js` with JSDoc
3. **Full TypeScript** - Convert all files to `.ts` for maximum type safety

### Recommended Migration Order

Migrate components in this order to minimize risk and maximize benefit:

1. **Utility functions** - Pure functions with clear inputs/outputs
2. **Data fetching functions** - Functions that call `sendToSer`
3. **Server load functions** - `+page.server.js` files
4. **Simple components** - Components with minimal props and state
5. **Complex components** - Components with many props and nested data
6. **Store files** - Svelte stores (requires careful handling)

### When to Use Each Approach

**Use JSDoc when:**
- You want type safety without changing file extensions
- The component is stable and rarely changes
- You're working in a team that prefers JavaScript
- You want to test types before full migration

**Use TypeScript when:**
- You're creating new components
- The component has complex data structures
- You want maximum type safety and refactoring support
- The component is frequently modified

## Step-by-Step Migration Process

### Phase 1: Add JSDoc Type Hints (No File Changes)

This is the safest first step - you get type checking without changing any code structure.

#### Step 1.1: Enable Type Checking

Ensure `jsconfig.json` has type checking enabled:

```json
{
  "compilerOptions": {
    "checkJs": true,
    "strict": true
  }
}
```

#### Step 1.2: Add Type Imports

At the top of your file, import types using JSDoc:

```javascript
/**
 * @typedef {import('$lib/types/queryTypes').UserProjectListResponse} UserProjectListResponse
 * @typedef {import('$lib/types/strapiTypes').StrapiEntity} StrapiEntity
 */
```

#### Step 1.3: Annotate Variables

Add type annotations to variables:

```javascript
/** @type {UserProjectListResponse | null} */
let projectsData = null;

/** @type {string} */
let selectedProjectId = '';

/** @type {Array<{id: string, name: string}>} */
let simplifiedProjects = [];
```

#### Step 1.4: Annotate Functions

Add parameter and return type annotations:

```javascript
/**
 * Fetch user projects from the API
 * @param {string} userId - The user ID to fetch projects for
 * @param {typeof globalThis.fetch} fetch - The fetch function
 * @returns {Promise<UserProjectListResponse>}
 */
async function getUserProjects(userId, fetch) {
  return await sendToSer(
    { uid: userId },
    "64getUserProjectList",
    0,
    0,
    false,
    fetch
  );
}
```

### Phase 2: Convert to TypeScript (File Extension Change)

Once you're comfortable with JSDoc, you can convert files to TypeScript.

#### Step 2.1: Rename the File

```bash
# For utility files
mv src/lib/utils/myUtil.js src/lib/utils/myUtil.ts

# For Svelte components (script tag only)
# Keep the .svelte extension, add lang="ts" to script tag
```

#### Step 2.2: Convert JSDoc to TypeScript

**Before (JSDoc):**
```javascript
/**
 * @param {string} userId
 * @param {typeof globalThis.fetch} fetch
 * @returns {Promise<UserProjectListResponse>}
 */
async function getUserProjects(userId, fetch) {
  // ...
}
```

**After (TypeScript):**
```typescript
import type { UserProjectListResponse } from '$lib/types/queryTypes';

async function getUserProjects(
  userId: string,
  fetch: typeof globalThis.fetch
): Promise<UserProjectListResponse> {
  // ...
}
```

#### Step 2.3: Add Type Annotations

Replace JSDoc type comments with TypeScript syntax:

**Before:**
```javascript
/** @type {UserProjectListResponse | null} */
let projectsData = null;
```

**After:**
```typescript
let projectsData: UserProjectListResponse | null = null;
```

#### Step 2.4: Handle Null/Undefined

TypeScript is stricter about null/undefined. Add proper checks:

**Before:**
```javascript
const projects = response.data.usersPermissionsUser.data.attributes.projects_1s.data;
```

**After:**
```typescript
const user = response.data.usersPermissionsUser.data;
if (!user) {
  return [];
}
const projects = user.attributes.projects_1s.data;
```

### Phase 3: Migrate Svelte Components

Svelte components require special handling.

#### Step 3.1: Add lang="ts" to Script Tag

```svelte
<script lang="ts">
  // TypeScript code here
</script>
```

#### Step 3.2: Convert Props (Svelte 4)

**Before:**
```svelte
<script>
  export let userId;
  export let projectId = null;
</script>
```

**After:**
```svelte
<script lang="ts">
  export let userId: string;
  export let projectId: string | null = null;
</script>
```

#### Step 3.3: Convert Props (Svelte 5 Runes)

**Before:**
```svelte
<script>
  let { userId, projectId = null } = $props();
</script>
```

**After:**
```svelte
<script lang="ts">
  interface Props {
    userId: string;
    projectId?: string | null;
  }
  
  let { userId, projectId = null }: Props = $props();
</script>
```

#### Step 3.4: Type State Variables

**Before:**
```svelte
<script>
  let projects = $state([]);
  let loading = $state(false);
</script>
```

**After:**
```svelte
<script lang="ts">
  import type { ProjectDetailsResponse } from '$lib/types/queryTypes';
  
  type Project = {
    id: string;
    name: string;
    memberCount: number;
  };
  
  let projects = $state<Project[]>([]);
  let loading = $state<boolean>(false);
</script>
```

## Before/After Examples

### Example 1: Simple Data Fetching Function

**Before (JavaScript):**
```javascript
// src/lib/utils/projectUtils.js
import { sendToSer } from '$lib/send/sendToSer.js';

export async function getUserProjects(userId, fetch) {
  const response = await sendToSer(
    { uid: userId },
    "64getUserProjectList",
    0,
    0,
    false,
    fetch
  );
  
  const projects = response.data.usersPermissionsUser.data.attributes.projects_1s.data;
  return projects.map(p => ({
    id: p.id,
    name: p.attributes.projectName
  }));
}
```

**After (TypeScript):**
```typescript
// src/lib/utils/projectUtils.ts
import { sendToSer } from '$lib/send/sendToSer.js';
import type { UserProjectListResponse } from '$lib/types/queryTypes';

interface SimplifiedProject {
  id: string;
  name: string;
}

export async function getUserProjects(
  userId: string,
  fetch: typeof globalThis.fetch
): Promise<SimplifiedProject[]> {
  const response = await sendToSer(
    { uid: userId },
    "64getUserProjectList",
    0,
    0,
    false,
    fetch
  ) as UserProjectListResponse;
  
  const user = response.data.usersPermissionsUser.data;
  if (!user) {
    return [];
  }
  
  const projects = user.attributes.projects_1s.data;
  return projects.map(p => ({
    id: p.id,
    name: p.attributes.projectName
  }));
}
```

### Example 2: Server Load Function

**Before (JavaScript):**
```javascript
// src/routes/projects/+page.server.js
import { sendToSer } from '$lib/send/sendToSer.js';

export async function load({ locals, fetch }) {
  const response = await sendToSer(
    { uid: locals.uid },
    "64getUserProjectList",
    0,
    0,
    true,
    fetch
  );
  
  return {
    projects: response.data.usersPermissionsUser.data?.attributes.projects_1s.data || []
  };
}
```

**After (TypeScript):**
```typescript
// src/routes/projects/+page.server.ts
import { sendToSer } from '$lib/send/sendToSer.js';
import type { UserProjectListResponse } from '$lib/types/queryTypes';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, fetch }) => {
  const response = await sendToSer(
    { uid: locals.uid },
    "64getUserProjectList",
    0,
    0,
    true,
    fetch
  ) as UserProjectListResponse;
  
  const user = response.data.usersPermissionsUser.data;
  const projects = user?.attributes.projects_1s.data ?? [];
  
  return {
    projects
  };
};
```

### Example 3: Svelte Component with Data Fetching

**Before (JavaScript):**
```svelte
<!-- src/lib/components/ProjectList.svelte -->
<script>
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { onMount } from 'svelte';
  
  export let userId;
  
  let projects = [];
  let loading = true;
  let error = null;
  
  onMount(async () => {
    try {
      const response = await sendToSer(
        { uid: userId },
        "64getUserProjectList",
        0,
        0,
        false,
        fetch
      );
      
      projects = response.data.usersPermissionsUser.data?.attributes.projects_1s.data || [];
    } catch (e) {
      error = e.message;
    } finally {
      loading = false;
    }
  });
</script>

{#if loading}
  <p>Loading...</p>
{:else if error}
  <p>Error: {error}</p>
{:else}
  <ul>
    {#each projects as project}
      <li>{project.attributes.projectName}</li>
    {/each}
  </ul>
{/if}
```

**After (TypeScript with Svelte 5 Runes):**
```svelte
<!-- src/lib/components/ProjectList.svelte -->
<script lang="ts">
  import { sendToSer } from '$lib/send/sendToSer.js';
  import type { UserProjectListResponse } from '$lib/types/queryTypes';
  
  interface Props {
    userId: string;
  }
  
  let { userId }: Props = $props();
  
  type ProjectData = {
    id: string;
    attributes: {
      projectName: string;
    };
  };
  
  let projects = $state<ProjectData[]>([]);
  let loading = $state<boolean>(true);
  let error = $state<string | null>(null);
  
  $effect(() => {
    async function loadProjects() {
      try {
        const response = await sendToSer(
          { uid: userId },
          "64getUserProjectList",
          0,
          0,
          false,
          fetch
        ) as UserProjectListResponse;
        
        const user = response.data.usersPermissionsUser.data;
        projects = user?.attributes.projects_1s.data ?? [];
      } catch (e) {
        error = e instanceof Error ? e.message : 'Unknown error';
      } finally {
        loading = false;
      }
    }
    
    loadProjects();
  });
</script>

{#if loading}
  <p>Loading...</p>
{:else if error}
  <p>Error: {error}</p>
{:else}
  <ul>
    {#each projects as project}
      <li>{project.attributes.projectName}</li>
    {/each}
  </ul>
{/if}
```

### Example 4: Complex Component with Nested Data

**Before (JavaScript):**
```svelte
<!-- src/lib/components/ProjectDetails.svelte -->
<script>
  import { sendToSer } from '$lib/send/sendToSer.js';
  
  export let projectId;
  
  let project = null;
  
  async function loadProject() {
    const response = await sendToSer(
      { id: projectId },
      "49GetProjectById",
      0,
      0,
      false,
      fetch
    );
    
    project = response.data.project.data?.attributes;
  }
  
  $: if (projectId) loadProject();
</script>

{#if project}
  <h1>{project.projectName}</h1>
  <p>{project.publicDescription}</p>
  
  <h2>Members</h2>
  <ul>
    {#each project.user_1s.data as member}
      <li>
        {#if member.attributes.profilePic.data}
          <img src={member.attributes.profilePic.data.attributes.url} alt={member.attributes.username} />
        {/if}
        {member.attributes.username}
      </li>
    {/each}
  </ul>
  
  <h2>Values</h2>
  <ul>
    {#each project.vallues.data as value}
      <li>{value.attributes.valueName}</li>
    {/each}
  </ul>
{/if}
```

**After (TypeScript):**
```svelte
<!-- src/lib/components/ProjectDetails.svelte -->
<script lang="ts">
  import { sendToSer } from '$lib/send/sendToSer.js';
  import type { ProjectDetailsResponse } from '$lib/types/queryTypes';
  
  interface Props {
    projectId: string;
  }
  
  let { projectId }: Props = $props();
  
  type ProjectAttributes = NonNullable<
    ProjectDetailsResponse['data']['project']['data']
  >['attributes'];
  
  let project = $state<ProjectAttributes | null>(null);
  
  async function loadProject(): Promise<void> {
    const response = await sendToSer(
      { id: projectId },
      "49GetProjectById",
      0,
      0,
      false,
      fetch
    ) as ProjectDetailsResponse;
    
    project = response.data.project.data?.attributes ?? null;
  }
  
  $effect(() => {
    if (projectId) {
      loadProject();
    }
  });
</script>

{#if project}
  <h1>{project.projectName}</h1>
  <p>{project.publicDescription ?? 'No description'}</p>
  
  <h2>Members</h2>
  <ul>
    {#each project.user_1s.data as member}
      <li>
        {#if member.attributes.profilePic.data}
          <img 
            src={member.attributes.profilePic.data.attributes.url} 
            alt={member.attributes.username} 
          />
        {/if}
        {member.attributes.username}
      </li>
    {/each}
  </ul>
  
  <h2>Values</h2>
  <ul>
    {#each project.vallues.data as value}
      <li>{value.attributes.valueName}</li>
    {/each}
  </ul>
{/if}
```

## Common Migration Patterns

### Pattern 1: Extracting Types from Responses

When you need to work with a specific part of a response, extract the type:

```typescript
import type { ProjectDetailsResponse } from '$lib/types/queryTypes';

// Extract the project attributes type
type ProjectAttributes = NonNullable<
  ProjectDetailsResponse['data']['project']['data']
>['attributes'];

// Extract member type
type Member = ProjectAttributes['user_1s']['data'][number];

// Extract member attributes
type MemberAttributes = Member['attributes'];

// Now use these types
let project: ProjectAttributes | null = null;
let members: Member[] = [];
```

### Pattern 2: Creating Simplified Types

Often you want to transform API data into a simpler structure:

```typescript
import type { ProjectDetailsResponse } from '$lib/types/queryTypes';

// Define your simplified type
interface SimplifiedProject {
  id: string;
  name: string;
  description: string;
  memberCount: number;
  valueNames: string[];
}

// Create a transformation function
function simplifyProject(
  response: ProjectDetailsResponse
): SimplifiedProject | null {
  const projectData = response.data.project.data;
  if (!projectData) {
    return null;
  }
  
  const project = projectData.attributes;
  
  return {
    id: projectData.id,
    name: project.projectName,
    description: project.publicDescription ?? '',
    memberCount: project.user_1s.data.length,
    valueNames: project.vallues.data.map(v => v.attributes.valueName)
  };
}
```

### Pattern 3: Type Guards for Runtime Checks

Create type guards to safely check data at runtime:

```typescript
import type { StrapiEntity } from '$lib/types/strapiTypes';

// Type guard for checking if entity exists
function hasEntity<T>(
  entity: StrapiEntity<T>
): entity is { data: { id: string; attributes: T } } {
  return entity.data !== null;
}

// Usage
const response: UserDetailsResponse = await sendToSer(...);
const userEntity = response.data.usersPermissionsUser;

if (hasEntity(userEntity)) {
  // TypeScript knows userEntity.data is not null
  const username = userEntity.data.attributes.username;
}
```

### Pattern 4: Handling Optional Relations

Relations can be null, so handle them safely:

```typescript
// Bad - will crash if profilePic is null
const url = project.profilePic.data.attributes.url;

// Good - use optional chaining
const url = project.profilePic.data?.attributes.url;

// Better - provide fallback
const url = project.profilePic.data?.attributes.url ?? '/default-avatar.png';

// Best - create a helper function
function getProfilePicUrl(
  profilePic: StrapiMedia<{ url: string }>
): string {
  return profilePic.data?.attributes.url ?? '/default-avatar.png';
}

const url = getProfilePicUrl(project.profilePic);
```

### Pattern 5: Typing Event Handlers

Event handlers in Svelte need proper typing:

```svelte
<script lang="ts">
  function handleClick(event: MouseEvent): void {
    console.log('Clicked at', event.clientX, event.clientY);
  }
  
  function handleInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    console.log('Input value:', target.value);
  }
  
  function handleSubmit(event: SubmitEvent): void {
    event.preventDefault();
    const formData = new FormData(event.target as HTMLFormElement);
    // Process form data
  }
</script>

<button onclick={handleClick}>Click me</button>
<input oninput={handleInput} />
<form onsubmit={handleSubmit}>
  <!-- form fields -->
</form>
```

### Pattern 6: Typing Stores

Svelte stores need type parameters:

```typescript
// src/lib/stores/projectStore.ts
import { writable, derived } from 'svelte/store';
import type { Writable, Readable } from 'svelte/store';
import type { ProjectDetailsResponse } from '$lib/types/queryTypes';

type ProjectAttributes = NonNullable<
  ProjectDetailsResponse['data']['project']['data']
>['attributes'];

// Typed writable store
export const currentProject: Writable<ProjectAttributes | null> = writable(null);

// Typed derived store
export const projectMemberCount: Readable<number> = derived(
  currentProject,
  ($currentProject) => $currentProject?.user_1s.data.length ?? 0
);
```

## Migration Gotchas

### Gotcha 1: Strapi's Nested Structure

**Problem:** Forgetting the `data` wrapper around entities.

```typescript
// ❌ Wrong - missing .data
const username = response.data.usersPermissionsUser.attributes.username;

// ✅ Correct
const username = response.data.usersPermissionsUser.data?.attributes.username;
```

**Solution:** Always remember: `entity.data.attributes.field`

### Gotcha 2: Null vs Undefined

**Problem:** TypeScript distinguishes between `null` and `undefined`, but Strapi uses both.

```typescript
// ❌ Wrong - only checks for null
if (project.description !== null) {
  console.log(project.description);
}

// ✅ Correct - checks for both null and undefined
if (project.description != null) {
  console.log(project.description);
}

// ✅ Also correct - using optional chaining
console.log(project.description ?? 'No description');
```

**Solution:** Use `!= null` to check for both, or use optional chaining with nullish coalescing.

### Gotcha 3: Array Methods on Possibly Undefined

**Problem:** Calling array methods on data that might not exist.

```typescript
// ❌ Wrong - crashes if projects_1s.data is undefined
const projectNames = user.projects_1s.data.map(p => p.attributes.projectName);

// ✅ Correct - check first
const projectNames = user.projects_1s.data?.map(p => p.attributes.projectName) ?? [];
```

**Solution:** Always use optional chaining with array methods and provide fallback.

### Gotcha 4: Type Assertions vs Type Checking

**Problem:** Using `as` to force types without validation.

```typescript
// ❌ Dangerous - no runtime check
const response = await sendToSer(...) as UserProjectListResponse;

// ✅ Better - with runtime validation
import { validateResponse, userProjectListResponseSchema } from '$lib/types/validation';

const rawResponse = await sendToSer(...);
const response = await validateResponse(userProjectListResponseSchema, rawResponse);
```

**Solution:** Use runtime validation for API responses, not just type assertions.

### Gotcha 5: Generic Type Inference

**Problem:** TypeScript can't infer generic types from `sendToSer`.

```typescript
// ❌ Wrong - TypeScript doesn't know the return type
const response = await sendToSer({ uid: userId }, "64getUserProjectList", 0, 0, false, fetch);

// ✅ Correct - explicit type assertion
const response = await sendToSer(
  { uid: userId },
  "64getUserProjectList",
  0,
  0,
  false,
  fetch
) as UserProjectListResponse;

// ✅ Better - use typed wrapper
import { sendToSerTyped } from '$lib/send/sendToSerTyped';

const response = await sendToSerTyped<UserProjectListResponse>(
  { uid: userId },
  "64getUserProjectList",
  0,
  0,
  false,
  fetch
);
```

**Solution:** Use type assertions or the `sendToSerTyped` wrapper.

### Gotcha 6: Svelte 5 Runes Syntax

**Problem:** Using old Svelte 4 syntax with TypeScript.

```svelte
<!-- ❌ Wrong - Svelte 4 syntax -->
<script lang="ts">
  export let userId: string;
  let projects: Project[] = [];
</script>

<!-- ✅ Correct - Svelte 5 runes -->
<script lang="ts">
  interface Props {
    userId: string;
  }
  
  let { userId }: Props = $props();
  let projects = $state<Project[]>([]);
</script>
```

**Solution:** Use Svelte 5 runes syntax (`$props()`, `$state()`, `$derived()`, `$effect()`).

### Gotcha 7: Circular Dependencies

**Problem:** Type files importing from files that import from type files.

```typescript
// ❌ Wrong - circular dependency
// types/myTypes.ts
import { someFunction } from '$lib/utils/myUtil';

// utils/myUtil.ts
import type { MyType } from '$lib/types/myTypes';
```

**Solution:** Keep type files pure - only import other type files, never implementation files.

### Gotcha 8: Missing Type Definitions

**Problem:** Using a query that doesn't have a type definition yet.

```typescript
// ❌ Error - type doesn't exist
import type { MyCustomQueryResponse } from '$lib/types/queryTypes';
```

**Solution:** Create the type definition in `queryTypes.ts`:

```typescript
// Add to src/lib/types/queryTypes.ts
export type MyCustomQueryResponse = StrapiResponse<{
  myContentType: StrapiEntity<{
    field1: string;
    field2: number;
  }>;
}>;
```

### Gotcha 9: Readonly Arrays

**Problem:** TypeScript makes some arrays readonly, preventing mutations.

```typescript
// ❌ Error - can't push to readonly array
const projects = response.data.usersPermissionsUser.data?.attributes.projects_1s.data;
projects.push(newProject); // Error!

// ✅ Correct - create mutable copy
const projects = [...(response.data.usersPermissionsUser.data?.attributes.projects_1s.data ?? [])];
projects.push(newProject); // OK
```

**Solution:** Create a mutable copy if you need to mutate the array.

### Gotcha 10: Type Narrowing in Templates

**Problem:** TypeScript doesn't narrow types in Svelte templates.

```svelte
<script lang="ts">
  let user: User | null = $state(null);
</script>

<!-- ❌ Error - TypeScript still thinks user might be null -->
{#if user}
  <p>{user.username}</p> <!-- Error: Object is possibly 'null' -->
{/if}

<!-- ✅ Correct - use optional chaining -->
{#if user}
  <p>{user?.username}</p>
{/if}

<!-- ✅ Better - extract to variable -->
<script lang="ts">
  let user: User | null = $state(null);
  let username = $derived(user?.username);
</script>

{#if username}
  <p>{username}</p>
{/if}
```

**Solution:** Use optional chaining in templates or extract to derived variables.

## Testing Your Migration

### 1. Type Check

Run TypeScript compiler to check for errors:

```bash
# Check all TypeScript files
npx tsc --noEmit

# Check specific file
npx tsc --noEmit src/lib/utils/myUtil.ts
```

### 2. Build Check

Ensure the project still builds:

```bash
npm run build
```

### 3. Runtime Testing

Test the migrated components in the browser:

1. Navigate to pages using the migrated components
2. Test all user interactions
3. Check browser console for runtime errors
4. Verify data displays correctly

### 4. Regression Testing

If you have tests, run them:

```bash
npm run test
```

### 5. Type Coverage

Check how much of your codebase is typed:

```bash
# Install type coverage tool
npm install -D type-coverage

# Check coverage
npx type-coverage
```

## Rollback Strategy

If migration causes issues, you can easily rollback:

### For JSDoc Approach

Simply remove the JSDoc comments - the code still works without them.

### For TypeScript Files

1. Rename `.ts` back to `.js`:
   ```bash
   mv src/lib/utils/myUtil.ts src/lib/utils/myUtil.js
   ```

2. Remove type annotations:
   ```typescript
   // Before
   function myFunc(param: string): number {
     return param.length;
   }
   
   // After
   function myFunc(param) {
     return param.length;
   }
   ```

3. For Svelte components, remove `lang="ts"` and type annotations:
   ```svelte
   <!-- Before -->
   <script lang="ts">
     let count: number = 0;
   </script>
   
   <!-- After -->
   <script>
     let count = 0;
   </script>
   ```

### Git Rollback

If you committed the migration:

```bash
# Rollback last commit
git revert HEAD

# Or reset to before migration
git reset --hard <commit-hash>
```

## Migration Checklist

Use this checklist when migrating a file:

- [ ] File compiles without TypeScript errors
- [ ] All function parameters are typed
- [ ] All function return types are specified
- [ ] All variables have explicit or inferred types
- [ ] Null/undefined cases are handled with optional chaining
- [ ] API responses use proper Strapi types
- [ ] Event handlers have correct event types
- [ ] Props are properly typed (Svelte components)
- [ ] State variables are typed (Svelte components)
- [ ] File builds successfully
- [ ] Component renders correctly in browser
- [ ] All user interactions work as expected
- [ ] No console errors at runtime
- [ ] Tests pass (if applicable)

## Next Steps

After completing migration:

1. **Document patterns** - Add project-specific patterns to this guide
2. **Create examples** - Build example components for your team
3. **Set up CI** - Add type checking to your CI pipeline
4. **Train team** - Share this guide with your team
5. **Iterate** - Continue improving types as you learn

## Getting Help

If you encounter issues:

1. Check the [main README](./README.md) for type usage examples
2. Review existing typed queries in `queryTypes.ts`
3. Look at the validation examples in `validation.ts`
4. Check TypeScript error messages carefully - they're usually helpful
5. Use your IDE's "Go to Definition" to understand type structures

## Additional Resources

- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [Svelte TypeScript Guide](https://svelte.dev/docs/typescript)
- [SvelteKit TypeScript](https://kit.svelte.dev/docs/types)
- [Strapi GraphQL Documentation](https://docs.strapi.io/dev-docs/plugins/graphql)
