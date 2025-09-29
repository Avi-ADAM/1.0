import { createTool } from "@mastra/core";
import { z } from 'zod';

const PageSchema = z.object({
    name: z.string().describe('A concise name for the page or action.'),
    path: z.string().describe('The URL path for navigation.'),
    description: z.string().describe('A detailed description of the page, its purpose, and any special requirements.'),
    authRequired: z.boolean().describe('Indicates if the user must be registered to access this page.'),
    params: z.array(z.string()).optional().describe('A list of dynamic parameters required in the path (e.g., [id]).'),
    aliases: z.record(z.string()).optional().describe('Alternative paths for different languages (e.g., { "he": "/hascama" }).'),
});

export const getSitePagesTool = createTool({
    id: 'getSitePages',
    description: 'Get a structured list of available pages on the 1lev1.com site, useful for navigation.',
    inputSchema: z.object({}),
    outputSchema: z.object({
        pages: z.array(PageSchema).describe('An array of page objects.')
    }),
    execute: async () => {
        const pages = [
          {
            "name": "Home",
            "path": "/",
            "description": "Home",
            "authRequired": false
          },
          {
            "name": "About",
            "path": "/about",
            "description": "About",
            "authRequired": false
          },
          {
            "name": "FAQ",
            "path": "/faq",
            "description": "FAQ",
            "authRequired": false
          },
          {
            "name": "Login",
            "path": "/login",
            "description": "Login",
            "authRequired": false
          },
          {
            "name": "products",
            "path": "/gift/[id]",
            "description": "products",
            "authRequired": false,
            "params": [
              "id"
            ]
          },
          {
            "name": "Convention",
            "path": "/convention",
            "description": "Convention",
            "authRequired": false,
            "aliases": {
              "he": "/hascama",
              "ar": "/aitifaqia"
            }
          },
          {
            "name": "users Profile",
            "path": "/user/[id]",
            "description": "users Profile",
            "authRequired": false,
            "params": [
              "id"
            ]
          },
          {
            "name": "Public page of a Project",
            "path": "/project/[id]",
            "description": "Public page of a Project",
            "authRequired": false,
            "params": [
              "id"
            ]
          },
          {
            "name": "manage my projects",
            "path": "/moach",
            "description": "manage my projects (registered users only)",
            "authRequired": true
          },
          {
            "name": "manage specific project",
            "path": "/moach",
            "description": "manage specific project (registered users only) require to pass the id of the project to the idPr store",
            "authRequired": true
          },
          {
            "name": "user profile , edit your skills, roles, values, way of work, resources list",
            "path": "/me",
            "description": "user profile , edit your skills, roles, values, way of work, resources list (registered users only)",
            "authRequired": true
          },
          {
            "name": "main page, nutification, suggestions, vots and more",
            "path": "/lev",
            "description": "main page nutification suggestions vots (registered users only)",
            "authRequired": true
          },
          {
            "name": "specific mission availiable for apply",
            "path": "/availableMission/[id]",
            "description": "specific mission availiable for apply",
            "authRequired": false,
            "params": [
              "id"
            ]
          },
          {
            "name": "all the availiable missions to apply for",
            "path": "/availableMission",
            "description": "all the availiable missions to apply for",
            "authRequired": false
          },
          {
            "name": "all my timers",
            "path": "/timers",
            "description": "all my timers (registered users only)",
            "authRequired": true
          },
          {
            "name": "my calendar that shows all my done timers",
            "path": "/myCalendar",
            "description": "my calendar that shows all my done timers (registered users only)",
            "authRequired": true
          },
          {
            "name": "create new project",
            "path": "/me?action=createproject",
            "description": "create new project",
            "authRequired": false
          },
          {
            "name": "edit basic profile and register for telegram/device notification",
            "path": "/me?action=editbasic",
            "description": "edit basic profile and register for telegram/device notification",
            "authRequired": false
          }
        ];
        return { pages };
    }
});
