/**
 * Data extraction functions for lev page
 * These functions extract and transform raw GraphQL data into typed data structures
 * for use in the lev page stores.
 * 
 * These functions are pure - they take raw GraphQL data and return typed arrays
 * without side effects or mutations.
 */

import type {
  PendMissionData,
  InProgressMissionData,
  ApprovalData,
  AskData,
  AskedResourceData,
  SuggestionData,
  ProjectData,
  PendResourceData,
  ResourceRequestData,
  HalukaData,
  WelcomeData,
  TransferData,
  DecisionData
} from '$lib/stores/levStores';
import { calculateScore } from './suggestionMatchers';

/**
 * Extract pending missions (pendms) from GraphQL user data
 * 
 * @param userData - Raw GraphQL response data
 * @returns Array of pending mission data
 * 
 * **Validates: Requirements 1.1, 1.4**
 */
export function extractPends(userData: any): PendMissionData[] {
  const pends: PendMissionData[] = [];

  if (!userData?.attributes?.projects_1s?.data) {
    return pends;
  }

  const projects = userData.attributes.projects_1s.data;

  for (const project of projects) {
    if (!project?.attributes?.pendms?.data) {
      continue;
    }

    for (const pend of project.attributes.pendms.data) {
      if (!pend?.id || !pend?.attributes) {
        continue;
      }

      pends.push({
        id: pend.id,
        projectId: project.id,
        name: pend.attributes.name || '',
        users: pend.attributes.users || [],
        messages: pend.attributes.diun || [],
        priority: 1 + (pend.attributes.users?.length || 0),
        myid: userData.id, // Add viewer ID for "already voted" logic
        // Additional fields
        createdAt: pend.attributes.createdAt,
        iskvua: pend.attributes.iskvua || false,
        hearotMeyuchadot: pend.attributes.hearotMeyuchadot || '',
        descrip: pend.attributes.descrip || '',
        noofhours: pend.attributes.noofhours || 0,
        perhour: pend.attributes.perhour || 0,
        sqadualed: pend.attributes.sqadualed || '',
        privatlinks: pend.attributes.privatlinks || [],
        publicklinks: pend.attributes.publicklinks || [],
        dates: pend.attributes.dates || [],
        diun: pend.attributes.diun || [],
        skills: pend.attributes.skills?.data || [],
        tafkidims: pend.attributes.tafkidims?.data || [],
        work_ways: pend.attributes.work_ways?.data || [],
        vallues: pend.attributes.vallues?.data || [],
        missionId: pend.attributes.mission?.data?.id,
        timegramaId: pend.attributes.timegrama?.data?.id,
        timegramaDate: pend.attributes.timegrama?.data?.attributes?.date,
        acts: pend.attributes.acts?.data || [],
        negopendmissions: pend.attributes.negopendmissions?.data || [],
        rishonId: pend.attributes.rishon?.data?.id
      });
    }
  }

  return pends;
}

/**
 * Extract missions in progress (mesimabetahaliches) from GraphQL user data
 * 
 * @param userData - Raw GraphQL response data
 * @returns Array of in-progress mission data
 * 
 * **Validates: Requirements 1.1, 1.4**
 */
export function extractMtaha(userData: any): InProgressMissionData[] {
  const mtaha: InProgressMissionData[] = [];

  if (!userData?.attributes?.mesimabetahaliches?.data) {
    return mtaha;
  }

  for (const mission of userData.attributes.mesimabetahaliches.data) {
    if (!mission?.id || !mission?.attributes) {
      continue;
    }

    mtaha.push({
      id: mission.id,
      projectId: mission.attributes.project?.data?.id || '',
      name: mission.attributes.name || '',
      assignedTo: '', // Will be computed in processor
      progress: mission.attributes.howmanyhoursalready || 0,
      priority: 150,
      myusername: userData.attributes.username, // Current user's username
      // Additional fields
      missionId: mission.attributes.mission?.data?.id,
      stname: mission.attributes.stname || '',
      status: mission.attributes.status || '',
      descrip: mission.attributes.descrip || '',
      hearotMeyuchadot: mission.attributes.hearotMeyuchadot || '',
      hoursassinged: mission.attributes.hoursassinged || 0,
      perhour: mission.attributes.perhour || 0,
      howmanyhoursalready: mission.attributes.howmanyhoursalready || 0,
      iskvua: mission.attributes.iskvua || false,
      privatlinks: mission.attributes.privatlinks || [],
      publicklinks: mission.attributes.publicklinks || [],
      dates: mission.attributes.dates || [],
      timer: mission.attributes.timer,
      activeTimer: mission.attributes.activeTimer, // Add activeTimer for checks
      admaticedai: mission.attributes.admaticedai,
      acts: mission.attributes.acts?.data || []
    });
  }

  return mtaha;
}

