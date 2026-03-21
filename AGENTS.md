## Project Configuration

- **Language**: TypeScript / JavaScript (JSDoc)
- **Frameworks**: Svelte 5, SvelteKit
- **Database / CMS**: Strapi (via GraphQL/QIDS)
- **Styling**: Tailwind CSS
- **Package Manager**: npm
- **Add-ons & Tools**: prettier, eslint, vitest, devtools-json, mdsvex, paraglide, Socket.IO, mcp

---

## Important Project Structures

### Unified Action System (`src/lib/server/actions`)
This system is the centralized, type-safe architecture for managing all server-side operations, replacing ad-hoc Strapi calls. 
When writing or updating server-side logic, you MUST use this system.

**Key Components within the Action System:**
- **ActionRegistry (`registry.ts`)**: The central place where all actions are defined with their parameter schemas, auth rules, and notifications.
- **ValidationEngine (`ValidationEngine.ts`)**: Validates action parameters against defined schemas.
- **AuthorizationEngine (`AuthorizationEngine.ts`)**: Checks rules like `jwt`, `projectMember`, or custom roles before executing.
- **StrapiClient (`StrapiClient.ts`)**: Wrapper for executing GraphQL operations (QIDS queries) directly to Strapi.
- **ActionService (`ActionService.ts`)**: The main orchestrator. It handles the whole flow: Validation -> Authorization -> Execution -> Notifications -> Returning structured results.
- **Notification Orchestrator**: Handles multi-channel notifications (Socket, Email, Push) after action success.

**How to execute an action:**
```typescript
import { actionService } from '$lib/server/actions/index.js';

const result = await actionService.executeAction('actionKey', params, context);
```

---

You are able to use the Svelte MCP server, where you have access to comprehensive Svelte 5 and SvelteKit documentation. Here's how to use the available tools effectively:

## Available MCP Tools:

### 1. list-sections

Use this FIRST to discover all available documentation sections. Returns a structured list with titles, use_cases, and paths.
When asked about Svelte or SvelteKit topics, ALWAYS use this tool at the start of the chat to find relevant sections.

### 2. get-documentation

Retrieves full documentation content for specific sections. Accepts single or multiple sections.
After calling the list-sections tool, you MUST analyze the returned documentation sections (especially the use_cases field) and then use the get-documentation tool to fetch ALL documentation sections that are relevant for the user's task.

### 3. svelte-autofixer

Analyzes Svelte code and returns issues and suggestions.
You MUST use this tool whenever writing Svelte code before sending it to the user. Keep calling it until no issues or suggestions are returned.

### 4. playground-link

Generates a Svelte Playground link with the provided code.
After completing the code, ask the user if they want a playground link. Only call this tool after user confirmation and NEVER if code was written to files in their project.
