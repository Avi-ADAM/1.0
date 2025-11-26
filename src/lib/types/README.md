# Strapi TypeScript Types - Usage Guide

This guide explains how to use TypeScript types with Strapi GraphQL queries in your SvelteKit components.

## Table of Contents

- [Quick Start](#quick-start)
- [Type Helper Utilities](#type-helper-utilities)
- [Runtime Validation](#runtime-validation)
- [Common Patterns](#common-patterns)
- [Working with Relations](#working-with-relations)
- [Working with Components](#working-with-components)
- [Troubleshooting](#troubleshooting)

## Quick Start

### Basic Usage

```typescript
import { sendToSer } from '$lib/send/sendToSer.js';
import type { UserProjectListResponse } from '$lib/types/queryTypes';

// Make a typed GraphQL query
const response: UserProjectListResponse = await sendToSer(
  { uid: userId },
  "64getUserProjectList",
  0,
  0,
  false,
  fetch
);

// Access data with full type safety and autocomplete
const projects = response.data.usersPermissionsUser.data?.attributes.projects_1s.data;
projects?.forEach(project => {
  console.log(project.attributes.projectName); // ✓ Type-safe!
});
```

### Using in Svelte Components

```svelte
<script>
  import { sendToSer } from '$lib/send/sendToSer.js';
  
  /** @type {import('$lib/types/queryTypes').UserProjectListResponse} */
  let projectsData;
  
  async function loadProjects() {
    projectsData = await sendToSer(
      { uid: userId },
      "64getUserProjectList",
      0,
      0,
      false,
      fetch
    );
  }
</script>

{#if projectsData?.data.usersPermissionsUser.data}
  {#each projectsData.data.usersPermissionsUser.data.attributes.projects_1s.data as project}
    <div>{project.attributes.projectName}</div>
  {/each}
{/if}
```

## Type Helper Utilities

The `strapiTypes.ts` module provides utilities to work with Strapi's nested structure.

### StrapiResponse

Wraps all GraphQL query responses:

```typescript
import type { StrapiResponse } from '$lib/types/strapiTypes';

type MyQueryResponse = StrapiResponse<{
  usersPermissionsUser: StrapiEntity<{
    username: string;
    email: string;
  }>;
}>;
```

### StrapiEntity

For single entity queries:

```typescript
import type { StrapiEntity } from '$lib/types/strapiTypes';

type UserEntity = StrapiEntity<{
  username: string;
  email: string;
  bio: string | null;
}>;

// Structure: { data: { id: string; attributes: { username, email, bio } } | null }
```

### StrapiCollection

For collection (array) queries:

```typescript
import type { StrapiCollection } from '$lib/types/strapiTypes';

type ProjectsCollection = StrapiCollection<{
  projectName: string;
  createdAt: string;
}>;

// Structure: { data: Array<{ id: string; attributes: { projectName, createdAt } }> }
```

### StrapiMedia

For media/file fields:

```typescript
import type { StrapiMedia } from '$lib/types/strapiTypes';

type ProfilePicture = StrapiMedia<{
  url: string;
  name: string;
  width: number;
  height: number;
}>;

// Access: profilePic.data?.attributes.url
```

### Flattening Utilities

These helpers remove the nested `data.attributes` structure:

```typescript
import type { FlattenEntity, FlattenRelation, FlattenRelationArray } from '$lib/types/strapiTypes';

// Before: { data: { id: "1", attributes: { username: "john" } } }
// After: { id: "1", username: "john" }
type FlatUser = FlattenEntity<UserEntity>;

// For single relations
type FlatProject = FlattenRelation<ProjectRelation>;

// For collection relations
type FlatProjects = FlattenRelationArray<ProjectsRelation>;
```

## Runtime Validation

While TypeScript provides compile-time type safety, runtime validation ensures that API responses actually match the expected structure. The `validation.ts` module provides Yup schemas that match the TypeScript types.

### Why Use Runtime Validation?

1. **API Changes**: Detect when the backend API structure changes
2. **Data Integrity**: Ensure data is in the expected format before processing
3. **Error Handling**: Provide clear error messages when data is invalid
4. **Type Safety**: Validate data at runtime, not just compile time

### Basic Validation

```typescript
import { sendToSer } from '$lib/send/sendToSer.js';
import { validateResponse, userProjectListResponseSchema } from '$lib/types/validation';
import type { UserProjectListResponse } from '$lib/types/queryTypes';

async function getUserProjects(userId: string) {
  // Fetch data from API
  const rawResponse = await sendToSer(
    { uid: userId },
    "64getUserProjectList",
    0,
    0,
    false,
    fetch
  );
  
  // Validate the response
  try {
    const validatedResponse: UserProjectListResponse = await validateResponse(
      userProjectListResponseSchema,
      rawResponse
    );
    
    // Now you can safely use the data
    return validatedResponse.data.usersPermissionsUser.data?.attributes.projects_1s.data ?? [];
  } catch (error) {
    console.error('Validation failed:', error.message);
    throw new Error('Invalid API response structure');
  }
}
```

### Safe Validation (No Exceptions)

Use `safeValidate` when you want to handle validation errors without try-catch:

```typescript
import { safeValidate, projectDetailsResponseSchema } from '$lib/types/validation';

async function getProjectDetails(projectId: string) {
  const rawResponse = await sendToSer(
    { id: projectId },
    "49GetProjectById",
    0,
    0,
    false,
    fetch
  );
  
  const result = await safeValidate(projectDetailsResponseSchema, rawResponse);
  
  if (result.success) {
    // Data is valid
    const project = result.data.data.project.data?.attributes;
    return project;
  } else {
    // Handle validation errors
    console.error('Validation errors:', result.errors.errors);
    return null;
  }
}
```

### Type Guard Validation

Use `isValidResponse` as a type guard:

```typescript
import { isValidResponse, userDetailsResponseSchema } from '$lib/types/validation';
import type { UserDetailsResponse } from '$lib/types/queryTypes';

async function getUserDetails(userId: string) {
  const rawResponse = await sendToSer(
    { id: userId },
    "52GetUserById",
    0,
    0,
    false,
    fetch
  );
  
  if (isValidResponse(userDetailsResponseSchema, rawResponse)) {
    // TypeScript knows rawResponse is UserDetailsResponse
    const user = rawResponse.data.usersPermissionsUser.data?.attributes;
    return user;
  } else {
    throw new Error('Invalid user data');
  }
}
```

### Synchronous Validation

For synchronous validation (useful in derived stores or computed values):

```typescript
import { validateResponseSync, checkProjectMembershipResponseSchema } from '$lib/types/validation';

function processProjectMembership(rawData: unknown) {
  try {
    const validData = validateResponseSync(checkProjectMembershipResponseSchema, rawData);
    return validData.data.usersPermissionsUser.data?.attributes.projects_1s.data ?? [];
  } catch (error) {
    console.error('Invalid data:', error.message);
    return [];
  }
}
```

### Available Validation Schemas

The following schemas are available in `validation.ts`:

- `userProjectListResponseSchema` - For getUserProjectList query
- `checkProjectMembershipResponseSchema` - For checkProjectMembership query
- `projectDetailsResponseSchema` - For GetProjectById query
- `userDetailsResponseSchema` - For GetUserById query
- `openMissionDetailsResponseSchema` - For GetOpenMissionById query
- `missionsOnProgressResponseSchema` - For GetMissionsOnProgress query
- `negotiationDetailsResponseSchema` - For GetNegotiation query

### Creating Custom Validation Schemas

You can create your own validation schemas for custom queries:

```typescript
import { 
  createStrapiResponseSchema, 
  createStrapiEntitySchema, 
  createStrapiCollectionSchema,
  strapiMediaSchema
} from '$lib/types/validation';
import * as yup from 'yup';

// Define your custom schema
export const myCustomQuerySchema = createStrapiResponseSchema(
  yup.object({
    myContentType: createStrapiEntitySchema(
      yup.object({
        title: yup.string().required(),
        description: yup.string().required(),
        publishedAt: yup.string().nullable().default(null),
        coverImage: strapiMediaSchema.optional(),
        tags: createStrapiCollectionSchema(
          yup.object({
            name: yup.string().required()
          })
        ).required()
      })
    ).required()
  })
);

// Use it
const result = await validateResponse(myCustomQuerySchema, apiResponse);
```

### Validation in Svelte Components

```svelte
<script>
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { safeValidate, userProjectListResponseSchema } from '$lib/types/validation';
  
  let projects = $state([]);
  let error = $state(null);
  
  async function loadProjects() {
    const rawResponse = await sendToSer(
      { uid: userId },
      "64getUserProjectList",
      0,
      0,
      false,
      fetch
    );
    
    const result = await safeValidate(userProjectListResponseSchema, rawResponse);
    
    if (result.success) {
      projects = result.data.data.usersPermissionsUser.data?.attributes.projects_1s.data ?? [];
      error = null;
    } else {
      error = 'Failed to load projects: Invalid data structure';
      console.error(result.errors);
    }
  }
</script>

{#if error}
  <div class="error">{error}</div>
{:else}
  {#each projects as project}
    <div>{project.attributes.projectName}</div>
  {/each}
{/if}
```

### Validation Best Practices

1. **Validate at API boundaries**: Always validate data when it enters your application
2. **Use safe validation in UI**: Use `safeValidate` in components to avoid crashes
3. **Log validation errors**: Always log validation errors for debugging
4. **Fail gracefully**: Provide fallback values or error states when validation fails
5. **Validate critical paths**: Focus validation on critical user flows first
6. **Custom error messages**: Provide user-friendly error messages, not raw validation errors

### Validation Error Handling

```typescript
import { validateResponse, userDetailsResponseSchema } from '$lib/types/validation';
import { ValidationError } from 'yup';

async function getUserWithErrorHandling(userId: string) {
  try {
    const rawResponse = await sendToSer(
      { id: userId },
      "52GetUserById",
      0,
      0,
      false,
      fetch
    );
    
    const validData = await validateResponse(userDetailsResponseSchema, rawResponse);
    return validData.data.usersPermissionsUser.data?.attributes;
  } catch (error) {
    if (error instanceof ValidationError) {
      // Handle validation errors specifically
      console.error('Data validation failed:');
      error.errors.forEach(err => console.error('  -', err));
      
      // You can also access specific error details
      console.error('Validation details:', error.inner);
    } else {
      // Handle other errors (network, etc.)
      console.error('Failed to fetch user:', error);
    }
    
    return null;
  }
}
```

### Performance Considerations

- **Validation overhead**: Validation adds minimal overhead (~1-5ms for typical responses)
- **Async vs Sync**: Use async validation for large responses, sync for small ones
- **Selective validation**: You don't need to validate every response - focus on critical paths
- **Development vs Production**: Consider more aggressive validation in development, lighter in production

## Common Patterns

### Pattern 1: Fetching User Projects

```typescript
import { sendToSer } from '$lib/send/sendToSer.js';
import type { UserProjectListResponse } from '$lib/types/queryTypes';

async function getUserProjects(userId: string) {
  const response: UserProjectListResponse = await sendToSer(
    { uid: userId },
    "64getUserProjectList",
    0,
    0,
    false,
    fetch
  );
  
  const user = response.data.usersPermissionsUser.data;
  if (!user) {
    return [];
  }
  
  return user.attributes.projects_1s.data.map(project => ({
    id: project.id,
    name: project.attributes.projectName
  }));
}
```

### Pattern 2: Fetching Project Details

```typescript
import { sendToSer } from '$lib/send/sendToSer.js';
import type { ProjectDetailsResponse } from '$lib/types/queryTypes';

async function getProjectDetails(projectId: string) {
  const response: ProjectDetailsResponse = await sendToSer(
    { id: projectId },
    "49GetProjectById",
    0,
    0,
    false,
    fetch
  );
  
  const project = response.data.project.data?.attributes;
  if (!project) {
    throw new Error('Project not found');
  }
  
  return {
    name: project.projectName,
    description: project.publicDescription,
    website: project.linkToWebsite,
    profilePicUrl: project.profilePic.data?.attributes.url,
    members: project.user_1s.data.map(user => ({
      id: user.id,
      username: user.attributes.username,
      profilePicUrl: user.attributes.profilePic.data?.attributes.url
    })),
    values: project.vallues.data.map(value => ({
      id: value.id,
      name: value.attributes.valueName
    }))
  };
}
```

### Pattern 3: Checking Project Membership

```typescript
import { sendToSer } from '$lib/send/sendToSer.js';
import type { CheckProjectMembershipResponse } from '$lib/types/queryTypes';

async function isUserProjectMember(userId: string, projectId: string): Promise<boolean> {
  const response: CheckProjectMembershipResponse = await sendToSer(
    { uid: userId, projectId: projectId },
    "65checkProjectMembership",
    0,
    0,
    false,
    fetch
  );
  
  const projects = response.data.usersPermissionsUser.data?.attributes.projects_1s.data;
  return projects ? projects.length > 0 : false;
}
```

### Pattern 4: Working with Missions

```typescript
import { sendToSer } from '$lib/send/sendToSer.js';
import type { MissionsOnProgressResponse } from '$lib/types/queryTypes';

async function getActiveMissions(userId: string) {
  const response: MissionsOnProgressResponse = await sendToSer(
    { id: userId },
    "8getMissionsOnProgress",
    0,
    0,
    false,
    fetch
  );
  
  const missions = response.data.usersPermissionsUser.data?.attributes.mesimabetahaliches.data;
  if (!missions) {
    return [];
  }
  
  return missions.map(mission => {
    const timer = mission.attributes.activeTimer.data?.attributes;
    return {
      id: mission.id,
      name: mission.attributes.name,
      hoursAssigned: mission.attributes.hoursassinged,
      hoursWorked: mission.attributes.howmanyhoursalready,
      isTimerActive: timer?.isActive ?? false,
      projectName: mission.attributes.project.data?.attributes.projectName,
      projectPicUrl: mission.attributes.project.data?.attributes.profilePic.data?.attributes.url
    };
  });
}
```

## Working with Relations

### Single Relations (oneToOne, manyToOne)

```typescript
// Example: Project has one creator (user)
type ProjectWithCreator = {
  projectName: string;
  creator: StrapiEntity<{
    username: string;
    email: string;
  }>;
};

// Access the relation
const creatorUsername = project.creator.data?.attributes.username;
```

### Collection Relations (oneToMany, manyToMany)

```typescript
// Example: User has many projects
type UserWithProjects = {
  username: string;
  projects_1s: StrapiCollection<{
    projectName: string;
    createdAt: string;
  }>;
};

// Access the collection
const projects = user.projects_1s.data;
projects.forEach(project => {
  console.log(project.id, project.attributes.projectName);
});
```

### Nested Relations

```typescript
// Example: Project with members who have profile pictures
type ProjectWithMembers = {
  projectName: string;
  user_1s: StrapiCollection<{
    username: string;
    profilePic: StrapiMedia<{
      url: string;
    }>;
  }>;
};

// Access nested data
project.user_1s.data.forEach(user => {
  const username = user.attributes.username;
  const profileUrl = user.attributes.profilePic.data?.attributes.url;
  console.log(`${username}: ${profileUrl ?? 'No profile pic'}`);
});
```

## Working with Components

### Single Components

```typescript
import type { StrapiComponent } from '$lib/types/strapiTypes';

type Address = StrapiComponent<{
  street: string;
  city: string;
  zipCode: string;
}>;

// Components are not wrapped in data/attributes
const street = address.street;
```

### Repeatable Components

```typescript
import type { StrapiRepeatableComponent } from '$lib/types/strapiTypes';

type SocialLinks = StrapiRepeatableComponent<{
  platform: string;
  url: string;
}>;

// Repeatable components are arrays with id
socialLinks.forEach(link => {
  console.log(link.id, link.platform, link.url);
});
```

## Troubleshooting

### Error: Property does not exist on type

**Problem:**
```typescript
const name = response.data.project.attributes.projectName;
// Error: Property 'attributes' does not exist on type 'StrapiEntity<...>'
```

**Solution:**
Remember that entities are wrapped in `data`:
```typescript
const name = response.data.project.data?.attributes.projectName;
```

### Error: Object is possibly 'null' or 'undefined'

**Problem:**
```typescript
const url = project.profilePic.data.attributes.url;
// Error: Object is possibly 'null'
```

**Solution:**
Use optional chaining for nullable fields:
```typescript
const url = project.profilePic.data?.attributes.url;
// Or with nullish coalescing
const url = project.profilePic.data?.attributes.url ?? '/default-image.png';
```

### Error: Type 'X' is not assignable to type 'Y'

**Problem:**
```typescript
const projects: Array<string> = response.data.usersPermissionsUser.data.attributes.projects_1s.data;
// Error: Type mismatch
```

**Solution:**
Check the actual structure. Collections are arrays of objects with `id` and `attributes`:
```typescript
const projectNames: Array<string> = response.data.usersPermissionsUser.data?.attributes.projects_1s.data.map(
  p => p.attributes.projectName
) ?? [];
```

### Missing Type Definitions

**Problem:**
```typescript
import type { MyCustomQuery } from '$lib/types/queryTypes';
// Error: Module not found
```

**Solution:**
Create your own type definition in `queryTypes.ts`:
```typescript
export type MyCustomQueryResponse = StrapiResponse<{
  // Define your query structure here
}>;
```

### Working with Dynamic Queries

**Problem:**
You need to make a query but don't have a predefined type.

**Solution:**
Use a generic type or define it inline:
```typescript
type DynamicResponse = StrapiResponse<{
  [key: string]: any;
}>;

const response: DynamicResponse = await sendToSer(...);
```

Or define the type inline:
```typescript
const response: StrapiResponse<{
  myQuery: StrapiEntity<{
    field1: string;
    field2: number;
  }>;
}> = await sendToSer(...);
```

### Handling Localizations

**Problem:**
Working with localized content.

**Solution:**
Localizations are collections:
```typescript
type LocalizedValue = {
  valueName: string;
  localizations: StrapiCollection<{
    valueName: string;
  }>;
};

// Get localized name
const defaultName = value.valueName;
const localizedNames = value.localizations.data.map(loc => loc.attributes.valueName);
```

### Type Checking in JavaScript Files

**Problem:**
Want type checking in `.js` or `.svelte` files.

**Solution:**
Use JSDoc comments:
```javascript
/** @type {import('$lib/types/queryTypes').UserProjectListResponse} */
let response;

/**
 * @param {string} userId
 * @returns {Promise<import('$lib/types/queryTypes').UserProjectListResponse>}
 */
async function fetchProjects(userId) {
  return await sendToSer({ uid: userId }, "64getUserProjectList", 0, 0, false, fetch);
}
```

## JSDoc Type Hints in Existing Code

We've added comprehensive JSDoc type annotations to key files to provide type checking and autocomplete in JavaScript files without converting them to TypeScript.

### Using sendToSer with Type Hints

The `sendToSer` function now has full JSDoc documentation:

```javascript
import { sendToSer } from '$lib/send/sendToSer.js';

// The function signature provides autocomplete for parameters
/** @type {import('$lib/types/queryTypes').UserProjectListResponse} */
const result = await sendToSer(
  { uid: userId },      // arg: GraphQL variables
  "64getUserProjectList", // queId: Query ID from qids.js
  0,                    // me: User ID (reserved)
  0,                    // project: Project ID (reserved)
  false,                // isSer: Server-side flag
  fetch                 // fetch: Fetch function
);

// Now you get autocomplete on result
const projects = result.data.usersPermissionsUser.data?.attributes.projects_1s.data;
```

### Type Hints in Svelte Components

In your Svelte components, use JSDoc to annotate props and variables:

```svelte
<script>
  /**
   * @typedef {Object} Matana
   * @property {string} id
   * @property {Object} attributes
   * @property {string} attributes.name
   * @property {number} attributes.price
   */
  
  /** @type {Array<Matana>} */
  let { gifts = [] } = $props();
  
  /** @type {string | undefined} */
  let selectedGiftId = $state();
  
  function selectGift(id) {
    selectedGiftId = id;
  }
</script>

{#each gifts as gift}
  <button onclick={() => selectGift(gift.id)}>
    {gift.attributes.name} - ${gift.attributes.price}
  </button>
{/each}
```

### Type Hints in Server Load Functions

Server load functions now have JSDoc annotations for better type safety:

```javascript
/**
 * @param {Object} params
 * @param {Object} params.locals
 * @param {string} params.locals.uid - User ID
 * @param {string} params.locals.lang - Language code
 * @param {typeof globalThis.fetch} params.fetch
 * @returns {Promise<{ uid: string, data: any }>}
 */
export async function load({ locals, fetch }) {
  /** @type {import('$lib/types/queryTypes').UserProjectListResponse} */
  const response = await sendToSer(
    { uid: locals.uid },
    "64getUserProjectList",
    0,
    0,
    true,
    fetch
  );
  
  return {
    uid: locals.uid,
    data: response.data
  };
}
```

### Type Hints in Utility Functions

Utility functions like those in `levGraphQLQueries.js` now have comprehensive JSDoc:

```javascript
/**
 * Fetch main user data from the Strapi GraphQL API.
 * 
 * @param {string} baseUrl - The base URL of the Strapi API
 * @param {string} token - JWT authentication token
 * @param {string | number} idL - The user ID to fetch data for
 * @param {string} lang - Language code ('he' or 'en')
 * @returns {Promise<import('$lib/types/strapiTypes').StrapiResponse<any>>}
 * @throws {Error} If the HTTP request fails
 */
export async function fetchMainUserData(baseUrl, token, idL, lang) {
  // Implementation with full type checking
}
```

### Benefits of JSDoc Type Hints

1. **No Migration Required**: Keep your `.js` and `.svelte` files as-is
2. **IDE Autocomplete**: Get IntelliSense and autocomplete in VS Code
3. **Type Checking**: Catch type errors during development
4. **Documentation**: JSDoc serves as inline documentation
5. **Gradual Adoption**: Add types incrementally as needed

### Common JSDoc Patterns

**Importing Types:**
```javascript
/** @typedef {import('$lib/types/strapiTypes').StrapiEntity} StrapiEntity */
/** @typedef {import('$lib/types/strapiTypes').StrapiCollection} StrapiCollection */
```

**Defining Custom Types:**
```javascript
/**
 * @typedef {Object} ProjectMember
 * @property {string} id
 * @property {string} username
 * @property {string | null} profilePicUrl
 */
```

**Function Parameters and Returns:**
```javascript
/**
 * @param {string} projectId
 * @param {Array<ProjectMember>} members
 * @returns {Promise<boolean>}
 */
async function updateProjectMembers(projectId, members) {
  // Implementation
}
```

**Generic Types:**
```javascript
/**
 * @template T
 * @param {Array<T>} items
 * @param {(item: T) => boolean} predicate
 * @returns {Array<T>}
 */
function filterItems(items, predicate) {
  return items.filter(predicate);
}
```

**Optional and Nullable:**
```javascript
/**
 * @param {string} [optionalParam] - Optional parameter
 * @param {string | null} nullableParam - Can be null
 * @param {string | undefined} maybeUndefined - Can be undefined
 */
function example(optionalParam, nullableParam, maybeUndefined) {
  // Implementation
}
```

### GraphQL Query Field Names

**Problem:**
Getting errors about incorrect field names.

**Solution:**
Always use the correct Strapi field names:
- User projects: `projects_1s` (not `projects` or `projectcreates`)
- User permissions: `usersPermissionsUser` (camelCase)
- Check `qids.js` for the exact query structure

### Nested Data Access

**Problem:**
Deeply nested data is hard to access.

**Solution:**
Extract data step by step with proper null checks:
```typescript
const response: ProjectDetailsResponse = await sendToSer(...);

// Step 1: Get the project entity
const projectEntity = response.data.project.data;
if (!projectEntity) {
  return null;
}

// Step 2: Get the attributes
const project = projectEntity.attributes;

// Step 3: Access nested relations
const members = project.user_1s.data;
const values = project.vallues.data;

// Step 4: Map to simpler structure
const simplifiedProject = {
  id: projectEntity.id,
  name: project.projectName,
  memberCount: members.length,
  valueNames: values.map(v => v.attributes.valueName)
};
```

## Best Practices

1. **Always use optional chaining** for nullable fields: `data?.attributes.field`
2. **Check for null/undefined** before accessing nested data
3. **Use type annotations** in function signatures for better IDE support
4. **Create reusable type definitions** in `queryTypes.ts` for common queries
5. **Use JSDoc** in JavaScript files for type checking without converting to TypeScript
6. **Map complex responses** to simpler structures in your components
7. **Refer to existing query types** in `queryTypes.ts` as examples when creating new ones

## Migrating to TypeScript

If you're converting existing JavaScript components to use TypeScript with Strapi types, see the comprehensive [Migration Guide](./MIGRATION_GUIDE.md). It includes:

- Step-by-step migration process
- Before/after code examples
- Common migration patterns
- Solutions to common gotchas
- Testing and rollback strategies

## Additional Resources

- [Migration Guide](./MIGRATION_GUIDE.md) - Complete guide for converting components to TypeScript
- [Strapi GraphQL Documentation](https://docs.strapi.io/dev-docs/plugins/graphql)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [SvelteKit TypeScript Support](https://kit.svelte.dev/docs/types)

## Need Help?

If you encounter issues not covered in this guide:

1. Check the [Migration Guide](./MIGRATION_GUIDE.md) for step-by-step conversion instructions
2. Check the existing query types in `src/lib/types/queryTypes.ts` for examples
3. Review the GraphQL queries in `src/routes/api/send/qids.js`
4. Use TypeScript's error messages to understand what's expected
5. Test your queries in the GraphQL playground to verify the response structure