/**
 * Extract approval requests (finiapruvals) from GraphQL user data
 * 
 * @param userData - Raw GraphQL response data
 * @returns Array of approval data
 * 
 * **Validates: Requirements 1.1, 1.4**
 */
export function extractFiapp(userData: any): ApprovalData[] {
  const fiapp: ApprovalData[] = [];

  if (!userData?.attributes?.projects_1s?.data) {
    return fiapp;
  }

  const projects = userData.attributes.projects_1s.data;

  for (const project of projects) {
    if (!project?.attributes?.finiapruvals?.data) {
      continue;
    }

    for (const approval of project.attributes.finiapruvals.data) {
      if (!approval?.id || !approval?.attributes) {
        continue;
      }

      fiapp.push({
        id: approval.id,
        projectId: project.id,
        type: 'approval',
        priority: 2,
        myid: userData.id, // Add viewer ID
        // Additional fields
        missname: approval.attributes.missname || '',
        noofhours: approval.attributes.noofhours || 0,
        why: approval.attributes.why || '',
        what: approval.attributes.what?.data || [],
        vots: approval.attributes.vots || [],
        timegramaId: approval.attributes.timegrama?.data?.id,
        timegramaDate: approval.attributes.timegrama?.data?.attributes?.date,
        mesimabetahlichId: approval.attributes.mesimabetahalich?.data?.id,
        mesimabetahlichData: approval.attributes.mesimabetahalich?.data?.attributes,
        userId: approval.attributes.users_permissions_user?.data?.id
      });
    }
  }

  return fiapp;
}

/**
 * Extract join requests (asks) from GraphQL user data
 * 
 * @param userData - Raw GraphQL response data
 * @returns Array of ask data
 * 
 * **Validates: Requirements 1.1, 1.4**
 */
export function extractAsked(userData: any): AskData[] {
  const asked: AskData[] = [];

  if (!userData?.attributes?.projects_1s?.data) {
    return asked;
  }

  const projects = userData.attributes.projects_1s.data;

  for (const project of projects) {
    if (!project?.attributes?.asks?.data) {
      continue;
    }

    for (const ask of project.attributes.asks.data) {
      if (!ask?.id || !ask?.attributes) {
        continue;
      }

      asked.push({
        id: ask.id,
        projectId: project.id,
        userId: ask.attributes.users_permissions_user?.data?.id || '',
        viewerId: userData.id, // Current user / viewer ID
        priority: 3,
        // Additional fields
        createdAt: ask.attributes.createdAt,
        vots: ask.attributes.vots || [],
        chat: ask.attributes.chat || [],
        timegramaId: ask.attributes.timegrama?.data?.id,
        timegramaDate: ask.attributes.timegrama?.data?.attributes?.date,
        openMissionId: ask.attributes.open_mission?.data?.id,
        openMissionData: ask.attributes.open_mission?.data?.attributes,
        userAttributes: ask.attributes.users_permissions_user?.data?.attributes,
        users: ask.attributes.vots || [],
        nhours: ask.attributes.open_mission?.data?.attributes?.noofhours || 0,
        perhour: ask.attributes.open_mission?.data?.attributes?.perhour || 0,
        src: ask.attributes.project?.data?.attributes?.profilePic?.data?.attributes?.url || 'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png'
      });
    }
  }

  return asked;
}

