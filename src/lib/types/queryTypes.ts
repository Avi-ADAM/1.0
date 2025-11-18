/**
 * GraphQL Query Response Types
 * 
 * This module provides TypeScript type definitions for common GraphQL query responses
 * from the Strapi backend. These types ensure type safety when working with API data
 * in components and provide autocomplete support in your IDE.
 * 
 * @module queryTypes
 */

import type { StrapiResponse, StrapiEntity, StrapiCollection, StrapiMedia } from './strapiTypes';

/**
 * Response type for the getUserProjectList query (qid: 64getUserProjectList)
 * 
 * This query fetches a user's list of projects with basic project information.
 * 
 * @example
 * ```typescript
 * import { sendToSerTyped } from '$lib/send/sendToSerTyped';
 * import type { UserProjectListResponse } from '$lib/types/queryTypes';
 * 
 * const response = await sendToSerTyped<UserProjectListResponse>(
 *   { uid: userId },
 *   "64getUserProjectList",
 *   0,
 *   0,
 *   false,
 *   fetch
 * );
 * 
 * // Now you have full type safety and autocomplete
 * const projects = response.data.usersPermissionsUser.data?.attributes.projects_1s.data;
 * projects?.forEach(project => {
 *   console.log(project.attributes.projectName); // ✓ Type-safe
 * });
 * ```
 */
export type UserProjectListResponse = StrapiResponse<{
  usersPermissionsUser: StrapiEntity<{
    projects_1s: StrapiCollection<{
      projectName: string;
    }>;
  }>;
}>;

/**
 * Response type for the checkProjectMembership query (qid: 65checkProjectMembership)
 * 
 * This query checks if a user is a member of a specific project and returns project details.
 * 
 * @example
 * ```typescript
 * import { sendToSerTyped } from '$lib/send/sendToSerTyped';
 * import type { CheckProjectMembershipResponse } from '$lib/types/queryTypes';
 * 
 * const response = await sendToSerTyped<CheckProjectMembershipResponse>(
 *   { uid: userId, projectId: projectId },
 *   "65checkProjectMembership",
 *   0,
 *   0,
 *   false,
 *   fetch
 * );
 * 
 * const projects = response.data.usersPermissionsUser.data?.attributes.projects_1s.data;
 * if (projects && projects.length > 0) {
 *   console.log('User is a member of:', projects[0].attributes.projectName);
 *   console.log('Profile pic:', projects[0].attributes.profilePic.data?.attributes.url);
 * }
 * ```
 */
export type CheckProjectMembershipResponse = StrapiResponse<{
  usersPermissionsUser: StrapiEntity<{
    projects_1s: StrapiCollection<{
      projectName: string;
      profilePic: StrapiMedia<{
        url: string;
      }>;
      createdAt: string;
    }>;
  }>;
}>;

/**
 * Response type for the GetProjectById query (qid: 49GetProjectById)
 * 
 * This query fetches detailed information about a specific project including
 * members, services, social links, values, and open missions.
 * 
 * @example
 * ```typescript
 * import { sendToSerTyped } from '$lib/send/sendToSerTyped';
 * import type { ProjectDetailsResponse } from '$lib/types/queryTypes';
 * 
 * const response = await sendToSerTyped<ProjectDetailsResponse>(
 *   { id: projectId },
 *   "49GetProjectById",
 *   0,
 *   0,
 *   false,
 *   fetch
 * );
 * 
 * const project = response.data.project.data?.attributes;
 * if (project) {
 *   console.log('Project name:', project.projectName);
 *   console.log('Description:', project.publicDescription);
 *   console.log('Members:', project.user_1s.data.length);
 *   console.log('Open missions:', project.open_missions.data.length);
 *   
 *   // Access nested relations with type safety
 *   project.vallues.data.forEach(value => {
 *     console.log('Value:', value.attributes.valueName);
 *   });
 * }
 * ```
 */
export type ProjectDetailsResponse = StrapiResponse<{
  project: StrapiEntity<{
    projectName: string;
    user_1s: StrapiCollection<{
      username: string;
      profilePic: StrapiMedia<{
        url: string;
      }>;
    }>;
    linkToWebsite: string | null;
    restime: string | null;
    sheiruts: StrapiCollection<{
      name: string;
      descrip: string;
      equaliSplited: boolean;
      oneTime: boolean;
      isApruved: boolean;
    }>;
    githublink: string | null;
    fblink: string | null;
    discordlink: string | null;
    twiterlink: string | null;
    vallues: StrapiCollection<{
      valueName: string;
      localizations: StrapiCollection<{
        valueName: string;
      }>;
    }>;
    publicDescription: string | null;
    profilePic: StrapiMedia<{
      url: string;
      formats: any;
    }>;
    open_missions: StrapiCollection<{
      name: string;
    }>;
  }>;
}>;

