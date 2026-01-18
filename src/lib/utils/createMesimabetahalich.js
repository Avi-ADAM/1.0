/**
 * Creates a mesimabetahalich (mission in progress) from an open mission.
 * Use this utility when:
 * - A single user in a project wants to perform a mission (no voting needed)
 * - All project users have voted to approve the mission
 * - Converting an open mission to an in-progress mission
 * 
 * @param {Object} params - Parameters for creating the mission
 * @param {string} params.projectId - Project ID
 * @param {string} params.missId - Mission ID
 * @param {string} params.openMid - Open mission ID
 * @param {string} params.askId - Ask ID (optional, for voting scenarios)
 * @param {string} params.userId - User ID who will perform the mission
 * @param {string} params.currentUserId - Current logged in user ID
 * @param {string} params.openmissionName - Mission name
 * @param {string} params.missionDetails - Mission description
 * @param {number} params.nhours - Hours assigned
 * @param {number} params.valph - Value per hour
 * @param {boolean} params.iskvua - Is scheduled
 * @param {string} params.hearotMeyuchadot - Special notes
 * @param {string} params.privatlinks - Private links
 * @param {string} params.publicklinks - Public links
 * @param {Array} params.tafkidims - Role IDs
 * @param {string} params.deadline - Deadline date (optional)
 * @param {string} params.sqedualed - Scheduled start date (optional)
 * @param {number} params.timegramaId - Timegrama ID (optional)
 * @param {Array} params.projectUserIds - All project user IDs
 * @param {Array} params.userss - Current votes (optional, for voting scenarios)
 * @param {boolean} params.newnew - Whether user is new to project
 * @param {Function} params.sendToSer - sendToSer function
 * @returns {Promise<Object>} The mutation result
 */
export async function createMesimabetahalich({
  projectId,
  missId,
  openMid,
  askId = null,
  userId,
  currentUserId,
  openmissionName,
  missionDetails,
  nhours,
  valph,
  iskvua,
  hearotMeyuchadot,
  privatlinks,
  publicklinks,
  tafkidims,
  deadline = null,
  sqedualed = null,
  timegramaId = null,
  projectUserIds = [],
  userss = [],
  newnew,
  sendToSer
}) {
  const d = new Date();
  const tafkidimsa = tafkidims.map((c) => c.id || c);
  
  // Convert proxy to regular array and ensure string comparison
  const userIdsArray = Array.from(projectUserIds).map(String);
  const userIdString = String(userId);
  const needsWelcome = newnew === true;
  
  console.log("UIDD Debug:", {
    needsWelcome,
    userIdsArray,
    userIdString,
    includes: userIdsArray.includes(userIdString)
  })
  // Step 1: Create mesimabetahalich
  const mesimabetahalikhResult = await sendToSer(
    {
      projectId,
      missId,
      userId,
      openmissionName,
      missionDetails: missionDetails || '',
      nhours,
      valph,
      iskvua: iskvua || false,
      hearotMeyuchadot: hearotMeyuchadot || '',
      privatlinks: privatlinks || '',
      publicklinks: publicklinks || '',
      tafkidims: tafkidimsa,
      deadline,
      sqedualed,
      publishedAt: d.toISOString()
    },
    '72createMesimabetahalich',
    null,
    null,
    false,
    fetch
  );

  if (!mesimabetahalikhResult?.data?.createMesimabetahalich) {
    throw new Error('Failed to create mesimabetahalich');
  }

  // Step 2: Archive open mission
  const archiveResult = await sendToSer(
    { openMid },
    '73archiveOpenMission',
    null,
    null,
    false,
    fetch
  );

  // Step 3: Add user to project if needed
  if (needsWelcome) {
    await sendToSer(
      {
        userId,
        projectId,
        publishedAt: d.toISOString()
      },
      '75createWelcomeTop',
      null,
      null,
      false,
      fetch
    );

    await sendToSer(
      {
        projectId,
        userIds: [...projectUserIds, userId]
      },
      '74addUserToProject',
      null,
      null,
      false,
      fetch
    );
  }

  // Step 4: Archive ask with votes if provided
  if (askId) {
    // Ensure userss is an array and normalize the structure
    const votesArray = Array.isArray(userss) ? userss : [];
    
    // Normalize votes to extract user IDs from nested structures
    const normalizedVotes = votesArray.map(vote => {
      const normalized = { ...vote };
      
      // Extract user ID if it's in nested structure
      if (vote.users_permissions_user?.data?.id) {
        normalized.users_permissions_user = vote.users_permissions_user.data.id;
      }
      
      return normalized;
    });
    
    const vots = normalizedVotes.length > 0 
      ? [...normalizedVotes, { what: true, users_permissions_user: currentUserId }]
      : [{ what: true, users_permissions_user: currentUserId }];
    
    await sendToSer(
      {
        askId,
        vots
      },
      '76archiveAsk',
      null,
      null,
      false,
      fetch
    );
  }

  // Step 5: Update timegrama if provided
  if (timegramaId) {
    await sendToSer(
      {
        id: timegramaId,
        done: true
      },
      '35updateTimeGrama',
      null,
      null,
      false,
      fetch
    );
  }

  // Return combined result in expected format
  return {
    data: {
      createMesimabetahalich: mesimabetahalikhResult.data.createMesimabetahalich,
      updateOpenMission: archiveResult.data.updateOpenMission
    }
  };
}