/**
 * Extract suggested missions (open_missions from skills/tafkidims) from GraphQL user data
 * Implements complex scoring and matching logic:
 * 1. Iterates Tafkidims (Roles) -> Base score 1
 * 2. Iterates Skills -> Base score 2 (or +2 if already found)
 * 3. Filters out declined missions
 * 4. Includes asked missions (if data available)
 * 5. Sorts by score
 * 6. Populates project details for display
 * 
 * @param userData - Raw GraphQL response data
 * @returns Array of suggestion data sorted by relevance
 * 
 * **Validates: Requirements 1.1, 1.4, Matching Logic**
 */
export function extractSuggestions(userData: any): SuggestionData[] {
  const suggestions: SuggestionData[] = [];
  const missionDataMap = new Map<string, any>();
  const scores = new Map<string, number>();

  if (!userData?.attributes) {
    return suggestions;
  }

  // Map of asked missions for lookup
  const askedMap = new Map<string, any>();
  if (userData.attributes.asks?.data) {
    for (const ask of userData.attributes.asks.data) {
      const missionId = ask.attributes?.open_mission?.data?.id;
      if (missionId) {
        askedMap.set(missionId, ask);
      }
    }
  }

  // extract user capabilities (IDs)
  const userWorkWays = userData.attributes.work_ways?.data?.map((x: any) => x.id) || [];
  const userSkills = userData.attributes.skills?.data?.map((x: any) => x.id) || [];
  const userRoles = userData.attributes.tafkidims?.data?.map((x: any) => x.id) || [];

  // extract lists
  const declinedIds = userData.attributes.declined?.data?.map((x: any) => x.id) || [];
  const askedIds = userData.attributes.askeds?.data?.map((x: any) => x.id) || []; // from 'askeds' relation

  const userCaps = { workWays: userWorkWays, skills: userSkills, roles: userRoles };

  // Helper to extract mission requirements
  const getMissionReqs = (m: any) => ({
    id: m.id,
    workWays: m.attributes.work_ways?.data?.map((x: any) => x.id) || [],
    skills: m.attributes.skills?.data?.map((x: any) => x.id) || [],
    roles: m.attributes.tafkidims?.data?.map((x: any) => x.id) || []
  });

  // Loop 1: Tafkidims (Roles)
  if (userData.attributes.tafkidims?.data) {
    for (const role of userData.attributes.tafkidims.data) {
      if (!role.attributes.open_missions?.data) continue;
      for (const mission of role.attributes.open_missions.data) {
        if (!mission?.id || !mission.attributes) continue;

        // Cache data
        if (!missionDataMap.has(mission.id)) {
          missionDataMap.set(mission.id, mission);
        }

        const currentScore = scores.get(mission.id);
        if (currentScore !== undefined) {
          scores.set(mission.id, currentScore + 1);
        } else {
          const score = calculateScore(getMissionReqs(mission), userCaps, 1);
          scores.set(mission.id, score);
        }
      }
    }
  }

  // Loop 2: Skills
  if (userData.attributes.skills?.data) {
    for (const skill of userData.attributes.skills.data) {
      if (!skill.attributes.open_missions?.data) continue;
      for (const mission of skill.attributes.open_missions.data) {
        if (!mission?.id || !mission.attributes) continue;

        // Cache data (in case partially unique to skills)
        if (!missionDataMap.has(mission.id)) {
          missionDataMap.set(mission.id, mission);
        }

        const currentScore = scores.get(mission.id);
        if (currentScore !== undefined) {
          scores.set(mission.id, currentScore + 2);
        } else {
          const score = calculateScore(getMissionReqs(mission), userCaps, 2);
          scores.set(mission.id, score);
        }
      }
    }
  }

  // Add Unfiltered Asked Missions (with default score 2)
  for (const askedId of askedIds) {
    if (!scores.has(askedId)) {
      // Only if we HAVE the data (it was in the tree somewhere)
      if (missionDataMap.has(askedId)) {
        scores.set(askedId, 2);
      } else {
        // Logic to handle missing data if architecture allowed secondary fetch
      }
    }
  }

  // Filter Declined
  for (const declinedId of declinedIds) {
    scores.delete(declinedId);
  }

  // Sort by score
  const sortedIds = Array.from(scores.keys()).sort((a, b) => {
    return (scores.get(b) || 0) - (scores.get(a) || 0);
  });

  // Build Result
  for (const id of sortedIds) {
    const mission = missionDataMap.get(id);
    if (!mission) continue;

    const score = scores.get(id) || 0;
    const askData = askedMap.get(id);

    // Map to SuggestionData
    suggestions.push({
      id: mission.id,
      projectId: mission.attributes.project?.data?.id || '',
      content: 'suggestion',
      priority: -score,

      // Additional fields
      type: 'suggestion',
      score: score,
      alreadyAsked: !!askData,
      askId: askData?.id,
      chat: askData?.attributes?.chat,

      // Project details extracted from mission attributes
      // Project details extracted from mission attributes
      projectDetails: mission.attributes.project?.data?.attributes ? {
        name: mission.attributes.project.data.attributes.projectName,
        src: mission.attributes.project.data.attributes.profilePic?.data?.attributes?.url,
        membersCount: mission.attributes.project.data.attributes.user_1s?.data?.length || 0,
        restime: mission.attributes.project.data.attributes.restime
      } : undefined,

      // Fields for cards - may be missing in initial fetch
      name: mission.attributes.name || 'Loading...',
      descrip: mission.attributes.descrip || '',
      hearotMeyuchadot: mission.attributes.hearotMeyuchadot || '',
      noofhours: mission.attributes.noofhours || 0,
      perhour: mission.attributes.perhour || 0,
      sqadualed: mission.attributes.sqadualed || '',
      acts: mission.attributes.acts?.data || [],

      // Pass arrays for completeness
      skills: mission.attributes.skills?.data || [],
      tafkidims: mission.attributes.tafkidims?.data || [],
      work_ways: mission.attributes.work_ways?.data || []
    });
  }

  return suggestions;
}

