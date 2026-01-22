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
  DecisionData,
  ResourceSuggestionData,
  ProductRequestData
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
        privatlinks: pend.attributes.privatlinks || '',
        publicklinks: pend.attributes.publicklinks || '',
        dates: pend.attributes.dates || null,
        diun: pend.attributes.diun || [],
        skills: pend.attributes.skills || { data: [] },
        tafkidims: pend.attributes.tafkidims || { data: [] },
        workways: pend.attributes.work_ways || { data: [] },
        vallues: pend.attributes.vallues || { data: [] },
        missionId: pend.attributes.mission?.data?.id,
        timegramaId: pend.attributes.timegrama?.data?.id,
        timegramaDate: pend.attributes.timegrama?.data?.attributes?.date,
        acts: pend.attributes.acts || { data: [] },
        negopendmissions: pend.attributes.negopendmissions.data || [],
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
      acts: mission.attributes.acts || { data: [] }
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
        what: approval.attributes.what || { data: [] },
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
        src: ask.attributes.project?.data?.attributes?.profilePic?.data?.attributes?.url || 'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png',
        forumId: (ask.attributes.forums?.data && ask.attributes.forums.data.length > 0) ? ask.attributes.forums.data[0].id : null
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

  // Map of asked missions for lookup (from asks)
  const askedMap = new Map<string, any>();
  // Map to store mission data from asks (for askeds that don't come from filters)
  const askedMissionsFromAsks = new Map<string, any>();
  if (userData.attributes.asks?.data) {
    for (const ask of userData.attributes.asks.data) {
      const missionId = ask.attributes?.open_mission?.data?.id;
      if (missionId) {
        askedMap.set(missionId, ask);
        // Store the mission data from ask if available
        if (ask.attributes?.open_mission?.data) {
          askedMissionsFromAsks.set(missionId, ask.attributes.open_mission.data);
        }
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
  // These are missions the user asked to join but didn't come from filters
  for (const askedId of askedIds) {
    // Skip if already in scores (from filters)
    if (!scores.has(askedId)) {
      // Try to get mission data from asks map first
      let missionData = missionDataMap.get(askedId);
      if (!missionData) {
        missionData = askedMissionsFromAsks.get(askedId);
        // If we found it in asks, add it to missionDataMap for later use
        if (missionData) {
          missionDataMap.set(askedId, missionData);
        }
      }

      // Only add if we have some data (from filters or from asks)
      if (missionData) {
        scores.set(askedId, 2);
      } else {
        // If we don't have data at all, we can't display it properly
        // This case would require a secondary fetch which is not in current architecture
      }
    } else {
      // Mission is already in scores from filters, ensure it's marked as asked
      // The askedMap check later will set alreadyAsked: true
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
  // Create a Set for quick lookup of asked IDs
  const askedIdsSet = new Set(askedIds);

  for (const id of sortedIds) {
    const mission = missionDataMap.get(id);
    if (!mission) continue;

    const score = scores.get(id) || 0;
    const askData = askedMap.get(id);

    // Mission is "already asked" if:
    // 1. It has askData (user sent a join request) OR
    // 2. It's in askeds list (user asked to do this mission)
    const isAlreadyAsked = !!askData || askedIdsSet.has(id);

    // Map to SuggestionData
    suggestions.push({
      id: mission.id,
      projectId: mission.attributes.project?.data?.id || '',
      content: 'suggestion',
      priority: -score,

      // Additional fields
      type: 'suggestion',
      score: score,
      alreadyAsked: isAlreadyAsked,
      askId: askData?.id,
      chat: askData?.attributes?.chat,
      forumId: (askData?.attributes?.forums?.data && askData.attributes.forums.data.length > 0) ? askData.attributes.forums.data[0].id : null,

      // Project details extracted from mission attributes
      // Project details extracted from mission attributes
      projectDetails: mission.attributes.project?.data?.attributes ? {
        name: mission.attributes.project.data.attributes.projectName,
        src: mission.attributes.project.data.attributes.profilePic?.data?.attributes?.url,
        membersCount: mission.attributes.project.data.attributes.user_1s?.data?.length || 0,
        memberIds: mission.attributes.project.data.attributes.user_1s?.data?.map((u: any) => u.id) || [],
        restime: mission.attributes.project.data.attributes.restime
      } : undefined,

      // Fields for cards - may be missing in initial fetch
      name: mission.attributes.name || 'Loading...',
      descrip: mission.attributes.descrip || '',
      hearotMeyuchadot: mission.attributes.hearotMeyuchadot || '',
      noofhours: mission.attributes.noofhours || 0,
      perhour: mission.attributes.perhour || 0,
      sqadualed: mission.attributes.sqadualed || '',
      dates: mission.attributes.dates || '',

      acts: mission.attributes.acts || { data: [] },

      // Pass arrays for completeness
      skills: mission.attributes.skills || { data: [] },
      tafkidims: mission.attributes.tafkidims || { data: [] },
      work_ways: mission.attributes.work_ways || { data: [] }
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
        nego_mashes: pmash.attributes.nego_mashes || { data: [] }
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
          myp: maap.attributes.sp?.data?.attributes?.myp,
          myid: userData.id
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
        halukot: attrs.halukas || { data: [] },
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

    // Extract projectId - this is the key field needed
    // Project details (name, pic) will be fetched via createProjectInfo in processor
    const projectId = welcom.attributes.project?.data?.id || '';

    // Try to get data from nested project if available (might be in query)
    // But don't rely on it - processor will use createProjectInfo for reliable data
    const projectData = welcom.attributes.project?.data?.attributes;

    welcome.push({
      id: welcom.id,
      welcomeId: welcom.id, // Add welcomeId explicitly as old code used it
      projectId: projectId,
      message: projectData?.descripFor || projectData?.publicDescription || '',
      priority: 1, // Restored priority to 1 as per original makeWalcom
      // Additional fields - some might come from GraphQL, some from processor
      details: projectData?.publicDescription || '',
      pd: projectData?.descripFor || '',
      username: userData?.attributes?.username || '',
      clicked: welcom.attributes.clicked || false,
      // Note: projectName and src will be populated by processor using createProjectInfo
      // We don't set them here since the nested data might not be reliable
    });
  }

  return welcome;
}

/**
 * Extract money transfers (halukas) from GraphQL user data
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

  const myid = userData.id;
  const projects = userData.attributes.projects_1s.data;

  for (const project of projects) {
    if (!project?.attributes?.halukas?.data) {
      continue;
    }

    // Create a lookup map for project users to get names and pics
    const projectUsers = new Map<string, { name: string; pic: string }>();
    if (project.attributes.user_1s?.data) {
      project.attributes.user_1s.data.forEach((u: any) => {
        if (u.id) {
          projectUsers.set(u.id, {
            name: u.attributes?.username || '',
            pic: u.attributes?.profilePic?.data?.attributes?.url || ''
          });
        }
      });
    }

    // Add current user to lookup if not present
    if (myid && !projectUsers.has(myid)) {
      projectUsers.set(myid, {
        name: userData.attributes?.username || '',
        pic: userData.attributes?.profilePic?.data?.attributes?.url || ''
      });
    }

    for (const el of project.attributes.halukas.data) {
      if (!el?.id || !el?.attributes) {
        continue;
      }

      const attrs = el.attributes;
      const sendId = attrs.usersend?.data?.id;
      const recId = attrs.userrecive?.data?.id;

      // Filter: user must be either sender or receiver
      if (sendId === myid || recId === myid) {
        const sendDetails = sendId ? projectUsers.get(sendId) : null;
        const recDetails = recId ? projectUsers.get(recId) : null;

        transfers.push({
          id: el.id,
          projectId: project.id,
          amount: attrs.amount || 0,
          priority: 1, // Matches 'pl: 1' from tveria

          // Replicated fields from old logic (tveria)
          kind: sendId === myid ? 'send' : 'recive',
          send: sendId,
          recive: recId,

          sendname: sendDetails?.name || '',
          sendpropic: sendDetails?.pic || 'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png',

          resname: recDetails?.name || '',
          respropic: recDetails?.pic || 'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png',

          projectName: project.attributes.projectName || '',
          src: project.attributes.profilePic?.data?.attributes?.url || '',

          myid: myid,
          forumId: attrs.forum?.data?.id,
          pendId: el.id,
          chat: attrs.chatre || [],
          senderconf: attrs.senderconf,

          // Nested tosplit data if available
          shear: attrs.tosplit?.data?.attributes?.halukas?.data || [],
          hervachti: attrs.tosplit?.data?.attributes?.hervachti || [],

          // Processor metadata
          ani: 'vidu',
          azmi: 'vidu'
        });
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
    /*
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
    */
  }

  return decisions;
}

/**
 * Extract resource suggestions (huca) from GraphQL user data
 * 
 * @param userData - Raw GraphQL response data
 * @returns Array of resource suggestion data
 * 
 * **Validates: Requirements 1.1, 1.4**
 */
export function extractResourceSuggestions(userData: any): ResourceSuggestionData[] {
  const huca: ResourceSuggestionData[] = [];

  if (!userData?.attributes?.sps?.data) {
    return huca;
  }

  // Get all declined suggestions IDs for filtering (handled partly in loop)
  // Replicating logic: declineddarra per SP

  const sps = userData.attributes.sps.data;

  for (const sp of sps) {
    if (!sp?.attributes?.mashaabim?.data?.attributes?.open_mashaabims?.data) {
      continue;
    }

    // Check if open_mashaabims exists
    const omList = sp.attributes.mashaabim.data.attributes.open_mashaabims.data;
    if (omList.length === 0) continue;

    const myp = sp.attributes.myp;
    const spId = sp.id;

    for (const om of omList) {
      if (!om?.id || !om?.attributes) continue;

      const omAttrs = om.attributes;
      const project = omAttrs.project?.data;

      if (!project) continue; // Must have project

      const projectAttrs = project.attributes;

      // Check declined list
      const declineds = omAttrs.declinedsps?.data?.map((d: any) => d.id) || [];

      // If NOT declined (logic: !declineddarra.includes(id)) - ID of open_mashaabim or SP?
      // Old code: declineddarra.includes(om[t].id) where declineddarra = x.declinedsps.data.map(c=>c.id)
      // Wait, declinedsps relate to SPs or OM IDs?
      // "declineddarra = x.declinedsps.data.map((c) => c.id)" -> X is om[t].attributes. So 'declinedsps' is a relation on OM.
      // Logic: if (!declineddarra.includes(om[t].id))... wait, declineddarra are IDs from declinedsps.
      // If OM ID is in its OWN declined list? That seems circular unless declinedsps points to OTHER entities (maybe SPs?).
      // Let's assume the old code meant "If THIS SP ID is not in the declined list of the suggestion".
      // But old code: "declineddarra.includes(y.mashaabim.data.attributes.open_mashaabims.data[t].id)"
      // This literally checks if the OM ID is in the list of IDs derived from... declinedsps relation of THAT SAME OM.
      // It implies declinedsps might hold IDs of... something else?
      // Let's implement strict translation: declinedsps returns objects with IDs.
      // If the *current* OM ID is in that list... which is weird.
      // BUT, maybe declinedsps is a relation to *User* or *SP*? 
      // If it's a relation to SPs (Service Providers/Users), then we should check if *our* SP ID is in it.

      // Let's look at old code:
      // declineddarra = x.declinedsps.data.map((c) => c.id);
      // if (!declineddarra.includes(omData[t].id)) ...
      // This looks like it checks if the OM ID itself is in 'declinedsps'.
      // This implies 'declinedsps' contains OM entities? Or maybe it's a list of blocked/declined items.
      // Wait, if it checks `omData[t].id` (the ID of the suggestion being iterated), it filters it out if found.
      // So if 'declinedsps' relation on OM contains ITSELF? Unlikely.

      // More likely interpretation:
      // "declineds" is a list of SPs (User personas) that declined this resource.
      // The verification `includes(omId)` is suspicious. 
      // Maybe it meant: `!declineddarra.includes(currentSpId)`?
      // Re-reading user request code:
      // `const declineddarra = x.declinedsps.data.map((c) => c.id);`
      // `if (!declineddarra.includes(y.mashaabim.data.attributes.open_mashaabims.data[t].id))`
      // Where `y` is the user's SP. 
      // It compares the ID of the OM (open_mashaabims[t].id) against the IDs in `declinedsps`.
      // If `declinedsps` holds *other* OMs, then it checks if THIS OM is in the declined list.
      // We will preserve this logic exactly as written for now.

      const declinedIds = declineds; // Array of IDs

      if (!declinedIds.includes(om.id)) {
        huca.push({
          id: om.id,
          projectId: project.id,
          projectName: projectAttrs.projectName,
          srcb: projectAttrs.profilePic?.data?.attributes?.formats?.thumbnail?.url || projectAttrs.profilePic?.data?.attributes?.url,

          mashname: omAttrs.name,
          price: omAttrs.price,
          easy: omAttrs.easy,
          kindOf: omAttrs.kindOf,
          spnot: omAttrs.spnot,
          descrip: omAttrs.descrip,
          sqedualed: omAttrs.sqedualed,
          sqedualedf: omAttrs.sqedualedf,

          myp: myp,
          oid: spId,
          declineddarra: declinedIds,
          already: false,
          priority: 6,

          // Additional fields
          ani: 'huca', // Identifiers for processor/UI
          azmi: 'hazaa',

          // Pass raw attrs if needed
          openMashaabimId: om.id,
          spId: spId
        });
      }
    }
  }

  return huca;
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
/**
 * Extract product requests (sheirutpends) from GraphQL user data
 * 
 * @param userData - Raw GraphQL response data
 * @returns Array of product request data
 */
export function extractProductRequests(userData: any): ProductRequestData[] {
  const requests: ProductRequestData[] = [];

  if (!userData?.attributes?.projects_1s?.data) {
    return requests;
  }

  const projects = userData.attributes.projects_1s.data;

  for (const project of projects) {
    if (!project?.attributes?.sheirutpends?.data) {
      continue;
    }

    for (const req of project.attributes.sheirutpends.data) {
      if (!req?.id || !req?.attributes) {
        continue;
      }
      console.log(req, "req");
      const attrs = req.attributes;
      const sheirut = attrs.sheirut?.data?.attributes;
      const firstMatana = attrs.matanots?.data?.[0]?.attributes;
      const requester = attrs.users_permissions_user?.data;

      requests.push({
        id: req.id,
        projectId: project.id,
        projectName: project.attributes.projectName,
        projectSrc: project.attributes.profilePic?.data?.attributes?.url,

        // Requester
        userId: requester?.id || '',
        username: requester?.attributes?.username || '',
        userSrc: requester?.attributes?.profilePic?.data?.attributes?.url,

        // Details
        name: firstMatana?.name || sheirut?.name || '',
        descrip: firstMatana?.desc || sheirut?.descrip || '',
        price: attrs.price || firstMatana?.price || 0,
        quant: attrs.quant || firstMatana?.quant || 0,
        total: attrs.total || 0,
        kindOf: firstMatana?.kindOf || sheirut?.kindOf || '',
        src: firstMatana?.pic?.data?.attributes?.url,
        startDate: attrs.startDate,
        finishDate: attrs.finnishDate,

        // Metadata
        vots: attrs.vots || [],
        createdAt: attrs.createdAt,
        myid: userData.id,

        // Relations
        sheirutId: attrs.sheirut?.data?.id,
        matanots: attrs.matanots?.data || [],
        timegramaId: attrs.timegrama?.data?.id,
        timegramaDate: attrs.timegrama?.data?.attributes?.date,

        // Processor metadata
        ani: 'sheirutp',
        azmi: 'sheirutp'
      });
    }
  }

  return requests;
}
