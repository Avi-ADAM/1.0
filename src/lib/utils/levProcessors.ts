import type {
  PendMissionData,
  InProgressMissionData,
  ApprovalData,
  AskData,
  AskedResourceData,
  SuggestionData,
  ResourceSuggestionData,
  PendResourceData,
  ResourceRequestData,
  HalukaData,
  WelcomeData,
  TransferData,
  DecisionData,
  ProjectData
} from '$lib/stores/levStores';
// @ts-ignore
import { createProjectInfo, createUserInfo, getProjectMembers, getProjectUsers, getProjectRestime } from '$lib/utils/projectHelpers.js';
import { applyLocalization } from './localizationUtils';
// @ts-ignore
import { checkStb, checkHst, txx, letters } from '$lib/utils/levDataProcessors.js';


/**
 * Common interface for all display items.
 * This is what gets rendered in both coin and card views.
 */
export interface DisplayItem {
  ani: string;           // Type identifier (pends, mtaha, fiapp, etc.)
  azmi: string;          // Category (mesima, harchava, etc.)
  pl: number;            // Priority for sorting
  coinlapach: string;    // Unique identifier
  projectId: string;     // Project ID
  projectName: string;   // Project name
  src: string;           // Project image URL
  [key: string]: any;    // Additional type-specific fields
}

/**
 * Helper function to get project data by ID
 */
function getProjectById(projects: ProjectData[], projectId: string): ProjectData | undefined {
  return projects.find(p => p.id === projectId);
}

/**
 * Helper function to get project name
 */
function getProjectName(projects: ProjectData[], projectId: string): string {
  const project = getProjectById(projects, projectId);
  return project?.attributes.projectName ?? '';
}

/**
 * Helper function to get project image URL
 */
function getProjectImageUrl(projects: ProjectData[], projectId: string): string {
  const project = getProjectById(projects, projectId);
  return project?.attributes.profilePic?.data?.attributes?.url ?? '';
}

/**
 * Helper function to get project member count
 */
function getProjectMemberCount(projects: ProjectData[], projectId: string): number {
  const project = getProjectById(projects, projectId);
  return project?.attributes.user_1s?.data?.length ?? 0;
}

/**
 * Process pending missions into display items
 * 
 * Pure function that transforms raw pending mission data into display items.
 * Does not modify input data.
 * 
 * @param pends - Array of pending mission data
 * @param projects - Array of project data for lookups
 * @returns Array of display items ready for rendering
 */
export function processPends(
  pends: PendMissionData[],
  projects: ProjectData[]
): DisplayItem[] {
  if (!pends || !Array.isArray(pends)) {
    return [];
  }

  return pends.map(pend => {
    // 1. Basic Info
    const projectInfo = createProjectInfo(pend.projectId);
    const myid = pend.myid; // Added in extractor

    const users = pend.users || []; // Votes
    const diun = pend.diun || []; // Chat
    const negos = pend.negopendmissions?.data || []; // Negotiations

    // 2. Logic: Already voted? Vote Counts?
    const maxUserOrder = users.reduce((max, u) => Math.max(max, u.order || 0), 0);
    const orderon = Math.max(negos.length || 0, maxUserOrder);

    let already = false;
    let mypos = null;
    let cv = 0;
    let noofusersOk = 0;
    let noofusersNo = 0;

    // Group votes by user
    const votersMap = new Map<string, any[]>();
    for (const u of users) {
      const uid = u.users_permissions_user?.data?.id;
      if (uid) {
        if (!votersMap.has(uid)) votersMap.set(uid, []);
        votersMap.get(uid)?.push(u);
      }
    }

    // Ensure the proposer (rishonId) is counted as 'Favor' for the current version
    // if they haven't voted differently or at all on the high order.
    if (pend.rishonId && !votersMap.has(pend.rishonId)) {
      votersMap.set(pend.rishonId, [{
        what: true,
        order: orderon,
        users_permissions_user: { data: { id: pend.rishonId } },
        zman: pend.createdAt
      }]);
    }

    // Process each unique voter
    votersMap.forEach((votes, uid) => {
      // Find the vote for the current version
      const currentVote = votes.find(v => (v.order || 0) == orderon);

      if (currentVote) {
        cv++;
        if (currentVote.what === true) noofusersOk++;
        else if (currentVote.what === false) noofusersNo++;

        if (uid === myid) {
          already = true;
          mypos = currentVote.what;
        }
      } else {
        // Voted on old but not current -> Count as 'No' in current context
        cv++;
        noofusersNo++;

        if (uid === myid) {
          already = false; // Need to vote on new version
          mypos = null;
        }
      }
    });

    const restime = getProjectRestime(pend.projectId);
    const user_1s = getProjectUsers(pend.projectId) || [];
    const noofusers = projectInfo.noof;

    const uids = (projectInfo.pid || []).filter(id => id !== myid);
    const noofusersWaiting = noofusers - cv;

    // 3. Messages Construction
    const messege: any[] = [];

    // 3.1 Votes - Show only the most recent vote for each user to avoid confusion
    votersMap.forEach((votes, uid) => {
      // Sort user votes by order desc to get the latest
      const sortedUserVotes = [...votes].sort((a, b) => (b.order || 0) - (a.order || 0));
      const latestVote = sortedUserVotes[0];

      const voterInfo = createUserInfo(pend.projectId, uid);
      const voterName = voterInfo.username || 'User';
      const voterPic = voterInfo.src || projectInfo.src2;
      const uOrder = latestVote.order || 0;

      // Logic: If it's an old version vote, it's effectively 'Against' the current version
      const isCurrentVersion = uOrder == orderon;
      const isFavor = isCurrentVersion ? latestVote.what === true : false;

      let msgText = `${voterName} ${isFavor ? 'בעד' : 'נגד'}`;
      if (!isCurrentVersion) {
        msgText += ' גרסה ישנה';
      }

      messege.push({
        message: msgText,
        what: isCurrentVersion ? latestVote.what : false,
        pic: voterPic,
        timestamp: new Date(latestVote.zman || latestVote.createdAt || new Date()),
        sentByMe: uid === myid,
        changed: uOrder < orderon
      });
    });

    // 3.2 Diun (Chat)
    for (const d of diun) {
      const uid = d.users_permissions_user?.data?.id;
      const senderInfo = createUserInfo(pend.projectId, uid);
      const senderPic = senderInfo.src || projectInfo.src2;

      messege.push({
        message: d.why,
        what: d.what,
        pic: senderPic,
        timestamp: new Date(d.zman || d.createdAt || new Date()),
        sentByMe: uid === myid
      });
    }

    // 3.3 Forum messages (Migrated Chat)
    // forums is not typed in PendMissionData interface yet but will be available from query
    // @ts-ignore
    const forums = pend.forums?.data;
    if (forums && Array.isArray(forums)) {
      for (const forum of forums) {
        const forumMessages = forum.attributes?.messages?.data;
        if (forumMessages && Array.isArray(forumMessages)) {
          for (const msg of forumMessages) {
            const attr = msg.attributes;
            const msgUser = attr.users_permissions_user?.data;
            const msgUserId = msgUser?.id;
            let msgUserPic = projectInfo.src2;

            if (msgUser?.attributes?.profilePic?.data?.attributes?.url) {
              msgUserPic = msgUser.attributes.profilePic.data.attributes.url;
            } else if (msgUser?.attributes?.profilePic?.data?.attributes?.formats?.thumbnail?.url) {
              msgUserPic = msgUser.attributes.profilePic.data.attributes.formats.thumbnail.url;
            }

            messege.push({
              message: attr.content,
              what: true,
              pic: msgUserPic,
              timestamp: new Date(attr.createdAt),
              sentByMe: msgUserId === myid
            });
          }
        }
      }
    }

    // 3.3 Negotiations
    for (const n of negos) {
      const attr = n.attributes;
      const uid = attr.users_permissions_user?.data?.id;
      const negoInfo = createUserInfo(pend.projectId, uid);
      const negoName = negoInfo.username || 'User';
      const negoPic = negoInfo.src || projectInfo.src2;

      let msgText = `<span class="underline">${negoName} ביצע משא ומתן</span>`; // Hebrew: Did Nego

      // Detailed Diff Logic (matching old code)
      // Note: Comparing 'pend' (current values) with 'nego' (historical proposal attributes)
      // The old code compared pend vs nego. 
      // Assuming 'pend' holds the *current* state of the mission in the new architecture as well.

      if (attr.noofhours && attr.noofhours !== pend.noofhours) {
        msgText += `<br>⚙️ משימה זו ${pend.noofhours} שעות במקום ${attr.noofhours} שעות`;
      }
      if (attr.perhour && attr.perhour !== pend.perhour) {
        msgText += `<br> ⚙️ לפי שעה ${pend.perhour} במקום ${attr.perhour}`;
      }
      if ((attr.perhour && attr.perhour !== pend.perhour) || (attr.noofhours && attr.noofhours !== pend.noofhours)) {
        const currentTotal = (pend.perhour || 0) * (pend.noofhours || 0);
        const negoTotal = (attr.perhour || 0) * (attr.noofhours || 0);
        msgText += `<br>⚙️ סה"כ ${currentTotal} במקום ${negoTotal}`;
      }
      if (attr.name && attr.name !== pend.name) {
        msgText += `<br>⚙️ שם "${pend.name}" במקום: "${attr.name}"`;
      }
      if (attr.descrip && attr.descrip !== pend.descrip) {
        msgText += `<br>⚙️ תיאור "${pend.descrip}" במקום: "${attr.descrip}"`;
      }
      if (attr.hearotMeyuchadot && attr.hearotMeyuchadot !== pend.hearotMeyuchadot) {
        msgText += `<br>⚙️ הערות "${pend.hearotMeyuchadot}" במקום: "${attr.hearotMeyuchadot}"`;
      }
      if (attr.isMonth !== undefined && attr.isMonth !== pend.iskvua) {
        // Basic boolean text fallback
        const currentVal = pend.iskvua ? 'חודשי' : 'חד פעמי';
        const negoVal = attr.isMonth ? 'חודשי' : 'חד פעמי';
        msgText += `<br>⚙️ "${currentVal}" במקום: "${negoVal}"`;
      }

      messege.push({
        message: msgText,
        what: true,
        pic: negoPic,
        timestamp: new Date(attr.createdAt || new Date()),
        sentByMe: uid === myid
      });
    }

    // Sort messages: Descending timestamp first, then reverse -> Ascending (Oldest first)
    messege.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    messege.reverse();

    // 4. Priority Calculation
    let priority = 1 + users.length;
    if (already) {
      priority += 48;
    }

    const { src2, ...projectInfoWithoutSrc2 } = projectInfo;

    return {
      // Common display fields
      ani: 'pends',
      azmi: 'harchava',
      pl: priority,
      coinlapach: `pend-${pend.id}`,
      // Pass project info without src2
      ...projectInfoWithoutSrc2,
      src: src2 || '',

      // Pend-specific fields
      pendId: pend.id,
      name: pend.name,
      users: users,
      noofusersOk,
      noofusersNo,
      noofusersWaiting,
      messege: messege,
      cv,
      mdate: null,
      noofusers,
      restime,
      user_1s,
      uids,

      already,
      mypos,
      orderon,

      forumId: (pend.forums?.data && pend.forums.data.length > 0) ? pend.forums.data[0].id : null,

      // Pass through all other fields from raw data
      ...pend,
      // Map and localize fields for component compatibility
      skills: applyLocalization(pend.skills),
      tafkidims: applyLocalization(pend.tafkidims),
      workways: applyLocalization(pend.workways),
      vallues: applyLocalization(pend.vallues),

      sqadualed: pend.sqadualed || null,
      dates: pend.dates || null
    };
  });
}