/**
 * Extract projects from GraphQL user data
 * Helper function to get project data for use in processors
 * 
 * @param userData - Raw GraphQL response data
 * @returns Array of project data
 */
export function extractProjects(userData: any): ProjectData[] {
  if (!userData?.attributes?.projects_1s?.data) {
    return [];
  }

  return userData.attributes.projects_1s.data.map((project: any) => ({
    id: project.id,
    attributes: {
      projectName: project.attributes?.projectName || '',
      restime: project.attributes?.restime,
      profilePic: project.attributes?.profilePic,
      user_1s: project.attributes?.user_1s,
      src: project.attributes?.profilePic?.data?.attributes?.url,
      noof: project.attributes?.user_1s?.data?.length || 0
    }
  }));
}

/**
 * Extract pending resources (pmashes) from GraphQL user data
 * 
 * @param userData - Raw GraphQL response data
 * @returns Array of pending resource data
 * 
 * **Validates: Requirements 1.1, 1.4**
 */
export function extractPmashes(userData: any): PendResourceData[] {
  const pmashes: PendResourceData[] = [];

  if (!userData?.attributes?.projects_1s?.data) {
    return pmashes;
  }

  const projects = userData.attributes.projects_1s.data;

  for (const project of projects) {
    if (!project?.attributes?.pmashes?.data) {
      continue;
    }

    for (const pmash of project.attributes.pmashes.data) {
      if (!pmash?.id || !pmash?.attributes) {
        continue;
      }

      pmashes.push({
        id: pmash.id,
        projectId: project.id,
        resourceType: pmash.attributes.kindOf || '',
        priority: 5,
        myid: userData.id, // Add viewer ID for voting logic
        // Additional fields
        name: pmash.attributes.name || '',
        descrip: pmash.attributes.descrip || '',
        hm: pmash.attributes.hm || 0,
        price: pmash.attributes.price || 0,
        easy: pmash.attributes.easy || false,
        spnot: pmash.attributes.spnot || '',
        sqadualed: pmash.attributes.sqadualed || '',
        sqadualedf: pmash.attributes.sqadualedf || '',
        linkto: pmash.attributes.linkto || '',
        createdAt: pmash.attributes.createdAt,
        users: pmash.attributes.users || [],
        diun: pmash.attributes.diun || [],
        mashaabimId: pmash.attributes.mashaabim?.data?.id,
        timegramaId: pmash.attributes.timegrama?.data?.id,
        timegramaDate: pmash.attributes.timegrama?.data?.attributes?.date,
        nego_mashes: pmash.attributes.nego_mashes?.data || []
      });
    }
  }

  return pmashes;
}