/**
 * Handles post-creation tasks after mesimabetahalich is created
 * - Creates monter if iskvua
 * - Archives other asks
 * - Sends email if new user
 * - Updates acts with mesimabetahalich reference
 * 
 * @param {Object} params - Parameters for post-processing
 * @param {Object} params.miDatan - Result from createMesimabetahalich
 * @param {boolean} params.isNewUser - Whether user is new to project
 * @param {boolean} params.iskvua - Is scheduled/recurring
 * @param {string} params.sqedualed - Scheduled start date
 * @param {string} params.deadline - Deadline date
 * @param {string} params.userId - User ID
 * @param {string} params.currentUserId - Current logged in user ID
 * @param {string} params.useraplyname - User display name
 * @param {string} params.projectName - Project name
 * @param {string} params.src2 - Project image source
 * @param {string} params.openmissionName - Mission name
 * @param {string} params.lang - Language
 * @param {Function} params.sendToSer - sendToSer function
 * @param {Object} params.projectUserData - Project user data (optional, for email)
 * @returns {Promise<void>}
 */
export async function afterMesimabetahalikhCreation({
  miDatan,
  isNewUser,
  iskvua,
  sqedualed,
  deadline,
  userId,
  currentUserId,
  useraplyname,
  projectName,
  src2,
  openmissionName,
  lang,
  sendToSer,
  projectUserData = null
}) {
  const d = new Date();
  const chiluzh = miDatan.data.createMesimabetahalich.data.id;
  
  // Create monter if iskvua
  if (iskvua === true) {
    const startDate = sqedualed && new Date(sqedualed) > d 
      ? sqedualed 
      : d.toISOString();
    
    await sendToSer(
      {
        mesimabetahalikhId: chiluzh,
        start: startDate,
        finish: deadline || null
      },
      '77createMonter',
      null,
      null,
      false,
      fetch
    );
  }

  // Archive other asks (if there are multiple)
  const otherasks = miDatan.data.updateOpenMission.data.attributes.asks.data;
  if (otherasks.length > 1) {
    // Archive all other asks except the current one
    for (let i = 0; i < otherasks.length; i++) {
      await sendToSer(
        {
          askId: otherasks[i].id,
          vots: null
        },
        '76archiveAsk',
        null,
        null,
        false,
        fetch
      );
    }
  }

  // Send email if new user
  if (isNewUser && projectUserData) {
    const ema = projectUserData;
    let emailt, userLang;
    
    for (let i = 0; i < ema.length; i++) {
      if (ema[i].id === userId) {
        emailt = ema[i].attributes?.email;
        userLang = ema[i].attributes?.lang;
        break;
      }
    }
    
    if (emailt) {
      const langi = (userLang === 'he' || userLang === 'en') ? userLang : lang;
      
      await fetch('/api/sma', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: useraplyname,
          projectName,
          projectSrc: src2,
          missionName: openmissionName,
          email: emailt,
          lang: langi,
          kind: 'exeptedMission'
        })
      });
    }
  }

  // Update acts with mesimabetahalich reference
  const acts = miDatan.data.updateOpenMission.data.attributes.acts.data;
  for (let i = 0; i < acts.length; i++) {
    await sendToSer(
      {
        id: acts[i].id,
        myIshur: true,
        isAssigned: true,
        uid: [currentUserId],
        mesimabetahaliches: [chiluzh]
      },
      '31updateTask',
      null,
      null,
      false,
      fetch
    );
  }
}