/**
 * Process missions in progress into display items
 * 
 * Pure function that transforms raw in-progress mission data into display items.
 * Timer data is now pulled from the timers store for real-time updates.
 * 
 * @param mtaha - Array of in-progress mission data
 * @param projects - Array of project data for lookups
 * @param timersData - Array of timer data from timers store for real-time timer info
 * @returns Array of display items ready for rendering
 */
export function processMtaha(
  mtaha: InProgressMissionData[],
  projects: ProjectData[],
  timersData?: any[]
): DisplayItem[] {
  if (!mtaha || !Array.isArray(mtaha)) {
    return [];
  }

  return mtaha.map(mission => {
    // Use projectHelpers to get project info
    const projectInfo = createProjectInfo(mission.projectId);

    // Calculate priority - missions in progress have higher priority
    const basePriority = mission.priority ?? 150;

    // Timer Logic - Try to get from timers store first (for real-time updates)
    let totalMilliseconds = 0;
    let isActive = false;

    // Look for this mission in the timers store
    // Use loose equality (==) to handle string/number type mismatches
    const timerFromStore = timersData?.find((t: any) => t.id == mission.id || t.mId == mission.id);

    if (timerFromStore) {
      // Use timer data from store (real-time, updated via WebSocket)
      totalMilliseconds = timerFromStore.zman || 0;
      isActive = timerFromStore.running || false;
    } else if (mission.activeTimer) {
      // Fallback to local calculation if not in timers store
      isActive = mission.activeTimer.isActive;
      totalMilliseconds = mission.activeTimer.totalHours || 0;

      if (mission.activeTimer.timers) {
        mission.activeTimer.timers.forEach((timer: any) => {
          if (timer.start && timer.stop) {
            totalMilliseconds += new Date(timer.stop).getTime() - new Date(timer.start).getTime();
          }
        });
      }
    }

    return {
      // Common display fields
      ani: 'mtaha',
      azmi: 'mesima',
      pl: basePriority,
      coinlapach: `mtaha-${mission.id}`,
      // Pass project info from helper
      ...projectInfo,
      src: projectInfo.src2 || '',
      restime: getProjectRestime(mission.projectId),

      // Mtaha-specific fields
      missionId: mission.id,
      name: mission.name,
      assignedTo: mission.assignedTo,
      progress: mission.progress,

      // Timer fields - from store or calculated
      zman: totalMilliseconds,
      running: isActive,

      // Legacy fields
      pu: getProjectMembers(mission.projectId), // Replaces getProjectData(..., 'us')
      tx: txx(mission.name || ''),
      usernames: mission.myusername,

      // Pass through all other fields from raw data
      ...mission
    };
  });
}