/**
 * Extract resource requests (wegets/maaps and askms) from GraphQL user data
 * 
 * @param userData - Raw GraphQL response data
 * @returns Array of resource request data
 * 
 * **Validates: Requirements 1.1, 1.4**
 */
export function extractWegets(userData: any): ResourceRequestData[] {
  const wegets: ResourceRequestData[] = [];

  if (!userData?.attributes?.projects_1s?.data) {
    return wegets;
  }

  const projects = userData.attributes.projects_1s.data;

  for (const project of projects) {
    // Extract maaps (resource approval requests)
    if (project?.attributes?.maaps?.data) {
      for (const maap of project.attributes.maaps.data) {
        if (!maap?.id || !maap?.attributes) {
          continue;
        }

        wegets.push({
          id: maap.id,
          projectId: project.id,
          requestType: 'maap',
          priority: 6,
          // Additional fields
          name: maap.attributes.name || '',
          createdAt: maap.attributes.createdAt,
          vots: maap.attributes.vots || [],
          spId: maap.attributes.sp?.data?.id,
          spData: maap.attributes.sp?.data?.attributes,
          spName: maap.attributes.sp?.data?.attributes?.name,
          openMashaabimId: maap.attributes.open_mashaabim?.data?.id,
          openMashaabimData: maap.attributes.open_mashaabim?.data?.attributes,
          users: maap.attributes.vots || [],
          src: maap.attributes.project?.data?.attributes?.profilePic?.data?.attributes?.url || 'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png',
          // Extract fields from open_mashaabim
          easy: maap.attributes.open_mashaabim?.data?.attributes?.easy,
          price: maap.attributes.open_mashaabim?.data?.attributes?.price,
          sqadualed: maap.attributes.open_mashaabim?.data?.attributes?.sqadualed,
          sqadualedf: maap.attributes.open_mashaabim?.data?.attributes?.sqadualedf,
          spnot: maap.attributes.open_mashaabim?.data?.attributes?.spnot,
          kindOf: maap.attributes.open_mashaabim?.data?.attributes?.kindOf,
          unit: maap.attributes.sp?.data?.attributes?.unit,
          openName: maap.attributes.open_mashaabim?.data?.attributes?.name,
          userId: maap.attributes.sp?.data?.attributes?.users_permissions_user?.data?.id,
          username: maap.attributes.sp?.data?.attributes?.users_permissions_user?.data?.attributes?.username,
          myp: maap.attributes.sp?.data?.attributes?.myp
        });
      }
    }
  }

  return wegets;
}

/**
 * Extract profit distribution requests (halukas) from GraphQL user data
 * 
 * @param userData - Raw GraphQL response data
 * @returns Array of haluka (tosplit) data
 * 
 * **Validates: Requirements 1.1, 1.4**
 */
export function extractHalukas(userData: any): HalukaData[] {
  const halukas: HalukaData[] = [];

  if (!userData?.attributes?.projects_1s?.data) {
    return halukas;
  }

  const projects = userData.attributes.projects_1s.data;

  for (const project of projects) {
    // Note: iterating 'tosplits' to match old 'rashbi' logic which tracks Distribution Requests
    if (!project?.attributes?.tosplits?.data) {
      continue;
    }

    for (const tosplit of project.attributes.tosplits.data) {
      if (!tosplit?.id || !tosplit?.attributes) {
        continue;
      }

      const attrs = tosplit.attributes;

      halukas.push({
        id: tosplit.id,
        projectId: project.id,
        amount: 0, // Will be calculated or is purely display
        priority: 1 + (attrs.vots?.length || 0), // Base priority from rashbi logic
        myid: userData.id, // For voting logic

        // Data needed for rashbi logic
        name: attrs.name || '',
        users: attrs.vots || [],
        halukot: attrs.halukas?.data || [],
        hervach: attrs.hervachti || [],
        pendId: tosplit.id,

        // Additional metadata that might be useful
        createdAt: attrs.createdAt
      });
    }
  }

  return halukas;
}