/**
 * Response type for the GetUserById query (qid: 52GetUserById)
 * 
 * This query fetches detailed information about a specific user including
 * their profile, projects, skills, roles, and values.
 * 
 * @example
 * ```typescript
 * import { sendToSerTyped } from '$lib/send/sendToSerTyped';
 * import type { UserDetailsResponse } from '$lib/types/queryTypes';
 * 
 * const response = await sendToSerTyped<UserDetailsResponse>(
 *   { id: userId },
 *   "52GetUserById",
 *   0,
 *   0,
 *   false,
 *   fetch
 * );
 * 
 * const user = response.data.usersPermissionsUser.data?.attributes;
 * if (user) {
 *   console.log('Username:', user.username);
 *   console.log('Bio:', user.bio);
 *   console.log('Projects:', user.projects_1s.data.length);
 *   
 *   // Access skills with type safety
 *   user.skills.data.forEach(skill => {
 *     console.log('Skill:', skill.attributes.skillName);
 *   });
 * }
 * ```
 */
export type UserDetailsResponse = StrapiResponse<{
  usersPermissionsUser: StrapiEntity<{
    fblink: string | null;
    twiterlink: string | null;
    discordlink: string | null;
    githublink: string | null;
    bio: string | null;
    username: string;
    finnished_missions: StrapiCollection<{
      missionName: string;
    }>;
    profilePic: StrapiMedia<{
      url: string;
      formats: any;
    }>;
    projects_1s: StrapiCollection<{
      projectName: string;
    }>;
    sps: StrapiCollection<{
      name: string;
      panui: boolean;
    }>;
    skills: StrapiCollection<{
      skillName: string;
      localizations: StrapiCollection<{
        skillName: string;
      }>;
    }>;
    tafkidims: StrapiCollection<{
      roleDescription: string;
      localizations: StrapiCollection<{
        roleDescription: string;
      }>;
    }>;
    vallues: StrapiCollection<{
      valueName: string;
      localizations: StrapiCollection<{
        valueName: string;
      }>;
    }>;
    work_ways: StrapiCollection<{
      workWayName: string;
      localizations: StrapiCollection<{
        workWayName: string;
      }>;
    }>;
  }>;
}>;

/**
 * Response type for the GetOpenMissionById query (qid: 51GetOpenMissionById)
 * 
 * This query fetches detailed information about a specific open mission including
 * associated tasks, users, skills, and work requirements.
 * 
 * @example
 * ```typescript
 * import { sendToSerTyped } from '$lib/send/sendToSerTyped';
 * import type { OpenMissionDetailsResponse } from '$lib/types/queryTypes';
 * 
 * const response = await sendToSerTyped<OpenMissionDetailsResponse>(
 *   { id: missionId },
 *   "51GetOpenMissionById",
 *   0,
 *   0,
 *   false,
 *   fetch
 * );
 * 
 * const mission = response.data.openMission.data?.attributes;
 * if (mission) {
 *   console.log('Mission name:', mission.name);
 *   console.log('Description:', mission.descrip);
 *   console.log('Hours:', mission.noofhours);
 *   console.log('Rate:', mission.perhour);
 *   
 *   // Access related project
 *   const project = mission.project.data?.attributes;
 *   console.log('Project:', project?.projectName);
 * }
 * ```
 */
export type OpenMissionDetailsResponse = StrapiResponse<{
  openMission: StrapiEntity<{
    sqadualed: string | null;
    archived: boolean;
    acts: StrapiCollection<{
      shem: string;
      des: string;
      dateF: string | null;
      dateS: string | null;
      link: string | null;
    }>;
    users: StrapiCollection<Record<string, never>>;
    mission: StrapiCollection<Record<string, never>>;
    project: StrapiEntity<{
      projectName: string;
      user_1s: StrapiCollection<Record<string, never>>;
      restime: string | null;
      timeToP: string | null;
      profilePic: StrapiMedia<{
        url: string;
      }>;
    }>;
    tafkidims: StrapiCollection<{
      roleDescription: string;
      localizations: StrapiCollection<{
        roleDescription: string;
      }>;
    }>;
    skills: StrapiCollection<{
      skillName: string;
      localizations: StrapiCollection<{
        skillName: string;
      }>;
    }>;
    descrip: string;
    hearotMeyuchadot: string | null;
    name: string;
    dates: string | null;
    iskvua: boolean;
    privatlinks: string | null;
    publicklinks: string | null;
    work_ways: StrapiCollection<{
      workWayName: string;
      localizations: StrapiCollection<{
        workWayName: string;
      }>;
    }>;
    noofhours: number;
    perhour: number;
  }>;
}>;