export function processFiapp(
  fiapp: ApprovalData[],
  projects: ProjectData[]
): DisplayItem[] {
  if (!fiapp || !Array.isArray(fiapp)) {
    return [];
  }

  return fiapp.map(approval => {
    // Use projectHelpers to get project info
    const projectInfo = createProjectInfo(approval.projectId);
    const myid = approval.myid;

    // Logic from ishursium
    const rt = letters(approval.missname || '');

    // Access nested data safely
    // Note: extractFiapp puts attributes in mesimabetahlichData
    const mbData = approval.mesimabetahlichData || {};
    const mbId = approval.mesimabetahlichId;

    // Voting logic
    const users = approval.vots || [];
    let uids: string[] = [];
    let already = false;
    let mypos = null;
    let noofusersOk = 0;
    let noofusersNo = 0;
    let whyno: string[] = [];
    let whyes: string[] = [];

    // Process votes
    for (const u of users) {
      if (u.users_permissions_user?.data?.id) {
        uids.push(u.users_permissions_user.data.id);
      }

      if (u.what === true) {
        noofusersOk++;
        if (u.why) whyes.push(u.why);
      } else if (u.what === false) {
        noofusersNo++;
        if (u.why) whyno.push(u.why);
      }
    }

    // Check if I voted
    if (myid && uids.includes(myid)) {
      already = true;
      // Find my position
      const myVote = users.find((u: any) => u.users_permissions_user?.data?.id === myid);
      if (myVote) {
        mypos = myVote.what;
      }
    }

    const memberCount = projectInfo.noof || 0;
    const noofusersWaiting = memberCount - users.length;

    // Priority calc
    let basePriority = -2; // from ishursium
    if (already) {
      basePriority += 20; // 18
    }

    // Prepare whatt link
    let whatt = null;
    let whattid = null;
    // Check if 'what' (approval.what) is array or object and extract url/id
    if (approval.what) {
      // extractFiapp passes it as approval.attributes.what.data which could be array or object
      // ishursium accessed: .what?.data?.attributes?.url (implying single object)
      // or .what?.data?.id
      // If it's an array in some versions, we might need a check.
      // Assuming single media object for now based on ishursium access pattern.
      if (Array.isArray(approval.what) && approval.what.length > 0) {
        whatt = approval.what[0].attributes?.url;
        whattid = approval.what[0].id;
      } else if (approval.what.attributes) {
        whatt = approval.what.attributes.url;
        whattid = approval.what.id;
      }
    }

    // User info (requester)
    const requesterId = approval.userId;
    const requesterInfo = createUserInfo(approval.projectId, requesterId);

    return {
      // Common display fields
      ani: 'fiapp',
      azmi: 'ishrur', // 'approval' in English, 'ishrur' in old code
      pl: basePriority,
      coinlapach: `fiapp-${approval.id}`,
      // Pass project info from helper
      ...projectInfo,
      src: requesterInfo.src || '',

      // Fiapp-specific fields
      approvalId: approval.id,
      type: approval.type,

      // Mapped fields
      name: rt[0],
      stylef: rt[1],
      st: rt[2],

      uid: requesterId,
      username: requesterInfo.username,
      srcUser: requesterInfo.src, // Used as src22 in old code? No, old code mapped it to 'src' of item?

      hearotMeyuchadot: mbData.hearotMeyuchadot,
      missionDetails: mbData.descrip,
      nhours: approval.noofhours,
      mId: mbId,
      perhour: mbData.perhour,
      missId: mbData.mission?.data?.id,
      openName: approval.missname,
      omid: approval.id,
      askId: approval.id,
      why: approval.why,
      whatt,
      whattid,
      users,

      timegramaDate: approval.timegramaDate,
      timegramaId: approval.timegramaId,

      // Voting
      uids,
      already,
      mypos,
      noofusersOk,
      noofusersNo,
      whyno,
      whyes,
      noofusersWaiting,

      // Pass through all other fields from raw data
      ...approval
    };
  });
}

/**
 * Process join/ask requests into display items
 * 
 * Pure function that transforms raw ask/join request data into display items.
 * Does not modify input data.
 * 
 * @param asked - Array of ask/join request data
 * @param projects - Array of project data for lookups
 * @returns Array of display items ready for rendering
 */
/**
 * Process join/ask requests into display items
 * 
 * Pure function that transforms raw ask/join request data into display items.
 * Does not modify input data.
 * 
 * Includes restored logic for:
 * - User details (pic, username, skills, etc.)
 * - Voting calculations (votes count, did I vote?)
 * - Message history construction (including chat and negotiations)
 * - Negotiation diffs visualization
 * 
 * @param asked - Array of ask/join request data
 * @param projects - Array of project data for lookups
 * @returns Array of display items ready for rendering
 */