/**
 * Extract welcome messages (welcom_tops) from GraphQL user data
 * 
 * @param userData - Raw GraphQL response data
 * @returns Array of welcome data
 * 
 * **Validates: Requirements 1.1, 1.4**
 */
export function extractWelcome(userData: any): WelcomeData[] {
  const welcome: WelcomeData[] = [];

  if (!userData?.attributes?.welcom_tops?.data) {
    return welcome;
  }

  for (const welcom of userData.attributes.welcom_tops.data) {
    if (!welcom?.id || !welcom?.attributes) {
      continue;
    }

    const projectId = welcom.attributes.project?.data?.id || '';
    const projectData = welcom.attributes.project?.data?.attributes;

    welcome.push({
      id: welcom.id,
      projectId: projectId,
      message: projectData?.descripFor || projectData?.publicDescription || '',
      priority: 1, // Restored priority to 1 as per original makeWalcom
      // Additional fields
      details: projectData?.publicDescription || '',
      pd: projectData?.descripFor || '',
      username: userData?.attributes?.username || '',
      projectName: projectData?.projectName || '', // Ensure projectName is available
      clicked: welcom.attributes.clicked || false,
      projectData: projectData
    });
  }

  return welcome;
}

/**
 * Extract money transfers (from tosplits/hervachti) from GraphQL user data
 * 
 * @param userData - Raw GraphQL response data
 * @returns Array of transfer data
 * 
 * **Validates: Requirements 1.1, 1.4**
 */
export function extractTransfers(userData: any): TransferData[] {
  const transfers: TransferData[] = [];

  if (!userData?.attributes?.projects_1s?.data) {
    return transfers;
  }

  const projects = userData.attributes.projects_1s.data;

  for (const project of projects) {
    if (!project?.attributes?.tosplits?.data) {
      continue;
    }

    for (const tosplit of project.attributes.tosplits.data) {
      if (!tosplit?.id || !tosplit?.attributes) {
        continue;
      }

      // Extract hervachti (transfer details) from tosplit
      if (tosplit.attributes.hervachti) {
        for (const hervach of tosplit.attributes.hervachti) {
          if (!hervach?.amount) {
            continue;
          }

          transfers.push({
            id: `${tosplit.id}-${hervach.users_permissions_user?.data?.id || 'unknown'}`,
            projectId: project.id,
            amount: hervach.amount || 0,
            priority: 9,
            // Additional fields
            tosplitId: tosplit.id,
            tosplitName: tosplit.attributes.name || '',
            noten: hervach.noten || false,
            mekabel: hervach.mekabel || false,
            nirsham: hervach.nirsham || false,
            userId: hervach.users_permissions_user?.data?.id,
            userHervachti: hervach.users_permissions_user?.data?.attributes?.hervachti,
            vots: tosplit.attributes.vots || [],
            halukasIds: tosplit.attributes.halukas?.data?.map((h: any) => h.id) || []
          });
        }
      }
    }
  }

  return transfers;
}

/**
 * Extract decisions (hachlatot) from GraphQL user data
 * 
 * @param userData - Raw GraphQL response data
 * @returns Array of decision data
 * 
 * **Validates: Requirements 1.1, 1.4**
 */
