/**
 * Example usage of Strapi validation utilities
 * 
 * This file demonstrates how to use the validation utilities
 * to validate API responses at runtime.
 */

import { sendToSer } from '$lib/send/sendToSer.js';
import {
  validateResponse,
  safeValidate,
  isValidResponse,
  userProjectListResponseSchema,
  projectDetailsResponseSchema,
  checkProjectMembershipResponseSchema
} from '$lib/types/validation';
import type {
  UserProjectListResponse,
  ProjectDetailsResponse,
  CheckProjectMembershipResponse
} from '$lib/types/queryTypes';

/**
 * Example 1: Basic validation with error handling
 * 
 * This approach throws an error if validation fails,
 * which is useful when you want to fail fast.
 */
export async function getUserProjectsWithValidation(
  userId: string,
  fetch: typeof globalThis.fetch
): Promise<Array<{ id: string; name: string }>> {
  try {
    // Fetch data from API
    const rawResponse = await sendToSer(
      { uid: userId },
      "64getUserProjectList",
      0,
      0,
      false,
      fetch
    );

    // Validate the response structure
    const validatedResponse = await validateResponse(
      userProjectListResponseSchema,
      rawResponse
    ) as UserProjectListResponse;

    // Extract and return the projects
    const projects = validatedResponse.data.usersPermissionsUser.data?.attributes.projects_1s.data ?? [];
    return projects.map(project => ({
      id: project.id,
      name: project.attributes.projectName
    }));
  } catch (error) {
    console.error('Failed to fetch or validate user projects:', error);
    throw new Error('Unable to load user projects');
  }
}

/**
 * Example 2: Safe validation without exceptions
 * 
 * This approach returns a result object instead of throwing,
 * which is useful for graceful error handling in UI components.
 */
export async function getProjectDetailsSafely(
  projectId: string,
  fetch: typeof globalThis.fetch
): Promise<{
  success: boolean;
  project?: {
    id: string;
    name: string;
    description: string | null;
    memberCount: number;
    valueCount: number;
  };
  error?: string;
}> {
  // Fetch data from API
  const rawResponse = await sendToSer(
    { id: projectId },
    "49GetProjectById",
    0,
    0,
    false,
    fetch
  );

  // Validate using safe validation
  const result = await safeValidate(projectDetailsResponseSchema, rawResponse);

  if (result.success) {
    const projectData = result.data.data.project.data;
    
    if (!projectData) {
      return {
        success: false,
        error: 'Project not found'
      };
    }

    return {
      success: true,
      project: {
        id: projectData.id,
        name: projectData.attributes.projectName,
        description: projectData.attributes.publicDescription,
        memberCount: projectData.attributes.user_1s.data.length,
        valueCount: projectData.attributes.vallues.data.length
      }
    };
  } else {
    // Log validation errors for debugging
    console.error('Validation errors:', result.errors.errors);
    
    return {
      success: false,
      error: 'Invalid project data structure'
    };
  }
}

/**
 * Example 3: Type guard validation
 * 
 * This approach uses a type guard to check if data is valid,
 * which is useful for conditional logic.
 */
export async function checkUserProjectMembership(
  userId: string,
  projectId: string,
  fetch: typeof globalThis.fetch
): Promise<boolean> {
  const rawResponse = await sendToSer(
    { uid: userId, projectId: projectId },
    "65checkProjectMembership",
    0,
    0,
    false,
    fetch
  );

  // Use type guard to check validity
  if (isValidResponse(checkProjectMembershipResponseSchema, rawResponse)) {
    // TypeScript knows rawResponse is CheckProjectMembershipResponse
    const projects = rawResponse.data.usersPermissionsUser.data?.attributes.projects_1s.data;
    return projects ? projects.length > 0 : false;
  } else {
    console.warn('Invalid response structure for project membership check');
    return false;
  }
}

/**
 * Example 4: Validation in a Svelte load function
 * 
 * This shows how to use validation in SvelteKit server load functions.
 */
export async function loadUserProjects(
  userId: string,
  fetch: typeof globalThis.fetch
): Promise<{
  projects: Array<{ id: string; name: string }>;
  error: string | null;
}> {
  try {
    const rawResponse = await sendToSer(
      { uid: userId },
      "64getUserProjectList",
      0,
      0,
      true, // Server-side
      fetch
    );

    const result = await safeValidate(userProjectListResponseSchema, rawResponse);

    if (result.success) {
      const projects = result.data.data.usersPermissionsUser.data?.attributes.projects_1s.data ?? [];
      return {
        projects: projects.map(p => ({
          id: p.id,
          name: p.attributes.projectName
        })),
        error: null
      };
    } else {
      return {
        projects: [],
        error: 'Failed to load projects: Invalid data structure'
      };
    }
  } catch (error) {
    return {
      projects: [],
      error: 'Failed to load projects: Network error'
    };
  }
}

/**
 * Example 5: Validation with custom error messages
 * 
 * This shows how to provide user-friendly error messages
 * based on validation failures.
 */
export async function getProjectWithFriendlyErrors(
  projectId: string,
  fetch: typeof globalThis.fetch
): Promise<{
  data: any | null;
  userMessage: string | null;
}> {
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
    return {
      data: result.data.data.project.data,
      userMessage: null
    };
  } else {
    // Analyze validation errors to provide friendly messages
    const errors = result.errors.errors;
    
    if (errors.some(e => e.includes('projectName'))) {
      return {
        data: null,
        userMessage: 'Project information is incomplete'
      };
    }
    
    if (errors.some(e => e.includes('user_1s'))) {
      return {
        data: null,
        userMessage: 'Project member information is unavailable'
      };
    }
    
    return {
      data: null,
      userMessage: 'Unable to load project details. Please try again later.'
    };
  }
}

/**
 * Example 6: Partial validation for optional features
 * 
 * Sometimes you want to validate only critical fields and
 * allow optional fields to be missing.
 */
export async function getProjectBasicInfo(
  projectId: string,
  fetch: typeof globalThis.fetch
): Promise<{
  id: string;
  name: string;
} | null> {
  const rawResponse = await sendToSer(
    { id: projectId },
    "49GetProjectById",
    0,
    0,
    false,
    fetch
  );

  // Validate the full response
  const result = await safeValidate(projectDetailsResponseSchema, rawResponse);

  if (result.success) {
    const project = result.data.data.project.data;
    
    if (project) {
      // Even if some optional fields are missing, we can still
      // extract the basic info we need
      return {
        id: project.id,
        name: project.attributes.projectName
      };
    }
  }

  return null;
}

/**
 * Example 7: Validation in a reactive Svelte store
 * 
 * This shows how to use validation in a Svelte store
 * that fetches and validates data.
 */
export function createValidatedProjectStore(projectId: string) {
  let data = $state<any>(null);
  let loading = $state(true);
  let error = $state<string | null>(null);

  async function load(fetch: typeof globalThis.fetch) {
    loading = true;
    error = null;

    try {
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
        data = result.data.data.project.data;
      } else {
        error = 'Invalid project data';
        console.error('Validation errors:', result.errors.errors);
      }
    } catch (err) {
      error = 'Failed to load project';
      console.error(err);
    } finally {
      loading = false;
    }
  }

  return {
    get data() { return data; },
    get loading() { return loading; },
    get error() { return error; },
    load
  };
}