export function processAsked(
  asked: AskData[],
  projects: ProjectData[]
): DisplayItem[] {
  if (!asked || !Array.isArray(asked)) {
    return [];
  }

  return asked.map(ask => {
    // 1. Basic Project Info
    const projectInfo = createProjectInfo(ask.projectId);

    // 2. User Info (Requester)
    const userAttrs = ask.userAttributes || {};
    const userId = ask.userId;
    const viewerId = ask.viewerId; // From extraction

    // Determine user profile picture (src)
    // Old logic: src22 (user pic) -> src, src21 (project pic) -> src2
    let userPic = 'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png';
    if (userAttrs.profilePic?.data?.attributes?.formats?.thumbnail?.url) {
      userPic = userAttrs.profilePic.data.attributes.formats.thumbnail.url;
    } else if (userAttrs.profilePic?.data?.attributes?.url) {
      userPic = userAttrs.profilePic.data.attributes.url;
    }

    // 3. Open Mission Data or Resource Data
    const omData = ask.openMissionData || ask.openMashaabimData || {};
    const isResource = !!ask.openMashaabimData;
    const missionId = omData.mission?.data?.id || ask.openMashaabimId;

    // 4. Voting Logic
    // 4. Voting Logic
    const allVotes = ask.vots || [];
    const maxUserOrder = allVotes.reduce((max, v) => Math.max(max, v.order || 0), 0);
    const orderon = Math.max(omData.negopendmissions?.data?.length || 0, maxUserOrder);

    let noofusersOk = 0;
    let noofusersNo = 0;
    let cv = 0; // counted votes
    let already = false;
    let mypos = null;

    // Group votes by user
    const votersMap = new Map<string, any[]>();
    for (const v of allVotes) {
      const uid = v.users_permissions_user?.data?.id;
      if (uid) {
        if (!votersMap.has(uid)) votersMap.set(uid, []);
        votersMap.get(uid)?.push(v);
      }
    }

    // Process each unique voter for counts
    votersMap.forEach((votes, uid) => {
      const currentVote = votes.find(v => (v.order ?? 0) == orderon);
      if (currentVote) {
        cv++;
        if (currentVote.what === true) noofusersOk++;
        else if (currentVote.what === false) noofusersNo++;

        if (uid === viewerId) {
          already = true;
          mypos = currentVote.what;
        }
      } else {
        // Voted on old but not current
        cv++;
        noofusersNo++;
        if (uid === viewerId) {
          already = false;
          mypos = null;
        }
      }
    });

    const noofusersWaiting = (projectInfo.noof || 0) - cv;

    const restime = getProjectRestime(ask.projectId);
    const user_1s = getProjectUsers(ask.projectId) || [];
    const noofusers = projectInfo.noof;
    const uids = (projectInfo.pid || []).filter(id => id !== viewerId);

    // 5. Build Message History (Messages + Negotiations)
    const messages: any[] = [];

    // 5.1 Initial "Asked to join" message
    messages.push({
      message: `${userAttrs.username || 'User'} ביקש להצטרף ל ${omData.name || 'Mission'}`,
      what: true,
      pic: userPic,
      timestamp: new Date(ask.createdAt),
      sentByMe: false,
      changed: false
    });

    // 5.2 Vote messages - Show only the most recent vote for each user
    votersMap.forEach((votes, uid) => {
      const sortedUserVotes = [...votes].sort((a, b) => (b.order || 0) - (a.order || 0));
      const latestVote = sortedUserVotes[0];

      const voterInfo = createUserInfo(ask.projectId, uid);
      const voterName = voterInfo.username || 'Member';
      const voterPic = voterInfo.src || projectInfo.src2;
      const uOrder = latestVote.order || 0;

      const isCurrentVersion = uOrder == orderon;
      const isFavor = isCurrentVersion ? latestVote.what === true : false;

      messages.push({
        message: `${voterName} ${isFavor ? 'בעד' : 'נגד'}${!isCurrentVersion ? ' גרסה ישנה' : ''}`,
        what: isCurrentVersion ? latestVote.what : false,
        pic: voterPic,
        timestamp: new Date(latestVote.zman || latestVote.createdAt || new Date()),
        sentByMe: uid === viewerId,
        changed: (latestVote.order || 0) < orderon
      });
    });

    // 5.3 Chat messages
    if (ask.chat && Array.isArray(ask.chat)) {
      for (const chatMsg of ask.chat) {
        // Use helper to get chat user info (mainly pic)
        let chatUserPic = projectInfo.src2;
        if (chatMsg.ide) {
          const chatUserInfo = createUserInfo(ask.projectId, chatMsg.ide);
          if (chatUserInfo.src) chatUserPic = chatUserInfo.src;
        }

        messages.push({
          message: chatMsg.why || '',
          what: true,
          pic: chatUserPic,
          timestamp: new Date(chatMsg.zman || new Date()),
          sentByMe: chatMsg.ide === viewerId, // 'ide' was used in old code
          changed: false
        });
      }
    }

    // 5.5 Forum messages (Migrated Chat)
    const forums = ask.forums?.data;
    if (forums && Array.isArray(forums)) {
      for (const forum of forums) {
        const forumMessages = forum.attributes?.messages?.data;
        if (forumMessages && Array.isArray(forumMessages)) {
          for (const msg of forumMessages) {
            const attr = msg.attributes;
            const msgUser = attr.users_permissions_user?.data;
            const msgUserId = msgUser?.id;
            let msgUserPic = projectInfo.src2;

            // Try to get user pic
            if (msgUser?.attributes?.profilePic?.data?.attributes?.url) {
              msgUserPic = msgUser.attributes.profilePic.data.attributes.url;
            } else if (msgUser?.attributes?.profilePic?.data?.attributes?.formats?.thumbnail?.url) {
              msgUserPic = msgUser.attributes.profilePic.data.attributes.formats.thumbnail.url;
            }

            messages.push({
              message: attr.content,
              what: true,
              pic: msgUserPic,
              timestamp: new Date(attr.createdAt),
              sentByMe: msgUserId === viewerId,
              changed: false
            });
          }
        }
      }
    }

    // 5.4 Negotiation messages
    // Extract negotiation logic
    const negos = omData.negopendmissions?.data || [];
    if (negos.length > 0) {
      for (const nego of negos) {
        const negoAttrs = nego.attributes;
        const negoUserId = negoAttrs.users_permissions_user?.data?.id;

        // Use helper to get up-to-date member info
        const negoUserInfo = createUserInfo(ask.projectId, negoUserId);
        const negoUser = negoUserInfo.username || negoAttrs.users_permissions_user?.data?.attributes?.username || 'User';
        const negoUserPic = negoUserInfo.src || projectInfo.src2;

        let negoMsg = `<span class="underline">${negoUser} עשה משא ומתן</span>`; // Hebrew: Negotiated

        // Logic to compare fields
        // Note: omData has the current mission values. dictasked[t] in old code had them too.
        // We compare the negotiation proposal (negoAttrs) with the current values (omData).

        const currentHours = omData.noofhours || 0;
        const currentPerhour = omData.perhour || 0;
        const currentName = omData.name;
        const currentDesc = omData.descrip;
        const currentNotes = omData.hearotMeyuchadot;
        const currentIsKvua = omData.iskvua;

        if (negoAttrs.noofhours && negoAttrs.noofhours !== currentHours) {
          negoMsg += `<br>⚙️ משימה ${currentHours} שעות במקום ${negoAttrs.noofhours} שעות`;
        }
        if (negoAttrs.perhour && negoAttrs.perhour !== currentPerhour) {
          negoMsg += `<br>⚙️ לפי שעה ${currentPerhour} במקום ${negoAttrs.perhour}`;
        }
        // Total calculation
        if ((negoAttrs.perhour && negoAttrs.perhour !== currentPerhour) ||
          (negoAttrs.noofhours && negoAttrs.noofhours !== currentHours)) {
          const originalTotal = currentPerhour * currentHours;
          const negoTotal = (negoAttrs.perhour || 0) * (negoAttrs.noofhours || 0);
          negoMsg += `<br>⚙️ סה"כ ${originalTotal} במקום ${negoTotal}`;
        }

        if (negoAttrs.name && negoAttrs.name !== currentName) {
          negoMsg += `<br>⚙️ שם "${currentName}" במקום: "${negoAttrs.name}"`;
        }
        if (negoAttrs.descrip && negoAttrs.descrip !== currentDesc) {
          negoMsg += `<br>⚙️ תיאור "${currentDesc}" במקום: "${negoAttrs.descrip}"`;
        }

        messages.push({
          message: negoMsg,
          what: true,
          pic: negoUserPic,
          timestamp: new Date(negoAttrs.createdAt),
          sentByMe: negoUserId === viewerId,
          changed: false
        });
      }
    }

    // Sort messages: Chronological (Oldest first) to match original behavior
    messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());


    // 6. Priority Calculation
    // Base priority + modification if already voted (move effectively to "done" section pile if sort logic supports it)
    let priority = ask.priority ?? 100;
    if (already) {
      priority += 48; // Shift down if already handled
    }
    // Add logic from createasked: pl: 1 + i + j (essentially index based, but we stick to fixed priorities)

    const rt = letters(omData.name || '');

    return {
      // Common display fields
      name: rt[0],
      stylef: rt[1],
      st: rt[2],
      ani: isResource ? 'askedm' : 'askedcoin',
      azmi: 'ziruf',
      pl: priority,
      coinlapach: `asked-${ask.id}`,

      // Project Info
      ...projectInfo,

      // Fix: 'src' should be USER Requesting Pic, 'src2' is Project Pic.
      src: userPic,
      src2: projectInfo.src2,

      // Data fields
      askId: ask.id,
      userId: userId,
      uid: userId,
      missId: missionId,
      forumId: (ask.forums?.data && ask.forums.data.length > 0) ? ask.forums.data[0].id : null,

      // Restored Logic Fields
      username: userAttrs.username,
      userSkills: applyLocalization(userAttrs.skills?.data ? userAttrs.skills : { data: [] }),
      userRole: applyLocalization(userAttrs.tafkidims?.data ? userAttrs.tafkidims : { data: [] }),
      userWorkway: applyLocalization(userAttrs.work_ways?.data ? userAttrs.work_ways : { data: [] }),
      email: userAttrs.email,

      // Mission fields
      myid: viewerId,
      missionDetails: omData.descrip,
      hearotMeyuchadot: omData.hearotMeyuchadot,
      nhours: omData.noofhours,
      perhour: omData.perhour,
      openName: omData.name,
      omid: omData.id ?? ask.openMissionId,
      iskvua: omData.iskvua,
      skills: applyLocalization(omData.skills?.data ? omData.skills : { data: [] }),
      workways: applyLocalization(omData.work_ways?.data ? omData.work_ways : { data: [] }),
      role: applyLocalization(omData.tafkidims?.data ? omData.tafkidims : { data: [] }),
      deadline: omData.dates,
      acts: omData.acts,
      decid: omData.declined.data,
      negopendmissions: omData.negopendmissions?.data || [],
      sqedualed: omData.sqadualed,
      publicklinks: omData.publicklinks,
      privatlinks: omData.privatlinks,

      // Voting & Status
      users: allVotes, // The raw votes array
      noofusersOk,
      noofusersNo,
      noofusersWaiting,
      cv,
      already,
      mypos,
      orderon,
      mdate: null,
      restime,
      user_1s,
      uids,
      noofusers,

      // Messages
      messeges: messages,
      chat: ask.chat,

      // Raw data fallback
      ...ask
    };
  });
}