/**
 * Response type for the GetMissionsOnProgress query (qid: 8getMissionsOnProgress)
 * 
 * This query fetches all missions currently in progress for a user, including
 * active timers and associated tasks.
 * 
 * @example
 * ```typescript
 * import { sendToSerTyped } from '$lib/send/sendToSerTyped';
 * import type { MissionsOnProgressResponse } from '$lib/types/queryTypes';
 * 
 * const response = await sendToSerTyped<MissionsOnProgressResponse>(
 *   { id: userId },
 *   "8getMissionsOnProgress",
 *   0,
 *   0,
 *   false,
 *   fetch
 * );
 * 
 * const user = response.data.usersPermissionsUser.data?.attributes;
 * const missions = user?.mesimabetahaliches.data;
 * 
 * missions?.forEach(mission => {
 *   console.log('Mission:', mission.attributes.name);
 *   console.log('Hours assigned:', mission.attributes.hoursassinged);
 *   console.log('Hours worked:', mission.attributes.howmanyhoursalready);
 *   
 *   const timer = mission.attributes.activeTimer.data?.attributes;
 *   if (timer?.isActive) {
 *     console.log('Timer is running!');
 *   }
 * });
 * ```
 */
export type MissionsOnProgressResponse = StrapiResponse<{
  usersPermissionsUser: StrapiEntity<{
    username: string;
    telegramId: string | null;
    lang: string | null;
    mesimabetahaliches: StrapiCollection<{
      name: string;
      stname: string | null;
      timer: number | null;
      howmanyhoursalready: number;
      hoursassinged: number;
      acts: StrapiCollection<{
        shem: string;
        myIshur: boolean;
        link: string | null;
        hashivut: string | null;
        valiIshur: boolean;
        des: string;
        dateF: string | null;
        dateS: string | null;
        status: number | null;
        naasa: boolean;
      }>;
      activeTimer: StrapiEntity<{
        start: string;
        totalHours: number;
        timers: Array<{
          start: string;
          stop: string | null;
        }>;
        acts: StrapiCollection<Record<string, never>>;
        isActive: boolean;
        saved: boolean;
      }>;
      project: StrapiEntity<{
        projectName: string;
        profilePic: StrapiMedia<{
          formats: any;
          url: string;
        }>;
      }>;
    }>;
  }>;
}>;

/**
 * Response type for the GetNegotiation query (qid: 39GetNegotiation)
 * 
 * This query fetches detailed information about a negotiation including
 * all positions, participants, and voting data.
 * 
 * @example
 * ```typescript
 * import { sendToSerTyped } from '$lib/send/sendToSerTyped';
 * import type { NegotiationDetailsResponse } from '$lib/types/queryTypes';
 * 
 * const response = await sendToSerTyped<NegotiationDetailsResponse>(
 *   { id: negotiationId },
 *   "39GetNegotiation",
 *   0,
 *   0,
 *   false,
 *   fetch
 * );
 * 
 * const negotiation = response.data.negotiation.data?.attributes;
 * if (negotiation) {
 *   console.log('Topic:', negotiation.topic);
 *   console.log('Status:', negotiation.status);
 *   console.log('Round:', negotiation.currentRound, '/', negotiation.maxRounds);
 *   
 *   // Access positions with type safety
 *   negotiation.positions.data.forEach(position => {
 *     console.log('Position:', position.attributes.heading);
 *     console.log('Votes:', position.attributes.votes);
 *   });
 * }
 * ```
 */
export type NegotiationDetailsResponse = StrapiResponse<{
  negotiation: StrapiEntity<{
    topic: string;
    description: string;
    status: string;
    maxRounds: number;
    currentRound: number;
    creator: StrapiEntity<{
      username: string;
      email: string;
    }>;
    positions: StrapiCollection<{
      heading: string;
      description: string;
      author: StrapiEntity<{
        username: string;
        email: string;
      }>;
      authorEmail: string;
      votes: number;
      voters: StrapiCollection<{
        username: string;
        email: string;
      }>;
      location: any;
      intensity: number | null;
      tags: StrapiCollection<{
        name: string;
      }>;
      order: number;
    }>;
    participants: StrapiCollection<{
      username: string;
      email: string;
    }>;
  }>;
}>;

