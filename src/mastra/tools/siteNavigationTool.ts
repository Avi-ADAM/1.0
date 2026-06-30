import { createTool } from '@mastra/core/tools'
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
    execute: async (inputData, context) => {
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
            "name": "Products / Gift",
            "path": "/gift/[id]",
            "description": "Product / gift page",
            "authRequired": false,
            "params": ["id"]
          },
          {
            "name": "Convention",
            "path": "/convention",
            "description": "Convention / terms of use",
            "authRequired": false,
            "aliases": {
              "he": "/hascama",
              "ar": "/aitifaqia"
            }
          },
          {
            "name": "User Profile (public)",
            "path": "/user/[id]",
            "description": "Public profile page of any user",
            "authRequired": false,
            "params": ["id"]
          },
          {
            "name": "Project Public Page",
            "path": "/project/[id]",
            "description": "Public page of a project (Rikma)",
            "authRequired": false,
            "params": ["id"]
          },
          {
            "name": "User Profile (edit)",
            "path": "/me",
            "description": "Edit your own profile: skills, roles, values, way of work, resources list (registered users only)",
            "authRequired": true
          },
          {
            "name": "Main / Lev",
            "path": "/lev",
            "description": "Main dashboard: notifications, suggestions, votes and more (registered users only)",
            "authRequired": true
          },
          {
            "name": "Available Missions",
            "path": "/availableMission",
            "description": "Browse all available missions to apply for",
            "authRequired": false
          },
          {
            "name": "Specific Available Mission",
            "path": "/availableMission/[id]",
            "description": "Detail page for a specific mission available for application",
            "authRequired": false,
            "params": ["id"]
          },
          {
            "name": "Timers",
            "path": "/timers",
            "description": "All my timers (registered users only)",
            "authRequired": true
          },
          {
            "name": "My Calendar",
            "path": "/myCalendar",
            "description": "Calendar showing all completed timers (registered users only)",
            "authRequired": true
          },
          {
            "name": "Moach – My Projects List",
            "path": "/moach",
            "description": "Select or manage your Rikma (FreeMate) projects. Landing page that redirects to a specific project if one is already selected (registered users only)",
            "authRequired": true
          },
          {
            "name": "Moach – Specific Project Overview",
            "path": "/moach/[projectId]",
            "description": "Main overview page for a specific project (registered users only)",
            "authRequired": true,
            "params": ["projectId"]
          },
          {
            "name": "Moach – Project Kanban",
            "path": "/moach/[projectId]/kanban",
            "description": "Kanban board for tasks within a specific project (registered users only)",
            "authRequired": true,
            "params": ["projectId"]
          },
          {
            "name": "Moach – Project Gantt",
            "path": "/moach/[projectId]/gantt",
            "description": "Gantt / timeline view for a specific project (registered users only)",
            "authRequired": true,
            "params": ["projectId"]
          },
          {
            "name": "Moach – Project Members / Acts",
            "path": "/moach/[projectId]/acts",
            "description": "Members and activity management for a specific project (registered users only)",
            "authRequired": true,
            "params": ["projectId"]
          },
          {
            "name": "Moach – Project Votes",
            "path": "/moach/[projectId]/votes",
            "description": "Voting page for decisions within a specific project (registered users only)",
            "authRequired": true,
            "params": ["projectId"]
          },
          {
            "name": "Moach – Project Shifts",
            "path": "/moach/[projectId]/shifts",
            "description": "Shift scheduling for a specific project (registered users only)",
            "authRequired": true,
            "params": ["projectId"]
          },
          {
            "name": "Moach – Project Sales",
            "path": "/moach/[projectId]/sales",
            "description": "Sales management within a specific project (registered users only)",
            "authRequired": true,
            "params": ["projectId"]
          },
          {
            "name": "Moach – Project Services",
            "path": "/moach/[projectId]/services",
            "description": "Services offered by a specific project (registered users only)",
            "authRequired": true,
            "params": ["projectId"]
          },
          {
            "name": "Moach – Project Wishes",
            "path": "/moach/[projectId]/wishes",
            "description": "Wishes / requests linked to a specific project (registered users only)",
            "authRequired": true,
            "params": ["projectId"]
          },
          {
            "name": "Moach – Project Processes",
            "path": "/moach/[projectId]/processes",
            "description": "Process management for a specific project (registered users only)",
            "authRequired": true,
            "params": ["projectId"]
          },
          {
            "name": "Moach – Project Progress",
            "path": "/moach/[projectId]/progress",
            "description": "Progress tracking for a specific project (registered users only)",
            "authRequired": true,
            "params": ["projectId"]
          },
          {
            "name": "Moach – Project Chains",
            "path": "/moach/[projectId]/chains",
            "description": "Chain / workflow management for a specific project (registered users only)",
            "authRequired": true,
            "params": ["projectId"]
          },
          {
            "name": "Moach – Process Detail",
            "path": "/moach/process/[processid]",
            "description": "Detail page for a specific process (registered users only)",
            "authRequired": true,
            "params": ["processid"]
          },
          {
            "name": "Deals",
            "path": "/deals",
            "description": "My deals dashboard: view purchases, sales, pending requests, and incoming wishes. Links to Sales Center and Concierge",
            "authRequired": false
          },
          {
            "name": "Deal Detail",
            "path": "/deals/[id]",
            "description": "Detail page for a specific deal",
            "authRequired": false,
            "params": ["id"]
          },
          {
            "name": "Deal Request Detail",
            "path": "/deals/request/[id]",
            "description": "Detail page for a specific deal request",
            "authRequired": false,
            "params": ["id"]
          },
          {
            "name": "Concierge",
            "path": "/concierge",
            "description": "Personal concierge hub: create and manage your wishes (requests for help/services), browse community wishes, and offer proposals. Registered users only",
            "authRequired": true
          },
          {
            "name": "Concierge – New Wish",
            "path": "/concierge/new",
            "description": "Create a new wish / request in the concierge system (registered users only)",
            "authRequired": true
          },
          {
            "name": "Concierge – Wish Detail",
            "path": "/concierge/[id]",
            "description": "Detail page for a specific wish, showing proposals, missions, and resources (registered users only)",
            "authRequired": true,
            "params": ["id"]
          },
          {
            "name": "Sales Center",
            "path": "/sales-center",
            "description": "Sales center: manage and list products or services for sale (registered users only)",
            "authRequired": true
          },
          {
            "name": "Create New Project",
            "path": "/me?action=createproject",
            "description": "Shortcut to create a new Rikma project via the profile page",
            "authRequired": true
          },
          {
            "name": "Edit Basic Profile",
            "path": "/me?action=editbasic",
            "description": "Edit basic profile info and register for Telegram / push notifications",
            "authRequired": true
          }
        ];
        return { pages };
    }
});