/**
 * Process asked resources (askms) into display items
 * 
 * @param askedResources - Array of asked resource data
 * @param projects - Array of project data for lookups
 * @returns Array of display items ready for rendering
 */
export function processAskedResources(
  askedResources: AskedResourceData[],
  projects: ProjectData[]
): DisplayItem[] {
  if (!askedResources || !Array.isArray(askedResources)) {
    return [];
  }

  return askedResources.map(res => {
    const projectInfo = createProjectInfo(res.projectId);
    const myid = res.myid;

    // Voting Logic
    const users = res.users || [];

    let noofusersOk = 0;
    let noofusersNo = 0;
    let already = false;
    let mypos = null;
    let uids: string[] = [];

    for (const u of users) {
      if (u.users_permissions_user?.data?.id) {
        uids.push(u.users_permissions_user.data.id);
      }

      if (u.what === true) {
        noofusersOk++;
      } else if (u.what === false) {
        noofusersNo++;
      }
    }

    if (myid && uids.includes(myid)) {
      already = true;
      const myVote = users.find((u: any) => u.users_permissions_user?.data?.id === myid);
      if (myVote) mypos = myVote.what;
    }

    const noofusersWaiting = (projectInfo.noof || 0) - users.length;

    let basePriority = res.priority || 7;

    // Letters styling
    const rt = letters(res.openName || '');

    return {
      // Common
      ani: 'askedm',
      azmi: 'ziruf',
      pl: basePriority,
      coinlapach: `askm-${res.id}`,

      ...projectInfo,
      src: res.src || projectInfo.src2 || '', // requesting user pic
      src2: projectInfo.src2, // project pic

      // Fields
      askId: res.id,
      uid: res.uid,
      username: res.username,

      // Resource specific
      price: res.price,
      easy: res.easy,
      spnot: res.spnot,
      descrip: res.descrip,
      hm: res.hm,
      myp: res.myp,
      kindOf: res.kindOf,
      spid: res.spid,
      deadline: res.deadline,
      openName: res.openName,
      omid: res.omid,

      // Helper fields
      name: rt[0],
      stylef: rt[1],
      st: rt[2],

      users: users,
      uids: uids,
      already: already,
      mypos: mypos,
      noofusersOk: noofusersOk,
      noofusersNo: noofusersNo,
      noofusersWaiting: noofusersWaiting,


      // Pass through
      ...res
    };
  });
}

/**
 * Process suggestions into display items
 * 
 * Pure function that transforms raw suggestion data into display items.
 * Does not modify input data.
 * 
 * @param suggestions - Array of suggestion data
 * @param projects - Array of project data for lookups
 * @returns Array of display items ready for rendering
 */
export function processSuggestions(
  suggestions: SuggestionData[],
  projects: ProjectData[]
): DisplayItem[] {
  if (!suggestions || !Array.isArray(suggestions)) {
    return [];
  }

  if (!projects || !Array.isArray(projects)) {
    return [];
  }

  return suggestions.map(suggestion => {
    // Try to find project in user's projects store
    const project = getProjectById(projects, suggestion.projectId);

    // Use stored project data if available (member), otherwise use embedded details (non-member)
    const projectInfo = createProjectInfo(suggestion.projectId);
    const projectName = project?.attributes.projectName || suggestion.projectDetails?.name || '';
    const projectImageUrl = project?.attributes.profilePic?.data?.attributes?.url || suggestion.projectDetails?.src || '';
    const memberCount = project?.attributes.user_1s?.data?.length || suggestion.projectDetails?.membersCount || 0;
    const restime = project?.attributes.restime || suggestion.projectDetails?.restime;

    // Suggestions have lower priority
    const basePriority = suggestion.priority ?? 200;

    // UI Styling helpers
    const hst = checkHst(projectName || '');
    const stb = checkStb(suggestion.name || '');

    return {
      // Common display fields
      ani: 'meData',
      azmi: 'hazaa', // Legacy category 'hazaa'
      pl: basePriority,
      coinlapach: `suggestion-${suggestion.id}`,
      projectId: projectInfo.projectId || suggestion.projectId,
      pid: projectInfo.pid || suggestion.projectDetails?.memberIds || [],
      projectName,
      src: projectImageUrl,

      // Suggestion-specific fields
      suggestionId: suggestion.id,
      content: suggestion.content,
      noOfusers: memberCount,
      restime: restime,

      // Pass through all other fields from raw data
      ...suggestion,

      // UI Styling helpers
      hst,
      stb,
      askId: suggestion.askId,
      chat: suggestion.chat,
      forumId: suggestion.forumId,
      alreadyi: suggestion.alreadyAsked,

      // Map and localize fields for component compatibility
      // We ensure we get a flat array for the UI components
      skills: (() => {
        const res = applyLocalization(suggestion.skills);
        return Array.isArray(res) ? res : res?.data || [];
      })(),
      role: (() => {
        const res = applyLocalization(suggestion.tafkidims);
        return Array.isArray(res) ? res : res?.data || [];
      })(),
      workways: (() => {
        const res = applyLocalization(suggestion.work_ways);
        return Array.isArray(res) ? res : res?.data || [];
      })(),

      // Overwrite original fields so UI components that still use mapping 
      // (like newcoinui.svelte passing tafkidims -> role) get the localized version.
      tafkidims: (() => {
        const res = applyLocalization(suggestion.tafkidims);
        return Array.isArray(res) ? res : res?.data || [];
      })(),
      work_ways: (() => {
        const res = applyLocalization(suggestion.work_ways);
        return Array.isArray(res) ? res : res?.data || [];
      })()
    };
  });
}

/**
 * Process resource suggestions (huca) into display items
 * 
 * @param resourceSuggestions - Array of resource suggestions
 * @param projects - Array of project data for lookups
 * @returns Array of display items ready for rendering
 */
export function processResourceSuggestions(
  resourceSuggestions: ResourceSuggestionData[],
  projects: ProjectData[]
): DisplayItem[] {
  if (!resourceSuggestions || !Array.isArray(resourceSuggestions)) {
    return [];
  }

  return resourceSuggestions.map(huca => {
    // Basic info
    const projectId = huca.projectId;
    // Check if we have project data in store, if not rely on huca embedded data
    // Usually extracting uses 'projectHelper' which looks up by ID.
    // But huca extraction embedded 'projectName' and 'srcb'.

    // We try to get "real" project info if available to ensure consistency (like member counts)
    const projectInfo = createProjectInfo(projectId);

    // Fallback/Override with huca specific embedded data
    const finalProjectName = huca.projectName || projectInfo.projectName;
    const finalSrc = huca.srcb || projectInfo.src || projectInfo.profilePic?.data?.attributes?.url || '';

    const restime = getProjectRestime(projectId);

    const basePriority = huca.priority ?? 6;

    return {
      ani: 'huca',
      azmi: 'hazaa',
      pl: basePriority,
      coinlapach: `huca-${huca.id}`,

      ...projectInfo,
      projectName: finalProjectName,
      src: finalSrc, // project pic for huca logic is 'srcb'

      // Huca specific
      id: huca.id,
      price: huca.price,
      mashname: huca.mashname,
      myp: huca.myp,
      easy: huca.easy,
      kindOf: huca.kindOf,
      sqedualed: huca.sqedualed,
      sqedualedf: huca.sqedualedf,
      restime: restime, // from helper
      spnot: huca.spnot,
      descrip: huca.descrip,
      oid: huca.oid,
      already: huca.already,
      declineddarra: huca.declineddarra,

      // Pass through
      ...huca
    };
  });
}