export function extractDecisions(userData: any): DecisionData[] {
  const decisions: DecisionData[] = [];

  if (!userData?.attributes?.projects_1s?.data) {
    return decisions;
  }

  const projects = userData.attributes.projects_1s.data;

  for (const project of projects) {
    // 1. Process Decisions
    if (project?.attributes?.decisions?.data) {
      for (const decision of project.attributes.decisions.data) {
        if (!decision?.id || !decision?.attributes) continue;

        decisions.push({
          id: decision.id,
          projectId: project.id,
          decision: decision.attributes.kind || '',
          priority: 10,
          myid: userData.id,
          // Additional fields
          kind: decision.attributes.kind || '',
          createdAt: decision.attributes.createdAt,
          vots: decision.attributes.vots || [],
          users: decision.attributes.vots || [], // normalize for processor
          timegramaId: decision.attributes.timegrama?.data?.id,
          timegramaDate: decision.attributes.timegrama?.data?.attributes?.date,
          newpic: decision.attributes.newpic?.data?.attributes?.url, // Matches hachla logic extracting url
          newpicid: decision.attributes.newpic?.data?.id
        });
      }
    }

    // 2. Process Service Requests (Sheirut Pends)
    if (project?.attributes?.sheirutpends?.data) {
      for (const sp of project.attributes.sheirutpends.data) {
        if (!sp?.id || !sp?.attributes) continue;

        decisions.push({
          id: sp.id,
          projectId: project.id,
          decision: 'sheirutpends', // Differentiate/Group under decisions
          priority: 10,
          myid: userData.id,
          // Additional fields
          kind: 'sheirutpends',
          spdata: sp.attributes,
          createdAt: sp.attributes.createdAt,
          vots: sp.attributes.vots || [],
          users: sp.attributes.vots || [], // normalize
          timegramaId: sp.attributes.timegrama?.data?.id,
          timegramaDate: sp.attributes.timegrama?.data?.attributes?.date
        });
      }
    }
  }

  return decisions;
}

/**
 * Extract asked resources (askedResources) - askms resource requests you've received
 * These come from askms in projects
 * 
 * @param userData - Raw GraphQL response data
 * @returns Array of asked resource data
 * 
 * **Validates: Requirements 1.1, 1.4**
 */
export function extractAskedResources(userData: any): AskedResourceData[] {
  const askedResources: AskedResourceData[] = [];

  if (!userData?.attributes?.projects_1s?.data) {
    return askedResources;
  }

  const projects = userData.attributes.projects_1s.data;

  for (const project of projects) {
    if (!project?.attributes?.askms?.data) {
      continue;
    }

    for (const askm of project.attributes.askms.data) {
      if (!askm?.id || !askm?.attributes) {
        continue;
      }

      const askAttributes = askm.attributes;
      const openMashaabimAttrs = askAttributes.open_mashaabim?.data?.attributes || {};
      const userAttrs = askAttributes.users_permissions_user?.data?.attributes || {};
      const projectAttrs = project.attributes;

      askedResources.push({
        id: askm.id,
        projectId: project.id,
        uid: askAttributes.users_permissions_user?.data?.id || '',
        username: userAttrs.username || '',
        requestType: 'askm',
        priority: 2,
        // Core mission info
        src: userAttrs?.profilePic?.data?.attributes?.formats?.thumbnail?.url ||
          userAttrs?.profilePic?.data?.attributes?.url || '',
        price: openMashaabimAttrs.price || 0,
        easy: openMashaabimAttrs.easy || '',
        spnot: openMashaabimAttrs.spnot || '',
        descrip: openMashaabimAttrs.descrip || '',
        hm: openMashaabimAttrs.hm || '',
        myp: askAttributes.sp?.data?.attributes?.myp || 0,
        kindOf: openMashaabimAttrs.kindOf || '',
        spid: askAttributes.sp?.data?.id,
        deadline: openMashaabimAttrs.sqadualed || '',
        openName: openMashaabimAttrs.name || '',
        omid: askAttributes.open_mashaabim?.data?.id,
        askId: askm.id,
        // Voting and user info
        users: askAttributes.vots || [],
        name: openMashaabimAttrs.name || '',
        projectName: projectAttrs.projectName || '',
        noof: (project.attributes.user_1s?.data?.length || 0),
        src2: projectAttrs?.profilePic?.data?.attributes?.url ||
          'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png',
        myid: userData.id,
        pid: project.attributes.user_1s?.data?.map((u: any) => u.id) || [],
        ani: 'askedm',
        azmi: 'ziruf',
        // Additional fields for compatibility
        createdAt: askAttributes.createdAt,
        chat: askAttributes.chat || [],
        vots: askAttributes.vots || [],
        timegramaId: askAttributes.timegrama?.data?.id,
        timegramaDate: askAttributes.timegrama?.data?.attributes?.date,
        spData: askAttributes.sp?.data?.attributes,
        openMashaabimData: askAttributes.open_mashaabim?.data?.attributes,
        userAttributes: userAttrs
      });
    }
  }

  return askedResources;
}
