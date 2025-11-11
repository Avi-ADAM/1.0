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
 * @param {string} params.token - JWT token
 * @param {string} params.linkg - GraphQL endpoint
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
  token,
  linkg
}) {
  const d = new Date();
  const bearer = 'bearer ' + token;
  
  const tafkidimsa = tafkidims.map((c) => c.id || c);
  
  const sdate = sqedualed ? `start: "${sqedualed}"` : '';
  const date = deadline ? `admaticedai: "${deadline}"` : '';
  
  // Check if user needs to be added to project
  const needsWelcome = !projectUserIds.includes(userId);
  
  const welcomeMutation = needsWelcome
    ? `createWelcomTop(
        data: {
          users_permissions_user: "${userId}",
          project: "${projectId}"
          publishedAt: "${d.toISOString()}",
        }
      ) {data{id}}`
    : '';
  
  const addUserMutation = needsWelcome
    ? `updateProject(
        id: "${projectId}"
        data: {user_1s: [${[...projectUserIds, userId].map(id => `"${id}"`).join(',')}]}
      ) {data{attributes {user_1s{data {id attributes{ email lang}}}}}}`
    : '';
  
  const updateAskMutation = askId
    ? `updateAsk(
        id: "${askId}" 
        data: { 
          archived: true,
          vots: [${userss}, {
            what: true
            users_permissions_user: "${currentUserId}"
          }]
        }
      ) {data{id}}`
    : '';
  
  const updateTimegramaMutation = timegramaId
    ? `updateTimegrama(
        id: ${timegramaId}
        data: {done: true}
      ) {data{id}}`
    : '';

  const mutation = `mutation {
    createMesimabetahalich(
      data: {
        project: "${projectId}",
        mission: "${missId}",
        hearotMeyuchadot: """${hearotMeyuchadot}""",
        name: """${openmissionName}""",
        descrip: """${missionDetails}""",
        hoursassinged: ${nhours},
        perhour: ${valph}, 
        iskvua: ${iskvua},  
        privatlinks: """${privatlinks}""",
        publicklinks: """${publicklinks}""", 
        users_permissions_user: "${userId}",
        tafkidims: [${tafkidimsa}],
        publishedAt: "${d.toISOString()}",
        ${date}
        ${sdate}
      }
    ) {data{id attributes{project{data{id}}}}}

    updateOpenMission(
      id: "${openMid}"
      data: {archived: true}
    ) {data{id attributes{archived acts{data{id}} asks{data{id}}}}}
    
    ${welcomeMutation}
    ${addUserMutation}
    ${updateAskMutation}
    ${updateTimegramaMutation}
  }`;

  const response = await fetch(linkg, {
    method: 'POST',
    headers: {
      Authorization: bearer,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: mutation })
  });

  return response.json();
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
 * @param {string} params.token - JWT token
 * @param {string} params.linkg - GraphQL endpoint
 * @param {Function} params.sendToSer - sendToSer function
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
  token,
  linkg,
  sendToSer
}) {
  const d = new Date();
  const bearer = 'bearer ' + token;
  const chiluzh = miDatan.data.createMesimabetahalich.data.id;
  
  // Create monter if iskvua
  let monti = '';
  if (iskvua === true) {
    const startDate = sqedualed && new Date(sqedualed) > d 
      ? sqedualed 
      : d.toISOString();
    const finishDate = deadline ? `finish: "${deadline}"` : '';
    
    monti = `createMonter(
      data: {
        mesimabetahalich: "${chiluzh}",
        ani: "mesimabetahalich"
        start: "${startDate}"
        ${finishDate}
      }
    ) {data{id}}`;
  }

  // Archive other asks
  const otherasks = miDatan.data.updateOpenMission.data.attributes.asks.data;
  if (otherasks.length > 1) {
    for (let i = 0; i < otherasks.length; i++) {
      const nextquery = `mutation {
        ${i === 0 ? monti : ''}
        updateAsk(
          id: "${otherasks[i].id}" 
          data: { archived: true }
        ) {data{id}}
      }`;
      
      await fetch(linkg, {
        method: 'POST',
        headers: {
          Authorization: bearer,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: nextquery })
      });
    }
  } else if (monti && otherasks.length === 1) {
    // If only one ask and we need to create monter
    await fetch(linkg, {
      method: 'POST',
      headers: {
        Authorization: bearer,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        query: `mutation { ${monti} }` 
      })
    });
  }

  // Send email if new user
  if (isNewUser && miDatan.data.updateProject) {
    const ema = miDatan.data.updateProject.data.attributes.user_1s.data;
    let emailt, userLang;
    
    for (let i = 0; i < ema.length; i++) {
      if (ema[i].id === userId) {
        emailt = ema[i].attributes.email;
        userLang = ema[i].attributes.lang;
        break;
      }
    }
    
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