/**
 * Process pending resources (pmashes) into display items
 * 
 * Pure function that transforms raw pending resource data into display items.
 * Includes complete logic for:
 * - Voting calculations (already voted, vote counts, orderon logic)
 * - Message history construction (votes, diun/chat, negotiations)
 * - Negotiation diffs visualization (comparing nego proposals with current values)
 * - Priority calculation based on voting status
 * 
 * @param pmashes - Array of pending resource data
 * @param projects - Array of project data for lookups
 * @returns Array of display items ready for rendering
 */
export function processPmashes(
  pmashes: PendResourceData[],
  projects: ProjectData[]
): DisplayItem[] {
  if (!pmashes || !Array.isArray(pmashes)) {
    return [];
  }

  return pmashes.map(pmash => {
    // 1. Basic Project Info
    const projectInfo = createProjectInfo(pmash.projectId);
    const myid = pmash.myid; // Viewer ID from extraction

    // 2. Voting Logic
    const users = pmash.users || [];
    const diun = pmash.diun || [];
    const nego_mashes = pmash.nego_mashes?.data || [];
    const orderon = nego_mashes.length || 0; // Current negotiation version

    // Extract user IDs who voted
    const uids: string[] = [];
    for (const vote of users) {
      const voterId = vote.users_permissions_user?.data?.id;
      if (voterId) {
        uids.push(voterId);
      }
    }

    // Voting calculations
    let already = false;
    let mypos = null;
    let noofusersOk = 0;
    let noofusersNo = 0;
    let cv = 0; // counted votes

    // Check if viewer voted on current version
    if (myid && uids.includes(myid)) {
      for (const vote of users) {
        if (vote.users_permissions_user?.data?.id === myid) {
          if (vote.order == orderon) {
            already = true;
            mypos = vote.what;
          }
        }
      }
    }

    // Count votes for current version (orderon)
    // Complex logic from old code to handle re-voting scenarios
    for (const vote of users) {
      const voterId = vote.users_permissions_user?.data?.id;

      if (vote.order == orderon) {
        cv += 1;
        if (vote.what === true) {
          noofusersOk += 1;
        } else if (vote.what === false) {
          noofusersNo += 1;
        }
      } else {
        // Check for duplicate votes (user voted on old version and new version)
        const occurrences = uids.filter(id => id === voterId).length;

        if (occurrences > 1) {
          // User has multiple votes, check if they voted on current version
          const hasCurrentVote = users.some(
            u => u.users_permissions_user?.data?.id === voterId && u.order === orderon
          );

          if (!hasCurrentVote) {
            cv += 1;
            noofusersNo += 1;
          }
        } else {
          // User only voted on old version
          cv += 1;
          noofusersNo += 1;
        }
      }
    }

    const restime = getProjectRestime(pmash.projectId);
    const user_1s = getProjectUsers(pmash.projectId) || [];
    const noofusers = projectInfo.noof;

    // uids = all ids beside my id in flat array
    const uids_members = (projectInfo.pid || []).filter(id => id !== myid);

    const noofusersWaiting = noofusers - cv;

    // 3. Build Message History
    const messege: any[] = [];

    // 3.1 Vote messages
    if (users.length > 0) {
      for (const vote of users) {
        const voterId = vote.users_permissions_user?.data?.id;
        const voterInfo = createUserInfo(pmash.projectId, voterId);

        messege.push({
          message: `${voterInfo.username} בעד${vote.order != orderon ? ' (גרסה ישנה)' : ''}`,
          what: vote.what,
          pic: voterInfo.src,
          sentByMe: voterId === myid,
          changed: vote.order < orderon
        });
      }
    }

    // 3.2 Diun (chat) messages
    if (diun.length > 0) {
      for (const chat of diun) {
        const chatUserId = chat.users_permissions_user?.data?.id;
        const chatUserInfo = createUserInfo(pmash.projectId, chatUserId);

        messege.push({
          message: chat.why || '',
          what: chat.what,
          pic: chatUserInfo.src,
          sentByMe: chatUserId === myid
        });
      }
    }

    // 3.3 Negotiation messages with detailed diffs
    if (nego_mashes.length > 0) {
      for (const nego of nego_mashes) {
        const negoAttrs = nego.attributes;
        const negoUserId = negoAttrs.users_permissions_user?.data?.id;
        const negoUserInfo = createUserInfo(pmash.projectId, negoUserId);

        // Build negotiation message with field-by-field comparison
        let negoMsg = `<span class="underline">${negoUserInfo.username} עשה משא ומתן</span>`;


        // Compare hm (quantity)
        if (negoAttrs.hm && negoAttrs.hm !== pmash.hm) {
          negoMsg += `<br>⚙️ שהמשאב כמות ${pmash.hm ?? 0} במקום ${negoAttrs.hm ?? 0}`;
        }

        // Compare price
        if (negoAttrs.price && negoAttrs.price !== pmash.price) {
          negoMsg += `<br>⚙️ שהמשאב מחיר ${pmash.price ?? 0} במקום ${negoAttrs.price ?? 0}`;
        }

        // Compare easy
        if (negoAttrs.easy && negoAttrs.easy !== pmash.easy) {
          negoMsg += `<br>⚙️ שהמשאב קלות ${pmash.easy ?? 0} במקום ${negoAttrs.easy ?? 0}`;
        }

        // Total price calculation
        if (negoAttrs.price !== pmash.price || negoAttrs.hm !== pmash.hm) {
          const currentTotal = (pmash.price || 0) * 1 * (pmash.hm || 0);
          const negoTotal = (negoAttrs.price || pmash.price || 0) * 1 * (negoAttrs.hm || pmash.hm || 0);
          negoMsg += `<br>⚙️ סה"כ למשאב ${currentTotal} במקום ${negoTotal}`;
        }

        // Total easy calculation
        if (negoAttrs.easy !== pmash.easy || negoAttrs.hm !== pmash.hm) {
          const currentEasyTotal = (pmash.easy || 0) * 1 * (negoAttrs.hm || pmash.hm || 0);
          const negoEasyTotal = (negoAttrs.easy || pmash.easy || 0) * 1 * (negoAttrs.hm || pmash.hm || 0);
          negoMsg += `<br>⚙️ סה"כ ${currentEasyTotal} במקום ${negoEasyTotal}`;
        }

        // Compare name
        if (negoAttrs.name && negoAttrs.name !== pmash.name) {
          negoMsg += `<br>⚙️ שם משאב משא ומתן "${pmash.name}" במקום: "${negoAttrs.name}"`;
        }

        // Compare description
        if (negoAttrs.descrip && negoAttrs.descrip !== pmash.descrip) {
          negoMsg += `<br>⚙️ תיאור משאב משא ומתן "${pmash.descrip}" במקום: "${negoAttrs.descrip}"`;
        }

        // Compare special notes (spnot/hearotMeyuchadot)
        if (negoAttrs.spnot && negoAttrs.spnot !== pmash.spnot) {
          negoMsg += `<br>⚙️ הערות מיוחדות משאב משא ומתן "${pmash.spnot}" במקום: "${negoAttrs.spnot}"`;
        }

        // Compare kindOf (resource type)
        if (negoAttrs.kindOf && negoAttrs.kindOf !== pmash.resourceType) {
          negoMsg += `<br>⚙️ סוג ${pmash.resourceType} במקום: "${negoAttrs.kindOf}"`;
        }

        messege.push({
          message: negoMsg,
          what: true,
          pic: negoUserInfo.src,
          timestamp: new Date(negoAttrs.createdAt),
          sentByMe: negoUserId === myid
        });
      }
    }

    // Sort messages chronologically (oldest first)
    messege.sort((a, b) => {
      const timeA = a.timestamp ? a.timestamp.getTime() : 0;
      const timeB = b.timestamp ? b.timestamp.getTime() : 0;
      return timeA - timeB;
    });

    // 4. Priority Calculation
    let priority = 1 + users.length;
    if (already) {
      priority += 48; // Move down if already voted
    }

    const { src2, ...projectInfoWithoutSrc2 } = projectInfo;
    const { nego_mashes: _rawNego, ...pmashRest } = pmash;

    return {
      // Common display fields
      ani: 'pmashes',
      azmi: 'harchava',
      pl: priority,
      coinlapach: `pmash-${pmash.id}`,

      // Project Info without src2
      ...projectInfoWithoutSrc2,
      src: src2 || '',

      // Pmash-specific fields
      pendId: pmash.id,
      name: pmash.name,
      descrip: pmash.descrip,
      hearotMeyuchadot: pmash.spnot,
      kindOf: pmash.resourceType,
      hm: pmash.hm,
      price: pmash.price,
      easy: pmash.easy,
      linkto: pmash.linkto,
      sqadualed: pmash.sqadualed,
      sqadualedf: pmash.sqadualedf,

      // Timegrama
      timegramaId: pmash.timegramaId,
      timeGramaDate: pmash.timegramaDate,

      // Voting & Status
      users,
      uids: uids_members,
      already,
      mypos,
      cv,
      mdate: null,
      noofusers,
      restime,
      user_1s,
      noofusersOk,
      noofusersNo,
      noofusersWaiting,
      orderon,

      // Messages
      messege,
      diun,
      nego_mashes,

      // Additional fields
      myid,
      mshaabId: pmash.mashaabimId,
      created_at: pmash.createdAt,

      // Pass through all other fields from raw data
      ...pmashRest
    };
  });
}

/**
 * Process resource requests into display items
 * 
 * Pure function that transforms raw resource request data into display items.
 * Does not modify input data.
 * 
 * @param wegets - Array of resource request data
 * @param projects - Array of project data for lookups
 * @returns Array of display items ready for rendering
 */
export function processWegets(
  wegets: ResourceRequestData[],
  projects: ProjectData[]
): DisplayItem[] {
  if (!wegets || !Array.isArray(wegets)) {
    return [];
  }

  return wegets.map(weget => {
    // Use projectHelpers to get project info
    const projectInfo = createProjectInfo(weget.projectId);

    // Use helper for user info (Fixes src, username, uid consistency)
    const userInfo = createUserInfo(weget.projectId, weget.userId);

    const myid = weget.myid;

    // Logic from crMaap - letters function for name styling
    const rt = letters(weget.spName || '');

    // Voting logic from crMaap
    const users = weget.vots || [];
    let uids: string[] = [];
    let already = false;
    let mypos = null;
    let noofusersOk = 0;
    let noofusersNo = 0;
    let whyno: string[] = [];
    let whyes: string[] = [];
    let what: boolean[] = [];

    // Process votes - first pass to collect uids and what array
    for (const u of users) {
      if (u.users_permissions_user?.data?.id) {
        uids.push(u.users_permissions_user.data.id);
      }
      what.push(u.what);
    }

    // Check if I voted
    if (myid && uids.includes(myid)) {
      already = true;
      // Find my position
      const myVote = users.find((u: any) => u.users_permissions_user?.data?.id === myid);
      if (myVote) {
        mypos = myVote.what;
      }
    }

    // Count votes
    for (const u of users) {
      if (u.what === true) {
        noofusersOk++;
        if (u.why) whyes.push(u.why);
      } else if (u.what === false) {
        noofusersNo++;
        if (u.why) whyno.push(u.why);
      }
    }

    const memberCount = projectInfo.noof || 0;
    const noofusersWaiting = memberCount - users.length;

    // Priority calc from crMaap: pl: -1 + y.vots.length
    const basePriority = -1 + users.length;

    return {
      // Pass through all other fields from raw data FIRST so they can be overridden
      ...weget,

      // Common display fields
      ani: 'wegets',
      azmi: 'ishrur', // Keep 'ishrur' to match old code
      pl: basePriority,
      coinlapach: `weget-${weget.id}`,

      // Pass project info from helper (overwrites fields if needed)
      ...projectInfo,

      // User Info from Helper (Fixes src, username, uid consistency)
      // This MUST be after ...weget to overwrite the default src from extractor
      src: userInfo.src || '',
      uid: userInfo.uid,
      username: userInfo.username,

      // Weget-specific fields from crMaap
      myp: weget.myp,
      spid: weget.spId,
      omid: weget.openMashaabimId,
      askId: weget.id,
      users,
      hm: weget.unit,
      openName: weget.openName,
      easy: weget.easy,
      price: weget.price,
      sqadualed: weget.sqadualed,
      sqadualedf: weget.sqadualedf,
      spnot: weget.spnot,
      kindOf: weget.kindOf,
      name: rt[0],
      stylef: rt[1],
      st: rt[2],
      projectId: weget.projectId,
      projectName: projectInfo.projectName,
      noof: projectInfo.noof,
      src2: projectInfo.src2,
      myid: myid,

      // Voting fields
      uids,
      what,
      already,
      mypos,
      noofusersOk,
      noofusersNo,
      whyno,
      whyes,
      noofusersWaiting
    };
  });
}

/**
 * Process profit distribution requests into display items
 * 
 * Pure function that transforms raw haluka data into display items.
 * Does not modify input data.
 * 
 * @param halukas - Array of haluka (tosplit) data
 * @param projects - Array of project data for lookups
 * @returns Array of display items ready for rendering
 */
export function processHalukas(
  halukas: HalukaData[],
  projects: ProjectData[]
): DisplayItem[] {
  if (!halukas || !Array.isArray(halukas)) {
    return [];
  }

  return halukas.map(haluka => {
    // Use projectHelpers to get project info
    const projectInfo = createProjectInfo(haluka.projectId);
    const myid = haluka.myid;

    // --- Rashbi Logic Implementation ---

    const users = haluka.users || [];
    let already = false;
    let noofusersOk = 0;
    let noofusersNo = 0;

    // 1. Prepare arrays for UI (rashbi: uids, what)
    // Note: In the new system we pass the full 'users' array, 
    // but we can compute derived stats here.
    const uids: string[] = [];

    for (const vote of users) {
      if (vote?.users_permissions_user?.data?.id) {
        uids.push(vote.users_permissions_user.data.id);
      }
    }

    // 2. Voting counts and 'already' status
    if (myid && uids.includes(myid)) {
      already = true;
    }

    for (const vote of users) {
      if (vote.what === true) {
        noofusersOk += 1;
      } else if (vote.what === false) {
        noofusersNo += 1;
      }
    }

    // 3. Waiting count
    const memberCount = projectInfo.noof || 0;
    const noofusersWaiting = memberCount - users.length;

    // 4. Priority Logic (rashbi: pl = 1 + vots.length; if already: pl += 25)
    let basePriority = 1 + users.length;
    if (already) {
      basePriority += 25;
    }

    return {
      // Common display fields
      ani: 'haluk',
      azmi: 'hachla', // Matched rashbi: 'azmi: hachla'
      pl: basePriority,
      coinlapach: `haluka-${haluka.id}`,

      // Pass project info from helper
      ...projectInfo,
      src: projectInfo.src2 || '',
      noofusers: projectInfo.noof,
      // Haluka/Tosplit fields
      pendId: haluka.id, // mapped from rashbi: pendId: projects[i].attributes.tosplits.data[j].id
      name: haluka.name,

      // Data Arrays
      users: users,
      uids: uids,
      halukot: haluka.halukot,
      hervach: haluka.hervach,

      // Status
      already,
      noofusersOk,
      noofusersNo,
      noofusersWaiting,

      // Raw data fallback
      ...haluka
    };
  });
}

/**
 * Process welcome messages into display items
 * 
 * Pure function that transforms raw welcome message data into display items.
 * Does not modify input data.
 * 
 * @param welcome - Array of welcome message data
 * @param projects - Array of project data for lookups
 * @returns Array of display items ready for rendering
 */
export function processWelcome(
  welcome: WelcomeData[],
  projects: ProjectData[]
): DisplayItem[] {
  if (!welcome || !Array.isArray(welcome)) {
    return [];
  }

  return welcome.map(welcomeMsg => {
    // Use projectHelpers to get project info
    const projectInfo = createProjectInfo(welcomeMsg.projectId);

    // Welcome messages have high priority in original (pl: 1)
    const basePriority = welcomeMsg.priority ?? 1;

    return {
      // Common display fields
      ani: 'walcomen',
      azmi: 'mesima', // Restored to 'mesima' to match old logic (was 'welcome')
      pl: basePriority,
      coinlapach: `welcome-${welcomeMsg.id}`,
      // Pass project info from helper
      ...projectInfo,
      src: projectInfo.src2 || '',
      projectName: projectInfo.projectName,

      // Welcome-specific fields
      welcomeId: welcomeMsg.id,
      message: welcomeMsg.message,
      details: welcomeMsg.details, // Restored field
      pd: welcomeMsg.pd,           // Restored field
      username: welcomeMsg.username, // Restored field

      // Pass through all other fields from raw data
      ...welcomeMsg
    };
  });
}

/**
 * Process money transfers into display items
 * 
 * Pure function that transforms raw transfer data into display items.
 * Does not modify input data.
 * 
 * @param transfers - Array of transfer data
 * @param projects - Array of project data for lookups
 * @returns Array of display items ready for rendering
 */
export function processTransfers(
  transfers: TransferData[],
  projects: ProjectData[]
): DisplayItem[] {
  if (!transfers || !Array.isArray(transfers)) {
    return [];
  }

  return transfers.map(transfer => {
    // Use projectHelpers to get project info
    const projectInfo = createProjectInfo(transfer.projectId);

    // Transfers have medium priority
    const basePriority = transfer.priority ?? 90;

    // Process Chat Logic
    const messege: any[] = [];
    const chat = transfer.chat || [];
    const myid = transfer.myid;

    if (Array.isArray(chat)) {
      for (const c of chat) {
        const senderId = c.send?.data?.id;
        // Helper to get user info (pic)
        const userInfo = createUserInfo(transfer.projectId, senderId);

        messege.push({
          message: c.freetext,
          when: c.when,
          pic: userInfo.src || 'https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png',
          sentByMe: senderId === myid,
          seen: c.seen
        });
      }
    }

    return {
      // Common display fields
      ani: 'vidu',
      azmi: 'vidu',
      pl: basePriority,
      coinlapach: `transfer-${transfer.id}`,
      // Pass project info from helper
      ...projectInfo,
      src: projectInfo.src2 || '',

      // Transfer-specific fields
      transferId: transfer.id,
      amount: transfer.amount,
      messege: messege, // Add processed messages

      // Pass through all other fields from raw data
      ...transfer
    };
  });
}

/**
 * Process decisions into display items
 * 
 * Pure function that transforms raw decision data into display items.
 * Does not modify input data.
 * 
 * @param decisions - Array of decision data
 * @param projects - Array of project data for lookups
 * @returns Array of display items ready for rendering
 */
export function processDecisions(
  decisions: DecisionData[],
  projects: ProjectData[]
): DisplayItem[] {
  if (!decisions || !Array.isArray(decisions)) {
    return [];
  }

  return decisions.map(decision => {
    // 1. Basic Info
    const projectInfo = createProjectInfo(decision.projectId);
    const myid = decision.myid;
    const users = decision.users || []; // Votes

    // 2. Voting Logic
    let already = false;
    let mypos = null;
    let noofusersOk = 0;
    let noofusersNo = 0;
    let cv = 0;

    // Check my vote
    if (myid) {
      // Iterate users to find if I voted
      // hachla logic: loops uids then loops users again. Simplifiable.
      const myVote = users.find((u: any) => u?.users_permissions_user?.data?.id === myid);
      if (myVote) {
        already = true;
        // hachla check: if order !== 1, but extracting 'users' usually implies current votes?
        // The old code check: if (hachlatot[t].users[l].order !== 1) { mypos = ... }
        // But wait, hachla loop:
        // "if (hachlatot[t].users[l].order !== 1) { hachlatot[t].mypos = hachlatot[t].users[l].what; }"
        // Note: 'order' logic seems specific here. assuming current votes have valid order or we ignore it.
        // If we assume extractDecisions pulls current votes, let's trust them.
        // But let's keep the order check if possible, though 'order' isn't explicitly in 'DecisionData' votes usually?
        // In `extractDecisions`, `vots` typically has `order`.
        // We'll assume if it's in the list, it's valid for now, or check != 1 if that was the "active" condition.
        if (myVote.order !== 1) {
          mypos = myVote.what;
        }
      }
    }

    // Count votes
    for (const u of users) {
      // hachla check: if (users[r].order !== 1)
      if (u.order !== 1) {
        cv++;
        if (u.what === true) noofusersOk++;
        else if (u.what === false) noofusersNo++;
      }
    }

    const memberCount = projectInfo.noof || 0;
    const noofusersWaiting = memberCount - cv;

    // 3. Priority Logic
    let basePriority = 1 + users.length; // hachla logic
    if (already) {
      basePriority += 48;
    }

    // 4. Message Construction
    const messege: any[] = [];
    for (const u of users) {
      const uid = u.users_permissions_user?.data?.id;
      const voterInfo = createUserInfo(decision.projectId, uid);
      const voterName = voterInfo.username || 'User';

      const isFavor = u.what === true;
      // Hebrew from hachla:
      // message: `${username} ${what==true ? 'בעד' : ' נגד \n ${why!==null ? `בנימוק: ${why}` : ''}`}`

      let msgText = `${voterName} ${isFavor ? 'בעד' : 'נגד'}`;
      if (u.why) {
        msgText += `\nבנימוק: ${u.why}`;
      }

      messege.push({
        message: msgText,
        what: u.what,
        pic: '', // hachla used empty string or src22 (which was empty string in hachla loop logic?)
        // hachla: let src22 = ''; ... pic: src22
        sentByMe: uid === myid,
        changed: u.order == 1
      });
    }

    // Common fields
    const commonFields = {
      ani: 'hachla',
      azmi: 'hachla',
      pl: basePriority,
      coinlapach: `decision-${decision.id}`,
      ...projectInfo,
      src: projectInfo.src2 || '',
      users,
      myid,
      already,
      mypos,
      cv,
      noofusersOk,
      noofusersNo,
      noofusersWaiting,
      messege
    };

    // Specific mapping based on Type
    if (decision.kind === 'sheirutpends') {
      return {
        ...commonFields,
        ...decision, // includes spdata
        pendId: decision.id,
        newpic: ""
      };
    } else {
      // Standard Decision (pic or other)
      return {
        ...commonFields,
        ...decision,
        pendId: decision.id,
        restime: getProjectRestime(decision.projectId),
        // newpic, newpicid are passed from decision extract
        created_at: decision.createdAt
      };
    }
  });
}

/**
 * Merge multiple arrays of display items and sort by priority
 * 
 * Pure function that combines arrays and sorts them.
 * Does not modify input arrays.
 * 
 * @param arrays - Variable number of display item arrays to merge
 * @returns Single sorted array of all display items
 */
export function mergeAndSort(...arrays: DisplayItem[][]): DisplayItem[] {
  // Flatten all arrays into one
  const merged = arrays.flat();

  // Sort by priority (pl field), lower numbers = higher priority
  return merged.sort((a, b) => {
    const priorityA = a.pl ?? 999;
    const priorityB = b.pl ?? 999;
    return priorityA - priorityB;
  });
}
