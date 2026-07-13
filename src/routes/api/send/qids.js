const qids_base = {
  '1chatsend': `mutation  CreateMessage($fid : ID, $fidn: Int, $idL: ID , $da: DateTime, $mes: String)
    {createMessage(
       data: {
        forum: $fid,
        fid: $fidn,
        users_permissions_user: $idL,
        when: $da,
        publishedAt: $da,
        content: $mes
        }
        ){data{id attributes{
          forum{data{id}}
        }
            }
        }
        
    }`,
  '2forumCr': `mutation  CreateForum($pid : ID, $mbId: [ID] , $da: DateTime)
   { createForum(
       data: {
        project:$pid,
        mesimabetahaliches:$mbId,
        publishedAt:$da
       }
        ){data{id}}
      }`,
  '2forumCrHaluka': `mutation  CreateForumHaluka($pid : ID, $halukId: ID , $da: DateTime)
   { createForum(
       data: {
        project:$pid,
        haluka:$halukId,
        publishedAt:$da
       }
        ){data{id}}
      }`,
  '2forumCrBasic': `mutation CreateForumBasic($pid: ID, $da: DateTime) {
    createForum(data: { project: $pid, publishedAt: $da }) {
      data { id }
    }
  }`,
  '2linkForumToSheirut': `mutation LinkForumToSheirut($id: ID!, $forumId: ID!) {
    updateSheirut(id: $id, data: { forums: [$forumId] }) {
      data { id }
    }
  }`,
  '2linkForumToSheirutpend': `mutation LinkForumToSheirutpend($id: ID!, $forumId: ID!) {
    updateSheirutpend(id: $id, data: { forum: $forumId }) {
      data { id }
    }
  }`,
  // ── Pendm / Pmash chat forum (realtime discussion) ─────────────────────────
  'getPendmChatForum': `query GetPendmChatForum($id: ID!) {
    pendm(id: $id) {
      data {
        id
        attributes {
          name
          project { data { id } }
          forums(pagination: { limit: 1 }) { data { id } }
        }
      }
    }
  }`,
  'getPmashChatForum': `query GetPmashChatForum($id: ID!) {
    pmash(id: $id) {
      data {
        id
        attributes {
          name
          project { data { id } }
          forums(pagination: { limit: 1 }) { data { id } }
        }
      }
    }
  }`,
  'linkForumToPendm': `mutation LinkForumToPendm($id: ID!, $forumId: ID!) {
    updatePendm(id: $id, data: { forums: [$forumId] }) {
      data { id }
    }
  }`,
  'linkForumToPmash': `mutation LinkForumToPmash($id: ID!, $forumId: ID!) {
    updatePmash(id: $id, data: { forums: [$forumId] }) {
      data { id }
    }
  }`,
  'getDecisionChatForum': `query GetDecisionChatForum($id: ID!) {
    decision(id: $id) {
      data {
        id
        attributes {
          decisionName
          projects(pagination: { limit: 1 }) { data { id } }
          forums(pagination: { limit: 1 }) { data { id } }
        }
      }
    }
  }`,
  'linkForumToDecision': `mutation LinkForumToDecision($id: ID!, $forumId: ID!) {
    updateDecision(id: $id, data: { forums: [$forumId] }) {
      data { id }
    }
  }`,
  '2cGetMoneyReceivers': `query GetMoneyReceivers($id: ID!) {
    sheirut(id: $id) {
      data {
        attributes {
          iCanGetMonay {
            data { id }
          }
        }
      }
    }
  }`,
  '2aSetMoneyReceivers': `mutation SetMoneyReceivers($id: ID!, $userIds: [ID]) {
    updateSheirut(id: $id, data: { iCanGetMonay: $userIds }) {
      data { id }
    }
  }`,
  '3projectJSONQue': `query GetProjectJSON($pid: ID!) {
  project(id: $pid) {
    data {
      attributes {
        profilePic{data{attributes{url formats}}}
        user_1s{
          data{
            id
            attributes{
              telegramId
              lang 
              email
              username
              noMail
              machshirs{data{id attributes{jsoni}}}
            }
          }
        }
       }
    }
  }
}
`,
  '4crtask': `mutation CreateAct($pendm:ID ,$open_mission:ID,$dateS:DateTime, $dateF:DateTime,$myIshur:Boolean ,$shem: String,$des:String,$link:String, $pid : ID, $askId: ID, $assignedId:[ID], $mbId: [ID] , $publishedAt: DateTime)
                        { createAct(
      data: {project:$pid,
             des: $des,
             my: $assignedId,
             shem: $shem,
             vali: $askId,
             mesimabetahaliches: $mbId,
             link: $link,
             publishedAt:$publishedAt,
             myIshur:$myIshur,
             dateF:$dateF,
             dateS:$dateS,
             pendm:$pendm,
             open_mission:$open_mission
                  }
    
  ) {data{id attributes{ shem my {data{id}}}}}
}
`,
  '5crratson': `mutation CreateRatson($logo:ID ,
                                      $startDate:DateTime,
                                       $finnishDate:DateTime,
                                       $fulfilled:Boolean,
                                       $name: String,
                                       $des:String,
                                       $allowJoin : Boolean,
                                       $vallues: [ID],
                                       $longDes:String,
                                       $bounti: Boolean,
                                       $totalbounti: Float,
                                       $users_permissions_users: [ID],
                                       $missions:[ID],
                                       $mashaabims:[ID],
                                       $link: String,
                                       $publishedAt: DateTime,
                                       $status_ratson: ENUM_RATSON_STATUS_RATSON,
                                       $access_mode: ENUM_RATSON_ACCESS_MODE,
                                       $categories: [ID],
                                       $sub_category: String,
                                       $language: String,
                                       $lat: Float,
                                       $lng: Float,
                                       $radius: Long,
                                       $location_hint: String,
                                       $frequency: String,
                                       $isOnline: Boolean,
                                       $age_group: String,
                                       $ai_meta: JSON,
                                       $chat_forum: ID,
                                       $process: ID,
                                       $joinKind: ENUM_RATSON_JOINKIND,
                                       $minJoiners: Int,
                                       $maxJoiners: Int,
                                       $joinDeadline: DateTime,
                                       $share_status: ENUM_RATSON_SHARE_STATUS,
                                       $extracted_missions: [ComponentNewExtractedMissionsInput],
                                       $extracted_resources: [ComponentNewExtractedResourcesInput])
                        { createRatson(
      data: {startDate:$startDate,
             desc: $des,
             longDes: $longDes,
             name: $name,
             link:$link,
             fulfilled: $fulfilled,
             logo: $logo,
             publishedAt:$publishedAt,
             allowJoin:$allowJoin,
             finnishDate:$finnishDate,
             vallues:$vallues,
             bounti:$bounti,
             totalbounti:$totalbounti,
             users_permissions_users:$users_permissions_users,
             missions: $missions,
             mashaabims:$mashaabims,
             status_ratson: $status_ratson,
             access_mode: $access_mode,
             categories: $categories,
             sub_category: $sub_category,
             language: $language,
             lat: $lat,
             lng: $lng,
             radius: $radius,
             location_hint: $location_hint,
             frequency: $frequency,
             isOnline: $isOnline,
             age_group: $age_group,
             ai_meta: $ai_meta,
             chat_forum: $chat_forum,
             process: $process,
             joinKind: $joinKind,
             minJoiners: $minJoiners,
             maxJoiners: $maxJoiners,
             joinDeadline: $joinDeadline,
             share_status: $share_status,
             extracted_missions: $extracted_missions,
             extracted_resources: $extracted_resources
                  }

  ) {data{id}}
}`,
  '6addTelegram': `mutation UpdateUsersPermissionsUser($telegramId:String ,
                                      $uid:ID!,
                                  )
                        { updateUsersPermissionsUser(
                          id:$uid
      data: {
        telegramId:$telegramId
                  }
    
  ) {data{id}}
}`,
  '7getTelegramIds': `query GetTelegramIds {
        usersPermissionsUsers{
          data{
            id
            attributes{
              username
              telegramId
              lang 
            }
          }
        }
       }
`,
  '8getMissionsOnProgress': `query GetMissionsOnProgress($id: ID!) {
        usersPermissionsUser(id: $id) {
          data{
            id
            attributes{
              username
              telegramId
              lang 
              mesimabetahaliches(filters:{finnished:{ne: true },forappruval: { ne: true }}) {data{id
               attributes{name stname timer howmanyhoursalready hoursassinged
              users_permissions_user{data{id}}
              acts{data{id attributes{shem myIshur link hashivut valiIshur des dateF dateS status naasa}}}
               activeTimer{data{id
                attributes{start totalHours timers{start stop} acts{data{id}} isActive saved}}} 
                project{data{id attributes{projectName profilePic{data{attributes{formats url}}}}}} }}}
            }
          }
        }
       }
`,
  '9startTimer': `mutation StartTimer($x: Float, $stname: String, $mId: ID!)
                        { 
 updateMesimabetahalich(
  id: $mId
  data: {
 stname: $stname,
 timer: $x
  }
 ) {data{id attributes{ stname timer}}}
 }`,
  '10stopTimer': `mutation StopTimer($mId: ID!, $stname: String, $x: Float){
 updateMesimabetahalich(
  id: $mId
  data: {
 stname: $stname,
 timer: $x
  }
 ) {data{id attributes{ stname timer}}}
 }`,
  '11saveTimer': `mutation SaveTimer( $mId: ID!, $stname: String, $x: Float,$howmanyhoursalready: Float){
 updateMesimabetahalich(
  id: $mId
  data: {
 howmanyhoursalready:$howmanyhoursalready,
 stname: $stname,
 timer: $x,
 activeTimer:null
  }
 ) {data{id attributes{ stname timer}}}
 }`,
  '12mission': `query GetMissions {
         missions {data{id attributes{
                        descrip   missionName 
                            } }}
       }
`,
  '13missionById': `query GetMissionsByid($ids:[ID]) {
         missions(filters: {id:{in: $ids}}) {data{id attributes{
                        descrip   missionName 
                            } }}
       }
`, '14changeOnline': `mutation ChangeOnline($id: ID!, $online: Boolean) {
   UpdatePgishauser(id: $id, data: {online: $online}) {data{id attributes{ online}}}
}`,
  "15createPgishauser": `mutation CreatePgishauser($id: ID!) {
  createPgishauser(data: {users_permissions_user: $id}) {data{id}}
}`, '16createPgisha': `mutation CreatePgisha($ids: [ID],$name: String, $desc: String,pendIds:[ID]) {
  createPgisha(data: {pgishausers: $ids,pgishauserpends:$pendIds, name: $name, desc: $desc}) {data{id}}
}` , '17getUsers': `query GetUsers {
  usersPermissionsUsers{
    data{
      id
      attributes{
        username
        lang 
      }
    }
  }
 }
`,

  // ── Meeting participant selection (privacy-preserving) ─────────────────────
  // Co-members: the users the current user shares at least one project with.
  // Used to populate the "add participants" dropdown so it never exposes the
  // whole user base — only people you already collaborate with.
  '170getMyCoMembers': `query GetMyCoMembers($uid: ID!) {
  usersPermissionsUser(id: $uid) {
    data {
      id
      attributes {
        username
        projects_1s {
          data {
            id
            attributes {
              projectName
              user_1s {
                data {
                  id
                  attributes { username }
                }
              }
            }
          }
        }
      }
    }
  }
}`,

  // Exact lookup used when inviting someone who is NOT a co-member: the inviter
  // must know the person's full username or email. Matches are exact (eq), so
  // this can't be used to enumerate/guess users. Returns minimal fields only.
  '171findUserByExact': `query FindUserByExact($q: String!) {
  usersPermissionsUsers(
    filters: { or: [ { username: { eq: $q } }, { email: { eq: $q } } ] }
    pagination: { limit: 1 }
  ) {
    data {
      id
      attributes { username }
    }
  }
}`,

  "18createNewMeeting": `mutation CreateNewMeeting( $outpot: String, $name: String,$publishedAt:DateTime) {
  createPgisha(data: 
    {name: $name, desc: $outpot,publishedAt:$publishedAt})
     {data{id}}
  }`,
  "19CreatePendMeeting": `mutation CreatePgishauserPend($id: ID!,$pgishaId:ID) {
  createPgishauserpend(data: {users_permissions_user: $id,pgisha: $pgishaId}) {data{id}}
  }`,
  "20CreateUserMeeting": `mutation CreateUserMeeting($id: ID!,$pgishaId:[ID],$uid:String,$publishedAt:DateTime) {
  createPgishauser(data: {users_permissions_user: $id,pgishas: $pgishaId,uid:$uid,
               publishedAt:$publishedAt
}) {data{id}}
  }`,
  '21createMission': `mutation CreateMission($descrip: String, $missionName: String, $publishedAt: DateTime, $skills: [ID], $tafkidims: [ID]) {
  createMission(data: {descrip: $descrip, missionName: $missionName, publishedAt: $publishedAt, skills: $skills, tafkidims: $tafkidims}) {data{id}}
  }`,
  '22setOnline': `mutation SetOnline($id:ID!,$online:Boolean) {
    updatePgishauser(id: $id, data: {available: $online}){
      data{id attributes{available}}}
  }`,
  "23myUserMeeting": `query GetMyUserMeeting($id: ID!) {
    pgishausers(filters: {users_permissions_user: {id: {eq: $id}}}) {
      data {
        id
        attributes {
          available
          readyForStart
          uid
          users_permissions_user {
            data {
              id
              attributes {
                username
              }
            }
          }
          pgishas {
            data {
              id
              attributes {
                name
                isLive
                available
                pendingStart
                pgishausers {
                  data {
                    id
                    attributes {
                      available
                      readyForStart
                      users_permissions_user {
                        data {
                          id
                          attributes {
                            username
                            profilePic { data { attributes { url } } }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }`,
  '24userJSONQue': `query GetUserJSON($uid: ID!) {	
  usersPermissionsUser(id: $uid) {
   data{
            id
            attributes{
              telegramId
              lang 
              email
              noMail
              username
              machshirs{data{id attributes{jsoni}}}
            }
          }
}
}`,
  '25UserArr1': `query GetUserArr1($uid: ID!) {	
  usersPermissionsUser(id: $uid) {
   data{
            id
            attributes{
              arr1
              arrdate
               }
          }
}
}`,
  '26addUserArr1': `mutation AddUserArr1($uid: ID!, $arr: JSON, $arrDate: DateTime) {
  updateUsersPermissionsUser(id: $uid, data: { arr1: $arr, arrdate: $arrDate}) 
  {data{id}}
}`,
  '27getFiniApp': `query GetFiniApp($id: ID!) {
   finiapruval(id:'$id'){
   data{
   id attributes{
   
   }}
   }
}`,
  "27GetOpenMissionsRegTr": `query GetOpenMissionsRegTr($start: Int, $limit: Int)
{  openMissions(pagination: { start: $start, limit: $limit }) {
    data{
      id 
      attributes{ 
        sqadualed
        archived
        users{data{id}}
        project {data{ id attributes{ projectName user_1s{data{id}} restime timeToP profilePic {data{ attributes{url  }}}}}}
        tafkidims {data{attributes{roleDescription localizations{data{attributes{ roleDescription }}}}}}
        skills {data{attributes{skillName localizations{data{attributes{skillName }}}}}}
        descrip
        hearotMeyuchadot
        name dates iskvua
        work_ways {data{attributes{workWayName localizations{data{attributes{workWayName }}}}}}
        noofhours perhour   
      }
    }
    meta {
      pagination {
        total
        pageSize
        page
        pageCount
      }
    }
  }
}`,
  "28GetOpenMissionsReg": `query GetOpenMissionsReg($start: Int, $limit: Int)
{  openMissions(pagination: { start: $start, limit: $limit }) {
    data{
      id 
      attributes{ 
        sqadualed
        archived
        users{data{id}}
        project {data{ id attributes{ projectName user_1s{data{id}} restime timeToP profilePic {data{ attributes{url  }}}}}}
        tafkidims {data{attributes{roleDescription}}}
        skills {data{attributes{skillName}}}
        descrip
        hearotMeyuchadot
        name dates iskvua
        work_ways {data{attributes{workWayName}}}
        noofhours perhour   
      }
    }
    meta {
      pagination {
        total
        pageSize
        page
        pageCount
      }
    }
  }
}`,
  "29GetOpenMissionsNonregTr": `query GetOpenMissionsNonregTr($start: Int, $limit: Int)
{  openMissions(pagination: { start: $start, limit: $limit }) {
    data{
      id
      attributes{ 
        descrip
        archived noofhours perhour iskvua sqadualed dates
        tafkidims {data{attributes{roleDescription localizations{data{attributes{ roleDescription }}}}}}
        skills {data{attributes{skillName localizations{data{attributes{skillName }}}}}}
        work_ways {data{attributes{workWayName localizations{data{attributes{workWayName }}}}}}
        name project {data{ id attributes{ projectName profilePic {data{ attributes{url  }}}}}}
      }
    }
    meta {
      pagination {
        total
        pageSize
        page
        pageCount
      }
    }
  }
}`,
  "30GetOpenMissionsNonreg": `query GetOpenMissionsNonreg($start: Int, $limit: Int)
{  openMissions(pagination: { start: $start, limit: $limit }) {
    data{
      id
      attributes{ 
        descrip
        archived noofhours perhour iskvua sqadualed dates
        tafkidims {data{attributes{roleDescription}}}
        skills {data{attributes{skillName}}}
        work_ways {data{attributes{workWayName}}}
        name project {data{ id attributes{ projectName profilePic {data{ attributes{url  }}}}}}
      }
    }
    meta {
      pagination {
        total
        pageSize
        page
        pageCount
      }
    }
  }
}`,
  "31updateTask": `mutation UpdateTask($id: ID!,$myIshur: Boolean,$valiIshur: Boolean, $isAssigned: Boolean, $uid: [ID], $mesimabetahaliches: [ID], $naasa: Boolean, $status: Int) {
     updateAct(id: $id,
      data: {
             isAssigned: $isAssigned,
             myIshur: $myIshur,
             valiIshur: $valiIshur,
              my:$uid,
              mesimabetahaliches: $mesimabetahaliches,
              naasa: $naasa,
              status: $status
                  }

  ) {data{id attributes{ shem my {data{id}}}}}
}`,
  "32createTimeGrama": `mutation CreateTimegrama($date: DateTime,$decision: ID,$tosplit: ID, $finiapruval: ID, $whatami: String, $ask: ID) {
  createTimegrama(data: {date: $date, whatami: $whatami, ask: $ask, finiapruval: $finiapruval,decision:$decision,tosplit:$tosplit}) {
    data {
      id
    }   
  }
}`,
  '33CreateTimer': `
        mutation CreateTimer($missionId: ID!, $start: DateTime!, $userId: ID!, $projectId: ID!) {
          createTimer(
            data: {
              activeMesimabetahalich: $missionId,
              mesimabetahalich: $missionId,
              users_permissions_user: $userId,
              project: $projectId,
              start: $start,
              isActive: true,
              totalHours: 0,
              timers: [{ start: $start }]
            }
          ) {
            data {
              id
              attributes {
              start totalHours timers{start stop} acts{data{id}} isActive saved
              }
            }
          }
        }
      `,
  '34UpdateTimer': `
      mutation UpdateTimer($saved: Boolean,$timerId: ID!,$tasks: [ID], $newStart: DateTime , $timers:[ComponentNewTimesInput], $totalHours:Float, $isActive: Boolean) {
        updateTimer(id: $timerId,
          data: {
            saved: $saved,
            start: $newStart,
            isActive: $isActive,
            timers: $timers,
            totalHours: $totalHours,
            acts: $tasks
          }
        ) {
          data {
            id
            attributes {
             start totalHours timers{start stop} acts{data{id}} isActive saved
            }
          }
        }
      }
    `,
  "35updateTimeGrama": `mutation UpdateTimegrama($date: DateTime,$done: Boolean, $id: ID!) {
  updateTimegrama(id: $id, data: {date: $date, done: $done}) {
    data {
      id
    }   
  }
}`,
  '36getMissionTimer': `query GetMissionTimer($missionId: ID!) {
  mesimabetahalich(id: $missionId) {
    data {
      id
      attributes {
        name
         users_permissions_user{data{id}}
         project{data{id}}
        activeTimer {
          data {
            id
            attributes {
              start
              totalHours
              timers {
                start
                stop
              }
              acts {
                data {
                  id
                }
              }
              isActive
              saved
            }
          }
        }
      }
    }
  }
}
`,
  '37getUserTimers': `query GetUserTimers($id: ID!) {
  usersPermissionsUser(id: $id) {
    data{
      id
      attributes{
       timers{
        data{
          id
          attributes{
          start totalHours timers{start stop} isActive saved 
          mesimabetahalich{data{id
         attributes{name  howmanyhoursalready hoursassinged
}}}
          project{data{id attributes{projectName profilePic{data{attributes{formats url}}}}}} 
          }
          }
       }
        lang 
        
      }
    }
  }
 }
`,
  '38getProjectTimers': `query GetProjectTimers($id: ID!) {
  project(id: $id) {
    data{
      id
      attributes{
       timers{
        data{
          id
          attributes{
          start totalHours timers{start stop} isActive saved acts{data{id attributes{
                  shem
                  } }}
          mesimabetahalich{data{id
         attributes{
           name  
           howmanyhoursalready 
           hoursassinged
           users_permissions_user{
             data{
               id
             }
           }
         }
       }}
          }
          }
       }        
      }
    }
  }
 }
`,
  // ── Consensus / Negotiation qids ──────────────────────────────────────────
  // Note: voters is a JSON field (array of voter-ids), not a relation.
  // New fields added in Strapi migration: visibility, shareToken, isLocal,
  // scaleMin, scaleMax, places (→Cuntry), isAnchor, pole, kind,
  // relativePlacement, authorExternalId, authorType on Position,
  // and the Argument content-type.

  '39GetNegotiation': `
    query GetNegotiation($id: ID!) {
      negotiation(id: $id) {
        data {
          id
          attributes {
            topic
            description
            status
            maxRounds
            currentRound
            visibility
            shareToken
            isLocal
            scaleMin
            scaleMax
            sourceType
            sourceId
            sourceMeta
            cuntries {
              data {
                id
                attributes { name }
              }
            }
            creator {
              data {
                attributes {
                  username
                  email
                }
              }
            }
            positions {
              data {
                id
                attributes {
                  heading
                  description
                  aiMeta
                  author {
                    data {
                      attributes {
                        username
                        email
                      }
                    }
                  }
                  authorEmail
                  authorExternalId
                  authorType
                  votes
                  voters
                  location
                  intensity
                  tags
                  order
                  isAnchor
                  pole
                  kind
                  relativePlacement
                  selfPlacement
                }
              }
            }
            participants {
              data {
                id
                attributes {
                  username
                  email
                }
              }
            }
          }
        }
      }
    }
  `,

  // arg: { topic, description, maxRounds, status, currentRound, createdBy,
  //        createdByEmail, ownerExternalId, visibility, shareToken, isLocal,
  //        placeIds, sourceType, sourceId, sourceMeta, publishedAt }
  // sourceType/sourceId/sourceMeta tie a bridge discussion to a main-app object
  // (pmash / mission negotiation card) — see consensus1lev1 main-repo-bridge-spec.
  // Registered users only (no service token).
  '40CreateNegotiation': `
    mutation CreateNegotiation(
      $topic: String!,
      $description: String,
      $status: ENUM_NEGOTIATION_STATUS,
      $maxRounds: Int,
      $currentRound: Int,
      $createdBy: ID,
      $createdByEmail: String,
      $ownerExternalId: String,
      $visibility: ENUM_NEGOTIATION_VISIBILITY,
      $shareToken: String,
      $isLocal: Boolean,
      $placeIds: [ID],
      $sourceType: String,
      $sourceId: String,
      $sourceMeta: JSON,
      $publishedAt: DateTime
    ) {
      createNegotiation(data: {
        topic: $topic,
        description: $description,
        status: $status,
        maxRounds: $maxRounds,
        currentRound: $currentRound,
        creator: $createdBy,
        createdByEmail: $createdByEmail,
        ownerExternalId: $ownerExternalId,
        visibility: $visibility,
        shareToken: $shareToken,
        isLocal: $isLocal,
        cuntries: $placeIds,
        sourceType: $sourceType,
        sourceId: $sourceId,
        sourceMeta: $sourceMeta,
        publishedAt: $publishedAt
      }) {
        data {
          id
          attributes {
            topic
            shareToken
          }
        }
      }
    }
  `,

  // arg: { negotiationId, heading, description, author (ID), authorEmail,
  //        location, order, intensity, votes, voters (JSON), aiMeta, tags,
  //        kind, pole, isAnchor, relativePlacement, publishedAt,
  //        __identity (service path only — injected by server) }
  // Server injects authorEmail/authorExternalId/authorType from __identity for service calls.
  '41CreatePosition': `
    mutation CreatePosition(
      $negotiationId: ID!,
      $heading: String!,
      $description: String,
      $author: ID,
      $authorEmail: String,
      $authorExternalId: String,
      $authorType: ENUM_POSITION_AUTHORTYPE,
      $location: Float,
      $order: Int,
      $intensity: Int,
      $votes: Int,
      $voters: JSON,
      $aiMeta: JSON,
      $tags: JSON,
      $kind: ENUM_POSITION_KIND,
      $pole: ENUM_POSITION_POLE,
      $isAnchor: Boolean,
      $relativePlacement: JSON,
      $publishedAt: DateTime
    ) {
      createPosition(data: {
        negotiation: $negotiationId,
        heading: $heading,
        description: $description,
        author: $author,
        authorEmail: $authorEmail,
        authorExternalId: $authorExternalId,
        authorType: $authorType,
        location: $location,
        order: $order,
        intensity: $intensity,
        votes: $votes,
        voters: $voters,
        aiMeta: $aiMeta,
        tags: $tags,
        kind: $kind,
        pole: $pole,
        isAnchor: $isAnchor,
        relativePlacement: $relativePlacement,
        publishedAt: $publishedAt
      }) {
        data {
          id
          attributes {
            heading
            description
            votes
            voters
            location
            order
            kind
            pole
            isAnchor
            authorType
            authorExternalId
          }
        }
      }
    }
  `,

  // Editing only (heading / description / location / selfPlacement by registered owner via JWT).
  // Voting (support: true) is intercepted by +server.js and handled server-side
  // with idempotent read-then-write logic — the qid string is never sent to Strapi.
  // selfPlacement: author's manual self-placement on 0..100 axis (AI hint, not displayed location).
  // location: derived value computed by consensus from clauses, written back via this qid.
  '42UpdatePosition': `
    mutation UpdatePosition($id: ID!, $heading: String, $description: String, $location: Float, $selfPlacement: Int) {
      updatePosition(id: $id, data: {
        heading: $heading,
        description: $description,
        location: $location,
        selfPlacement: $selfPlacement
      }) {
        data {
          id
          attributes {
            heading
            description
            location
            selfPlacement
            votes
            voters
          }
        }
      }
    }
  `,

  // ── New consensus qids ────────────────────────────────────────────────────

  // arg: { token }  — accessible to guests via share-link
  'GetNegotiationByToken': `
    query GetNegotiationByToken($token: String!) {
      negotiations(filters: { shareToken: { eq: $token } }) {
        data {
          id
          attributes {
            topic
            description
            status
            maxRounds
            currentRound
            visibility
            shareToken
            isLocal
            scaleMin
            scaleMax
            sourceType
            sourceId
            sourceMeta
            cuntries { data { id attributes { name } } }
            creator { data { attributes { username email } } }
            positions {
              data {
                id
                attributes {
                  heading
                  description
                  aiMeta
                  authorEmail
                  authorExternalId
                  authorType
                  votes
                  voters
                  location
                  intensity
                  order
                  isAnchor
                  pole
                  kind
                  relativePlacement
                }
              }
            }
            participants { data { id attributes { username email } } }
          }
        }
      }
    }
  `,

  // arg: { sourceType, sourceId }  — find the bridge discussion for a main-app
  // object (a pmash / mission negotiation card). Registered users only: this qid
  // is intentionally NOT added to CONSENSUS_QIDS, so it runs on the caller's own
  // JWT and Strapi enforces access (no guest/charter service path). Returns the
  // most recent match (limit 1). See consensus1lev1 main-repo-bridge-spec §2.3.
  'GetNegotiationBySource': `
    query GetNegotiationBySource($sourceType: String!, $sourceId: String!) {
      negotiations(
        filters: { sourceType: { eq: $sourceType }, sourceId: { eq: $sourceId } }
        sort: ["createdAt:desc"]
        pagination: { limit: 1 }
      ) {
        data {
          id
          attributes {
            topic
            description
            status
            maxRounds
            currentRound
            visibility
            shareToken
            isLocal
            scaleMin
            scaleMax
            sourceType
            sourceId
            sourceMeta
            cuntries { data { id attributes { name } } }
            creator { data { attributes { username email } } }
            positions {
              data {
                id
                attributes {
                  heading
                  description
                  aiMeta
                  authorEmail
                  authorExternalId
                  authorType
                  votes
                  voters
                  location
                  intensity
                  order
                  isAnchor
                  pole
                  kind
                  relativePlacement
                }
              }
            }
            participants { data { id attributes { username email } } }
          }
        }
      }
    }
  `,

  // arg: { id, resolution, status } — "sign" the bridge decision: persist the
  // agreed outcome on the Negotiation itself so every member sees it from the
  // source card (haluka / negoPend / …), not only whoever clicked the return
  // link. Registered users only: intentionally NOT in CONSENSUS_QIDS, so it
  // runs on the caller's own JWT and Strapi enforces access (requires the
  // authenticated role to have `update` on Negotiation). Requires the new
  // `resolution` (JSON) field on Negotiation — see consensus1lev1
  // main-repo-return-spec.md.
  '43SetNegotiationResolution': `
    mutation SetNegotiationResolution($id: ID!, $resolution: JSON, $status: ENUM_NEGOTIATION_STATUS) {
      updateNegotiation(id: $id, data: { resolution: $resolution, status: $status }) {
        data {
          id
          attributes {
            resolution
            status
          }
        }
      }
    }
  `,

  // arg: { sourceType, sourceId } — read back the signed decision for a bridged
  // main-app object. Same lookup key and access rules as GetNegotiationBySource
  // (registered only, most recent match). Kept separate from the existing read
  // qids so they keep working until the `resolution` field exists in Strapi.
  'GetNegotiationResolutionBySource': `
    query GetNegotiationResolutionBySource($sourceType: String!, $sourceId: String!) {
      negotiations(
        filters: { sourceType: { eq: $sourceType }, sourceId: { eq: $sourceId } }
        sort: ["createdAt:desc"]
        pagination: { limit: 1 }
      ) {
        data {
          id
          attributes {
            topic
            status
            shareToken
            resolution
          }
        }
      }
    }
  `,

  // arg: { placeId }
  'ListLocalNegotiations': `
    query ListLocalNegotiations($placeId: ID!) {
      negotiations(filters: {
        cuntries: { id: { eq: $placeId } },
        visibility: { in: ["local", "unlisted"] }
      }) {
        data {
          id
          attributes {
            topic
            description
            currentRound
            maxRounds
            visibility
            shareToken
            positions { data { id } }
          }
        }
      }
    }
  `,

  // arg: { positionId }
  'ListArguments': `
    query ListArguments($positionId: ID!) {
      arguments(
        filters: { position: { id: { eq: $positionId } } },
        sort: ["votes:desc"]
      ) {
        data {
          id
          attributes {
            body
            stance
            votes
            voters
            authorName
            authorType
            createdAt
          }
        }
      }
    }
  `,

  // arg: { negotiationId, positionId, stance, body, publishedAt,
  //        __identity (server injects authorName/Email/ExternalId/Type) }
  'CreateArgument': `
    mutation CreateArgument(
      $negotiationId: ID!,
      $positionId: ID!,
      $stance: ENUM_ARGUMENT_STANCE!,
      $body: String!,
      $authorName: String,
      $authorEmail: String,
      $authorExternalId: String,
      $authorType: ENUM_ARGUMENT_AUTHORTYPE,
      $publishedAt: DateTime
    ) {
      createArgument(data: {
        negotiation: $negotiationId,
        position: $positionId,
        stance: $stance,
        body: $body,
        authorName: $authorName,
        authorEmail: $authorEmail,
        authorExternalId: $authorExternalId,
        authorType: $authorType,
        votes: 0,
        voters: [],
        publishedAt: $publishedAt
      }) {
        data {
          id
          attributes {
            body
            stance
            votes
            voters
            authorName
            authorType
          }
        }
      }
    }
  `,

  // Voting (support: true) intercepted by server for idempotent handling.
  // Editing (body update) uses this qid directly — not in consensus spec yet.
  'UpdateArgument': `
    mutation UpdateArgument($id: ID!, $body: String) {
      updateArgument(id: $id, data: { body: $body }) {
        data {
          id
          attributes { votes voters body }
        }
      }
    }
  `,

  // ── Issue / Clause qids (spec 2.0) ────────────────────────────────────────

  // arg: { negotiationId }
  'ListIssues': `
    query ListIssues($negotiationId: ID!) {
      issues(
        filters: { negotiation: { id: { eq: $negotiationId } } }
        sort: ["order:asc"]
      ) {
        data {
          id
          attributes {
            title
            order
            origin
          }
        }
      }
    }
  `,

  // arg: { negotiationId }
  // Returns all clauses for a negotiation. Filter by positionId client-side if needed.
  'ListClauses': `
    query ListClauses($negotiationId: ID!) {
      clauses(
        filters: { negotiation: { id: { eq: $negotiationId } } }
      ) {
        data {
          id
          attributes {
            body
            stanceValue
            origin
            confirmedByAuthor
            position { data { id } }
            issue { data { id attributes { title } } }
          }
        }
      }
    }
  `,

  // arg: { negotiationId, title, order, origin, publishedAt }
  // origin: "ai" (AI-identified) | "human" (user-added manually)
  'CreateIssue': `
    mutation CreateIssue(
      $negotiationId: ID!,
      $title: String!,
      $order: Int,
      $origin: ENUM_ISSUE_ORIGIN,
      $publishedAt: DateTime
    ) {
      createIssue(data: {
        negotiation: $negotiationId,
        title: $title,
        order: $order,
        origin: $origin,
        publishedAt: $publishedAt
      }) {
        data { id }
      }
    }
  `,

  // arg: { negotiationId, positionId, issueId?, body, stanceValue, origin,
  //        publishedAt, __identity (server injects authorExternalId/authorType) }
  'CreateClause': `
    mutation CreateClause(
      $negotiationId: ID!,
      $positionId: ID!,
      $issueId: ID,
      $body: String!,
      $stanceValue: Int,
      $origin: ENUM_CLAUSE_ORIGIN,
      $authorExternalId: String,
      $authorType: ENUM_CLAUSE_AUTHORTYPE,
      $publishedAt: DateTime
    ) {
      createClause(data: {
        negotiation: $negotiationId,
        position: $positionId,
        issue: $issueId,
        body: $body,
        stanceValue: $stanceValue,
        origin: $origin,
        authorExternalId: $authorExternalId,
        authorType: $authorType,
        confirmedByAuthor: false,
        publishedAt: $publishedAt
      }) {
        data { id }
      }
    }
  `,

  // arg: { id, body?, stanceValue?, issueId?, confirmedByAuthor?, __identity }
  // body/issueId: JWT-only (registered owner). stanceValue/confirmedByAuthor: author via service path.
  // Server enforces ownership for service-path calls (pre-fetch check).
  'UpdateClause': `
    mutation UpdateClause(
      $id: ID!,
      $body: String,
      $stanceValue: Int,
      $issueId: ID,
      $confirmedByAuthor: Boolean
    ) {
      updateClause(id: $id, data: {
        body: $body,
        stanceValue: $stanceValue,
        issue: $issueId,
        confirmedByAuthor: $confirmedByAuthor
      }) {
        data {
          id
          attributes {
            body
            stanceValue
            confirmedByAuthor
            issue { data { id } }
          }
        }
      }
    }
  `,

  // arg: {}  — returns all Cuntry records as "places"
  'ListPlaces': `
    query ListPlaces {
      cuntries {
        data {
          id
          attributes { name }
        }
      }
    }
  `,
  "43updateProfilePic": `
mutation UpdateProjectProfilePic($projectId: ID!, $imageId: ID!) {
  updateProject(
    id: $projectId,
    data: { profilePic: $imageId }
  ) {
    data {
      id
      attributes {
        profilePic {
          data {
            attributes {
              url
              formats
            }
          }
        }
      }
    }
  }
}
`,
  "44updateWelcomeCard": `mutation UpdateWelcomeCard($id: ID!, $clicked: Boolean!) {
  updateWelcomTop(
    id: $id,
    data: { clicked: $clicked }
  ) {
    data {
      id
      attributes {
        clicked
      }
    }
  }
}`,
  '45deleteMachshir': `mutation deleteMachshir($id: ID!) {
    deleteMachshir(id: $id) {
      data {
        id
      }
    }
  }`,
  '46getMachshirByEndpoint': `query getMachshirByEndpoint($endpoint: JSON!) {
    machshirs(filters: { jsoni: { contains: $endpoint }}) {
      data {
        id
      }
    }
  }`
  ,
  '47GetGiftById': `query GetGiftById($id: ID!) {
    matanot(id: $id) {
      data {
        attributes {
          name
          desc
          price
          quant
          kindOf
          archived
          publishedAt
          startDate
          finnishDate
          pic { data { attributes { url } } }
          projectcreates { data { id attributes { projectName profilePic { data { attributes { url } } } } } }
        }
      }
    }
  }`,
  '48GetServiceById': `query GetServiceById($id: ID!) {
    matanot(id: $id) {
      data {
        attributes {
          name
          pic { data { attributes { url } } }
          price
          quant
          kindOf
          desc
          publishedAt
          archived
          startDate
          finnishDate
          pricingMode
          marginPct
          estimatedPrice
          status_of_voting
          appruved
          process {
            data {
              id
              attributes {
                forums { data { id attributes { subject spec } } }
              }
            }
          }
          matanot_recipe_missions {
            data {
              id
              attributes {
                hoursPerUnit unitsPerProduct ratePerHour mode notes
                pendm { data { id attributes { name descrip } } }
                mesimabetahalich {
                  data {
                    id
                    attributes { name howmanyhoursalready hoursassinged }
                  }
                }
              }
            }
          }
          matanot_recipe_resources {
            data {
              id
              attributes {
                quantityPerUnit pricePerUnit kindOf mode notes
                pmash { data { id attributes { name } } }
                mashabetahalich {
                  data {
                    id
                    attributes { name 
                        pricePerUnit
                        kindOf
                        descrip
                    }
                  }
                }
              }
            }
          }
          projectcreates {
            data {
              id
              attributes {
                projectName
                user_1s { data { id attributes { username } } }
                restime
                timeToP
                profilePic { data { attributes { url } } }
                open_missions {
                  data {
                    id
                    attributes {
                      sqadualed
                      archived
                      tafkidims { data { attributes { roleDescription localizations { data { attributes { roleDescription } } } } } }
                      skills { data { attributes { skillName localizations { data { attributes { skillName } } } } } }
                      descrip
                      hearotMeyuchadot
                      name
                      dates
                      iskvua
                      work_ways { data { attributes { workWayName localizations { data { attributes { workWayName } } } } } }
                      noofhours
                      perhour
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }`,
  '49GetProjectById': `query GetProjectById($id: ID!) {
    project(id: $id) {
      data {
        attributes {
          projectName
          user_1s { data { id attributes { username profilePic { data { attributes { url } } } } } }
          linkToWebsite
          restime
          matanotofs{data{id attributes{name price }}}
          githublink
          fblink
          discordlink
          twiterlink
          vallues { data { attributes { valueName localizations { data { attributes { valueName } } } } } }
          publicDescription
          profilePic { data { attributes { url formats } } }
          open_missions(filters: { archived: { eq: false } }) { data { id attributes { name } } }
        }
      }
    }
  }`,
  '50GetOpenMashaabimById': `query GetOpenMashaabimById($id: ID!) {
    openMashaabim(id: $id) {
      data {
        id
        attributes {
          archived
          price
          descrip
          spnot
          kindOf
          recurring
          cycleSize
          sqadualedf
          sqadualed
          linkto
          createdAt
          hm
          name
          easy
          declinedsps { data { id } }
          users { data { id } }
          mashaabim { data { id } }
          project {
            data {
              id
              attributes {
                restime
                projectName
                user_1s { data { id } }
                restime
                timeToP
                profilePic { data { attributes { url } } }
              }
            }
          }
        }
      }
    }
  }`,
  '51GetOpenMissionById': `query GetOpenMissionById($id: ID!) {
    openMission(id: $id) {
      data {
        attributes {
          sqadualed
          archived
          source
          ratson { data { id } }
          acts { data { id attributes { shem des dateF dateS link } } }
          users { data { id } }
          mission { data { id } }
          project { data { id attributes { projectName user_1s { data { id } } restime timeToP profilePic { data { attributes { url } } } } } }
          tafkidims { data { id attributes { roleDescription localizations { data { attributes { roleDescription } } } } } }
          skills { data { attributes { skillName localizations { data { attributes { skillName } } } } } }
          descrip
          hearotMeyuchadot
          name
          dates
          iskvua
          privatlinks
          publicklinks
          work_ways { data { attributes { workWayName localizations { data { attributes { workWayName } } } } } }
          noofhours
          perhour
        }
      }
    }
  }`,
  // Best-effort read of the stable extracted-need key persisted on a concierge
  // open mission at publish time. Kept separate from 51GetOpenMissionById so that
  // — until the `extractedKey` field is live in Strapi — selecting it can fail in
  // isolation (caught by the caller) without breaking the main open-mission load.
  'getOpenMissionExtractedKey': `query GetOpenMissionExtractedKey($id: ID!) {
    openMission(id: $id) {
      data { id attributes { extractedKey } }
    }
  }`,
  '52GetUserById': `query GetUserById($id: ID!) {
    usersPermissionsUser(id: $id) {
      data {
        id
        attributes {
          fblink
          twiterlink
          discordlink
          githublink
          bio
          username
          finnished_missions { data { attributes { missionName } } }
          profilePic { data { attributes { url formats } } }
          projects_1s { data { id attributes { projectName } } }
          sps(filters: { archived: { eq: false } }) { data { id attributes { name panui } } }
          skills { data { id attributes { skillName localizations { data { attributes { skillName } } } } } }
          tafkidims { data { id attributes { roleDescription localizations { data { attributes { roleDescription } } } } } }
          vallues { data { id attributes { valueName localizations { data { attributes { valueName } } } } } }
          work_ways { data { id attributes { workWayName localizations { data { attributes { workWayName } } } } } }
        }
      }
    }
  }`
  ,
  '61ApproveAct': `mutation ApproveAct($id: ID!, $myIshur: Boolean) {
    updateAct(
      id: $id,
      data: { myIshur: $myIshur }
    ) { data { id } }
  }`,
  '62MarkActDone': `mutation MarkActDone($id: ID!, $naasa: Boolean) {
    updateAct(
      id: $id,
      data: { naasa: $naasa }
    ) { data { id } }
  }`,
  '63SetActStatus': `mutation SetActStatus($id: ID!, $status: Int) {
    updateAct(
      id: $id,
      data: { status: $status }
    ) { data { id } }
  }`,
  "64getUserProjectList": `query GetUserProjectList($uid: ID!) {
    usersPermissionsUser(id: $uid) {
      data {
        id
        attributes {
          projects_1s {
            data {
              id
              attributes {
                projectName
                profilePic {
                  data {
                    attributes {
                      url
                      formats
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }`,

  "65checkProjectMembership": `query CheckProjectMembership($uid: ID!, $projectId: ID!) {
    usersPermissionsUser(id: $uid) {
      data {
        attributes {
          projects_1s(filters: { id: { eq: $projectId } }) {
            data {
              id
              attributes {
                projectName
                profilePic {
                  data {
                    attributes {
                      url
                    }
                  }
                }
                createdAt
              }
            }
          }
        }
      }
    }
  }`,

  "65checkSheirutpendRequester": `query CheckSheirutpendRequester($uid: ID!, $sheirutpendId: ID!) {
    sheirutpend(id: $sheirutpendId) {
      data {
        id
        attributes {
          users_permissions_user {
            data { id }
          }
        }
      }
    }
  }`,

  "65checkSheirutCustomer": `query CheckSheirutCustomer($uid: ID!, $sheirutId: ID!) {
    sheirutpends(filters: {
      sheirut: { id: { eq: $sheirutId } },
      users_permissions_user: { id: { eq: $uid } }
    }) {
      data {
        id
      }
    }
  }`,

  "66getProjectsCount": `query GetProjectsCount {
    projects {
      meta {
        pagination {
          total
        }
      }
    }
  }`,

  "205getPlatformProject": `query GetPlatformProject {
    projects(filters: { isPlatform: { eq: true } }, pagination: { limit: 1 }) {
      data {
        id
        attributes {
          projectName
          profilePic { data { attributes { url } } }
          user_1s { data { id } }
        }
      }
    }
  }`,

  "206createPlatformSale": `mutation CreatePlatformSale($project: ID!, $userId: ID!, $amount: Float!, $publishedAt: DateTime!, $note: String, $product: ID) {
    createSale(data: {
      project: $project
      users_permissions_user: $userId
      matanot: $product
      in: $amount
      date: $publishedAt
      publishedAt: $publishedAt
      note: $note
    }) {
      data {
        id
        attributes { in note }
      }
    }
  }`,

  // ── Site share — per-member contribution (PLAN_SITE_SHARE_PER_MEMBER §1) ──────
  // The decision record (one per member+tosplit). des_status: pending|decided|skipped.
  // Passthrough SiteShareContributionInput! so all fields flow regardless of the
  // local generated schema. The personal transfer Haluka is created later (M4,
  // receiving side) and linked back via `haluka`.
  "207createSiteShareContribution": `mutation CreateSiteShareContribution($data: SiteShareContributionInput!) {
    createSiteShareContribution(data: $data) {
      data {
        id
        attributes { des_status amount direction }
      }
    }
  }`,

  "208updateSiteShareContribution": `mutation UpdateSiteShareContribution($id: ID!, $data: SiteShareContributionInput!) {
    updateSiteShareContribution(id: $id, data: $data) {
      data {
        id
        attributes { des_status amount direction }
      }
    }
  }`,

  // Upsert guard + aggregate source: the existing decision for this member+tosplit.
  "209getSiteShareContributionByUserTosplit": `query GetSiteShareContributionByUserTosplit($user: ID!, $tosplit: ID!) {
    siteShareContributions(
      filters: { and: [
        { users_permissions_user: { id: { eq: $user } } },
        { tosplit: { id: { eq: $tosplit } } }
      ] },
      pagination: { limit: 1 }
    ) {
      data {
        id
        attributes { des_status amount direction proposedAmount basisAmount reason }
      }
    }
  }`,

  // Aggregate (§6): every member's decision for one tosplit — feeds the split
  // card's "members gave ₪X · Y/N decided" line.
  "210getSiteShareContributionsByTosplit": `query GetSiteShareContributionsByTosplit($tosplit: ID!) {
    siteShareContributions(
      filters: { tosplit: { id: { eq: $tosplit } } },
      pagination: { limit: 200 }
    ) {
      data {
        id
        attributes {
          des_status
          amount
          users_permissions_user { data { id } }
        }
      }
    }
  }`,

  // Reminder (gate 3, §3): every OPEN (pending) decision for one member, with
  // enough context to render the decision card inline (rikma name + basis).
  "211getOpenSiteShareDecisions": `query GetOpenSiteShareDecisions($user: ID!) {
    siteShareContributions(
      filters: { and: [
        { users_permissions_user: { id: { eq: $user } } },
        { des_status: { eq: "pending" } }
      ] },
      pagination: { limit: 100 }
    ) {
      data {
        id
        attributes {
          des_status
          proposedAmount
          basisAmount
          recive_project { data { id } }
          tosplit { data { id } }
          project {
            data {
              id
              attributes {
                projectName
                profilePic { data { attributes { url } } }
              }
            }
          }
        }
      }
    }
  }`,

  // M4 receiving side: the platform-income Sheirut for one source split (one per
  // source_tosplit — the aggregation key). Returns its running total + volunteers.
  "212getSiteShareIncomeSheirutByTosplit": `query GetSiteShareIncomeSheirutByTosplit($tosplit: ID!) {
    sheiruts(
      filters: { and: [
        { source_tosplit: { id: { eq: $tosplit } } },
        { isSiteShareIncome: { eq: true } }
      ] },
      pagination: { limit: 1 }
    ) {
      data {
        id
        attributes {
          total
          price
          iCanGetMonay { data { id attributes { username } } }
        }
      }
    }
  }`,

  // M4: generic Sheirut update (passthrough) — used to bump the income Sheirut's
  // running total/price and link members as it accumulates.
  "213updateSheirut": `mutation UpdateSheirut($id: ID!, $data: SheirutInput!) {
    updateSheirut(id: $id, data: $data) {
      data { id }
    }
  }`,

  // M4: one site-share contribution by id — identity + state for the transfer flow
  // (createSiteShareTransfer enforces decided & amount>0, idempotent on `haluka`).
  "214getSiteShareContributionById": `query GetSiteShareContributionById($id: ID!) {
    siteShareContribution(id: $id) {
      data {
        id
        attributes {
          des_status
          amount
          users_permissions_user { data { id } }
          tosplit { data { id } }
          project { data { id } }
          recive_project { data { id } }
          matbea { data { id } }
          sheirut { data { id } }
          haluka { data { id } }
        }
      }
    }
  }`,

  // M4: this member's payable site-share contributions — decided & amount>0, with
  // the income Sheirut + its volunteers, so the reminder can offer "pay now". The
  // action drops any that already have a transfer Haluka (0/skip never lands here).
  "215getSiteSharePayables": `query GetSiteSharePayables($user: ID!) {
    siteShareContributions(
      filters: { and: [
        { users_permissions_user: { id: { eq: $user } } },
        { des_status: { eq: "decided" } }
      ] },
      pagination: { limit: 100 }
    ) {
      data {
        id
        attributes {
          amount
          project { data { id } }
          recive_project { data { id } }
          haluka { data { id attributes {
            senderconf
            confirmed
            amount
            forum { data { id } }
            userrecive { data { id attributes { username profilePic { data { attributes { url } } } } } }
          } } }
          tosplit {
            data { id attributes {
              project { data { id attributes { projectName profilePic { data { attributes { url } } } } } }
            } }
          }
          sheirut {
            data { id attributes {
              total
              iCanGetMonay { data { id attributes { username profilePic { data { attributes { url } } } } } }
            } }
          }
        }
      }
    }
  }`,

  // M5 archive (giving side): every DECIDED contribution this rikma's members made
  // (project = the giving rikma) — committed `amount` + the transfer Haluka's settle
  // state — so the split-screen archive can show "what we gave to 1💗1", per member,
  // all-time. des_status quoted (StringFilterInput, per the backend gotcha).
  "216getSiteShareContributionsByGivingProject": `query GetSiteShareContributionsByGivingProject($project: ID!) {
    siteShareContributions(
      filters: { and: [
        { project: { id: { eq: $project } } },
        { des_status: { eq: "decided" } }
      ] },
      pagination: { limit: 500 }
    ) {
      data {
        id
        attributes {
          amount
          users_permissions_user { data { id attributes { username profilePic { data { attributes { url } } } } } }
          haluka { data { id attributes {
            senderconf
            confirmed
            amount
            userrecive { data { id attributes { username profilePic { data { attributes { url } } } } } }
          } } }
        }
      }
    }
  }`,

  // M5 archive (receiving side): every DECIDED contribution whose recive_project is
  // the platform — for the main-rikma split screen: total in, who received how much
  // (grouped by the transfer Haluka's userrecive), and a per-source-rikma breakdown
  // (grouped by the giving `project`).
  "217getSiteShareContributionsByReciveProject": `query GetSiteShareContributionsByReciveProject($recive: ID!) {
    siteShareContributions(
      filters: { and: [
        { recive_project: { id: { eq: $recive } } },
        { des_status: { eq: "decided" } }
      ] },
      pagination: { limit: 500 }
    ) {
      data {
        id
        attributes {
          amount
          project { data { id attributes { projectName profilePic { data { attributes { url } } } } } }
          users_permissions_user { data { id attributes { username profilePic { data { attributes { url } } } } } }
          haluka { data { id attributes {
            senderconf
            confirmed
            amount
            userrecive { data { id attributes { username profilePic { data { attributes { url } } } } } }
          } } }
        }
      }
    }
  }`,

  // M5 archive (all splits): every tosplit the rikma has had (finished + open),
  // newest first, with each member's fair-share allocation (`hervachti.amount` =
  // "מגיע") + the transfer halukas. Feeds the comprehensive distribution archive:
  // per-split "who got how much" + per-member all-time totals + grand total.
  "218getRikmaSplitsArchive": `query GetRikmaSplitsArchive($project: ID!) {
    project(id: $project) {
      data {
        id
        attributes {
          tosplits(pagination: { limit: 500 }, sort: ["createdAt:desc"]) {
            data {
              id
              attributes {
                name
                prectentage
                finished
                createdAt
                hervachti {
                  amount
                  noten
                  mekabel
                  users_permissions_user { data { id attributes { username profilePic { data { attributes { url } } } } } }
                }
                halukas {
                  data {
                    id
                    attributes {
                      amount
                      confirmed
                      senderconf
                      usersend { data { id attributes { username profilePic { data { attributes { url } } } } } }
                      userrecive { data { id attributes { username profilePic { data { attributes { url } } } } } }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }`,

  "67getMembersCount": `query GetMembersCount {
    chezins {
      meta {
        pagination {
          total
        }
      }
    }
  }`,

  "68updateTosplit": `mutation UpdateTosplit($id: ID!, $data: TosplitInput!) {
    updateTosplit(
      id: $id,
      data: $data
    ) {
      data {
        id
        attributes {
          halukas {
            data {
              id
              attributes {
                usersend { data { id } }
                userrecive { data { id } }
                amount
              }
            }
          }
          hervachti {
            users_permissions_user { data { id } }
            amount
            noten
            mekabel
          }
          sales {
            data {
              id
            }
          }
        }
      }
    }
  }`,

  "71createSheirutpend": `mutation CreateSheirutpend(
  $project: ID!,
  $userId: ID!,
  $matanots: [ID],
  $price: Float,
  $quant: Float,
  $total: Float,
  $startDate: DateTime,
  $finnishDate: DateTime,
  $appruved: Boolean
) {
  createSheirutpend(
    data: {
      project: $project,
      users_permissions_user: $userId,
      matanots: $matanots,
      price: $price,
      quant: $quant,
      total: $total,
      startDate: $startDate,
      finnishDate: $finnishDate,
      appruved: $appruved
    }
  ) {
    data {
      id
      attributes {
        price
        quant
        total
        startDate
        finnishDate
        appruved
      }
    }
  }
}`,

  "69createHaluka": `mutation CreateHaluka($data: HalukaInput!) {
    createHaluka(data: $data) {
      data {
        id
      }
    }
  }`,

  "70updateHaluka": `mutation UpdateHaluka($id: ID!, $amount: Float, $usersend: ID, $userrecive: ID) {
    updateHaluka(
      id: $id,
      data: {
        amount: $amount,
        usersend: $usersend,
        userrecive: $userrecive
      }
    ) {
      data {
        id
        attributes {
          amount
          usersend { data { id } }
          userrecive { data { id } }
          confirmed
        }
      }
    }
  }`,

  "70.5createTosplit": `mutation CreateTosplit($data: TosplitInput!) {
    createTosplit(data: $data) {
      data {
        id
        attributes {
          project { data { id } }
          halukas { data { id } }
          hervachti {
            users_permissions_user { data { id } }
            amount
            mekabel
            noten
          }
          vots {
            what
            users_permissions_user { data { id } }
          }
        }
      }
    }
  }`,

  "71updateSaleSplited": `mutation UpdateSaleSplited($id: ID!, $splited: Boolean, $pending: Boolean, $tosplits: [ID]) {
    updateSale(
      id: $id,
      data: {
        splited: $splited,
        pending: $pending,
        tosplits: $tosplits
      }
    ) {
      data {
        id
        attributes {
          splited
          pending
          tosplits { data { id } }
        }
      }
    }
  }`,

  "71.5getHaluka": `query GetHaluka($id: ID!) {
    haluka(id: $id) {
      data {
        id
        attributes {
          usersend { data { id } }
          userrecive { data { id } }
          senderconf
          confirmed
          forum { data { id } }
          amount
          ushar
          isSiteShare
          recive_project { data { id } }
        }
      }
    }
  }`,

  "71.6confirmHaluka": `mutation ConfirmHaluka($id: ID!, $senderconf: Boolean, $confirmed: Boolean) {
    updateHaluka(id: $id, data: { senderconf: $senderconf, confirmed: $confirmed }) {
      data {
        id
        attributes {
          senderconf
          confirmed
        }
      }
    }
  }`,

  "72createMesimabetahalich": `mutation CreateMesimabetahalich(
    $projectId: ID!,
    $missId: ID!,
    $userId: ID!,
    $openMid: [ID],
    $openmissionName: String!,
    $missionDetails: String,
    $nhours: Float!,
    $valph: Float!,
    $iskvua: Boolean,
    $hearotMeyuchadot: String,
    $privatlinks: String,
    $publicklinks: String,
    $tafkidims: [ID],
    $deadline: DateTime,
    $sqedualed: DateTime,
    $publishedAt: DateTime!
  ) {
    createMesimabetahalich(data: {
      project: $projectId,
      mission: $missId,
      hearotMeyuchadot: $hearotMeyuchadot,
      name: $openmissionName,
      descrip: $missionDetails,
      hoursassinged: $nhours,
      perhour: $valph,
      iskvua: $iskvua,
      privatlinks: $privatlinks,
      publicklinks: $publicklinks,
      users_permissions_user: $userId,
      tafkidims: $tafkidims,
      publishedAt: $publishedAt,
      admaticedai: $deadline,
      start: $sqedualed,
      open_missions: $openMid
    }) {
      data {
        id
        attributes {
          project { data { id } }
        }
      }
    }
  }`,

  "getFinnishedMission": `query GetFinnishedMission($id: ID!) {
    finnishedMission(id: $id) {
      data {
        id
        attributes {
          missionName
          start
          finish
          why
          total
          noofhours
          perhour
          descrip
          hearotMeyuchadot
          createdAt
          mesimabetahalich { data { id } }
          users_permissions_user {
            data {
              id
              attributes {
                username
                profilePic { data { attributes { url } } }
              }
            }
          }
        }
      }
    }
  }`,

  "73archiveOpenMission": `mutation ArchiveOpenMission($openMid: ID!) {
    updateOpenMission(id: $openMid, data: { archived: true }) {
      data {
        id
        attributes {
          archived
          acts { data { id } }
          asks { data { id } }
        }
      }
    }
  }`,

  "74addUserToProject": `mutation AddUserToProject($projectId: ID!, $userIds: [ID]!) {
    updateProject(id: $projectId, data: { user_1s: $userIds }) {
      data {
        id
        attributes {
          user_1s {
            data {
              id
              attributes {
                email
                lang
              }
            }
          }
        }
      }
    }
  }`,

  "75createWelcomeTop": `mutation CreateWelcomeTop($userId: ID!, $projectId: ID!, $publishedAt: DateTime!) {
    createWelcomTop(data: {
      users_permissions_user: $userId,
      project: $projectId,
      publishedAt: $publishedAt
    }) {
      data {
        id
      }
    }
  }`,

  "76archiveAsk": `mutation ArchiveAsk($askId: ID!, $vots: [ComponentProjectsVotsInput]) {
    updateAsk(id: $askId, data: { archived: true, vots: $vots }) {
      data {
        id
      }
    }
  }`,

  "77createMonter": `mutation CreateMonter($mesimabetahalikhId: ID!, $start: DateTime!, $finish: DateTime) {
    createMonter(data: {
      mesimabetahalich: $mesimabetahalikhId,
      ani: "mesimabetahalich",
      start: $start,
      finish: $finish
    }) {
      data {
        id
      }
    }
  }`,

  "78archiveMultipleAsks": `mutation ArchiveMultipleAsks($askIds: [ID]!) {
    updateAsks(ids: $askIds, data: { archived: true }) {
      data {
        id
      }
    }
  }`,

  "79approveTosplit": `mutation ApproveTosplit(
    $tosplitId: ID!
    $vots: [ComponentProjectsVotsInput]
  ) {
    updateTosplit(
      id: $tosplitId
      data: {
        vots: $vots
        finished: true
      }
    ) {
      data {
        id
        attributes {
          vots {
            what
            why
            users_permissions_user {
              data {
                id
              }
            }
          }
          sales {
            data {
              id
            }
          }
        }
      }
    }
  }`,

  "72getSheirutpendById": `query GetSheirutpendById($id: ID!) {
    sheirutpend(id: $id) {
      data {
        id
        attributes {
          project {
            data {
              id
              attributes {
                projectName
                profilePic {
                  data {
                    attributes {
                      url
                      formats
                    }
                  }
                }
                user_1s {
                  data { id }
                }
              }
            }
          }
          sheirut {
            data {
              id
              attributes {
                name
                descrip
                equaliSplited
                oneTime
                price
                quant
              }
            }
          }
          startDate
          finnishDate
          price
          quant
          total
          users_permissions_user {
            data {
              id
              attributes {
                username
                profilePic {
                  data {
                    attributes {
                      url
                      formats
                    }
                  }
                }
              }
            }
          }
          matanots {
            data {
              id
              attributes {
                name
                desc
                kindOf
                pricingMode
                estimatedPrice
                marginPct
                pic {
                  data {
                    attributes {
                      url
                      formats
                    }
                  }
                }
                matanot_recipe_missions {
                  data {
                    id
                    attributes {
                      hoursPerUnit
                      unitsPerProduct
                      ratePerHour
                      mode
                      notes
                      pendm { data { id attributes { name descrip noofhours perhour rishon { data { id } } mission { data { id } } } } }
                      mesimabetahalich { data { id attributes { name howmanyhoursalready hoursassinged } } }
                    }
                  }
                }
                matanot_recipe_resources {
                  data {
                    id
                    attributes {
                      quantityPerUnit
                      pricePerUnit
                      kindOf
                      mode
                      notes
                      pmash { data { id attributes { name price hm kindOf descrip } } }
                      mashabetahalich { data { id attributes { name pricePerUnit kindOf descrip } } }
                    }
                  }
                }
              }
            }
          }
          forum {
            data {
              id
            }
          }
          votes { data {id attributes{
            what
            order
            users_permissions_user {
              data {
                id
              }
            }
}}}
          timegrama {
            data {
              id
              attributes {
                date
              }
            }
          }
          createdAt
        }
      }
    }
  }`,

  "80updateSale": `mutation UpdateSale($saleId: ID!) {
    updateSale(
      id: $saleId
      data: { 
        splited: true,
        pending: false
      }
    ) {
      data {
        id
      }
    }
  }`,

  '81updateHaluka': `mutation UpdateHaluka($halukaId: ID!) {
    updateHaluka(
      id: $halukaId
      data: { ushar: true }
    ) {
      data {
        id
      }
    }
  }`,
  '124addVoteToTosplit': `mutation AddVoteToTosplit($id: ID!, $vots: [ComponentProjectsVotsInput]) {
    updateTosplit(id: $id, data: { vots: $vots }) {
      data { id }
    }
  }`,
  '73updateSheirutpend': `mutation UpdateSheirutpend($id: ID!, $data: SheirutpendInput!) {
    updateSheirutpend(id: $id, data: $data) {
      data {
        id
      }
    }
  }`,
  // ── Pendm / Pmash vote actions ────────────────────────────────────────────
  '142getPendmForVote': `query GetPendmForVote($id: ID!) {
    pendm(id: $id) {
      data {
        id
        attributes {
          name descrip hearotMeyuchadot noofhours perhour iskvua privatlinks publicklinks sqadualed dates
          mission { data { id } }
          skills { data { id } }
          tafkidims { data { id } }
          work_ways { data { id } }
          vallues { data { id } }
          negopendmissions { data { id } }
          timegrama { data { id } }
          users {
            what order ide zman why
            users_permissions_user { data { id } }
          }
        }
      }
    }
  }`,

  '143archivePendmWithVotes': `mutation ArchivePendmWithVotes($id: ID!, $users: [ComponentProjectsPendmnegoInput!]!) {
    updatePendm(id: $id, data: { archived: true, users: $users }) {
      data { id }
    }
  }`,

  '144getPmashForVote': `query GetPmashForVote($id: ID!) {
    pmash(id: $id) {
      data {
        id
        attributes {
          name descrip spnot kindOf hm price easy linkto sqadualed sqadualedf recurring cycleSize
          mashaabim { data { id } }
          timegrama { data { id } }
          users {
            what order ide zman why
            users_permissions_user { data { id } }
          }
        }
      }
    }
  }`,

  '145archivePmashWithVotes': `mutation ArchivePmashWithVotes($id: ID!, $users: [ComponentProjectsVotsInput!]!) {
    updatePmash(id: $id, data: { archived: true, users: $users }) {
      data { id }
    }
  }`,

  '146addVoteToPmash': `mutation AddVoteToPmash($id: ID!, $users: [ComponentProjectsVotsInput!]!) {
    updatePmash(id: $id, data: { users: $users }) {
      data {
        id
        attributes {
          users {
            what order ide zman
            users_permissions_user { data { id } }
          }
        }
      }
    }
  }`,

  '147getPendmDiun': `query GetPendmDiun($id: ID!) {
    pendm(id: $id) {
      data {
        id
        attributes {
          diun {
            id what why order zman ide
            users_permissions_user { data { id } }
          }
        }
      }
    }
  }`,

  '148getPmashDiun': `query GetPmashDiun($id: ID!) {
    pmash(id: $id) {
      data {
        id
        attributes {
          diun {
            id what why order zman ide
            users_permissions_user { data { id } }
          }
        }
      }
    }
  }`,

  '149updatePendmDiun': `mutation UpdatePendmDiun($id: ID!, $diun: [ComponentProjectsVotsInput]) {
    updatePendm(id: $id, data: { diun: $diun }) {
      data {
        id
        attributes {
          diun {
            id what why order zman ide
            users_permissions_user { data { id } }
          }
        }
      }
    }
  }`,

  '150updatePmashDiun': `mutation UpdatePmashDiun($id: ID!, $diun: [ComponentProjectsVotsInput]) {
    updatePmash(id: $id, data: { diun: $diun }) {
      data {
        id
        attributes {
          diun {
            id what why order zman ide
            users_permissions_user { data { id } }
          }
        }
      }
    }
  }`,

  // ── Mission in-progress updates ──────────────────────────────────────────
  '154updateMissionStatus': `mutation UpdateMissionStatus($id: ID!, $status: Int) {
    updateMesimabetahalich(id: $id, data: { status: $status }) {
      data { id attributes { status } }
    }
  }`,

  // ── Maap (resource application) vote actions ──────────────────────────────
  '151getMaapForVote': `query GetMaapForVote($id: ID!) {
    maap(id: $id) {
      data {
        id
        attributes {
          name
          quantityDelivered
          cycleIndex
          cycleStart
          cycleEnd
          mashabetahalich {
            data {
              id
              attributes {
                name
                pricePerUnit
                kindOf
                quantityDelivered
                users_permissions_user { data { id } }
                rikmash { data { id } }
                project { data { id } }
                forums(pagination: { limit: 1 }) { data { id } }
              }
            }
          }
          timegrama { data { id attributes { date done } } }
          vots {
            id
            what
            why
            order
            users_permissions_user { data { id } }
          }
          sp {
            data {
              id
              attributes {
                unit
                myp
                users_permissions_user { data { id } }
              }
            }
          }
          open_mashaabim {
            data {
              id
              attributes {
                name
                easy
                price
                sqadualed
                sqadualedf
                spnot
                kindOf
              }
            }
          }
        }
      }
    }
  }`,

  '152archiveMaapWithVotes': `mutation ArchiveMaapWithVotes($id: ID!, $vots: [ComponentProjectsVotsInput]) {
    updateMaap(id: $id, data: { archived: true, vots: $vots }) {
      data { id }
    }
  }`,

  '153addVoteToMaap': `mutation AddVoteToMaap($id: ID!, $vots: [ComponentProjectsVotsInput]) {
    updateMaap(id: $id, data: { vots: $vots }) {
      data { id }
    }
  }`,

  // ── Haluka (money transfer) receiver-confirmation + chat ──────────────────
  '155getHalukaForReceive': `query GetHalukaForReceive($id: ID!) {
    haluka(id: $id) {
      data {
        id
        attributes {
          usersend { data { id } }
          userrecive { data { id } }
          senderconf
          confirmed
          tosplit {
            data {
              id
              attributes {
                halukas {
                  data {
                    id
                    attributes {
                      confirmed
                    }
                  }
                }
                hervachti {
                  users_permissions_user {
                    data {
                      id
                      attributes {
                        hervachti
                      }
                    }
                  }
                  noten
                  mekabel
                  amount
                }
              }
            }
          }
        }
      }
    }
  }`,

  '156getHalukaChatre': `query GetHalukaChatre($id: ID!) {
    haluka(id: $id) {
      data {
        id
        attributes {
          chatre {
            when
            send { data { id } }
            freetext
            seen
          }
        }
      }
    }
  }`,

  '157updateHalukaChatre': `mutation UpdateHalukaChatre($id: ID!, $chatre: [ComponentProjectsChatreInput]) {
    updateHaluka(id: $id, data: { chatre: $chatre }) {
      data {
        id
        attributes {
          chatre {
            freetext
            send { data { id attributes { username profilePic { data { attributes { url } } } } } }
            when
            seen
          }
        }
      }
    }
  }`,

  '158updateUserHervachti': `mutation UpdateUserHervachti($id: ID!, $hervachti: Float) {
    updateUsersPermissionsUser(id: $id, data: { hervachti: $hervachti }) {
      data { id }
    }
  }`,

  // ── Decision (project vote) ────────────────────────────────────────────────
  '159getDecisionForVote': `query GetDecisionForVote($eid: ID!) {
    decision(id: $eid) {
      data {
        id
        attributes {
          kind
          archived
          projects { data { id } }
          newpic { data { id attributes { url } } }
          timegrama { data { id attributes { date } } }
          newname
          newpubdes
          newprides
          newFlink
          newWlink
          timtoM
          valluesadd { data { id attributes { valueName } } }
          valluesles { data { id attributes { valueName } } }
          vots {
            id
            what
            ide
            zman
            order
            users_permissions_user { data { id } }
          }
        }
      }
    }
  }`,

  '160archiveDecision': `mutation ArchiveDecision($id: ID!, $vots: [ComponentProjectsVotsInput]) {
    updateDecision(id: $id, data: { archived: true, vots: $vots }) {
      data { id }
    }
  }`,

  // ── Decision display info (for card UI: shows current value vs. proposed) ──
  '161getDecisionDisplayInfo': `query GetDecisionDisplayInfo($id: ID!, $pid: ID!) {
    decision(id: $id) {
      data {
        attributes {
          kind
          newname
          newpubdes
          newprides
          newFlink
          newWlink
          timtoM
          valluesadd { data { id attributes { valueName } } }
          valluesles { data { id attributes { valueName } } }
        }
      }
    }
    project(id: $pid) {
      data {
        attributes {
          projectName
          publicDescription
          descripFor
          fblink
          linkToWebsite
          restime
          vallues { data { id attributes { valueName } } }
        }
      }
    }
  }`,

  '85addVoteToPend': `mutation AddVoteToPend($id: ID!, $users: [ComponentProjectsPendmnegoInput!]!) {
    updatePendm(id: $id, data: { users: $users }) {
      data {
        id
        attributes {
          users {
            what
            order
            ide
            zman
            users_permissions_user {
              data {
                id
              }
            }
          }
        }
      }
    }
  }`,
  '86addVoteToSheirutpend': `mutation AddVoteToSheirutpend($id: ID!, $vots: [ComponentProjectsVotsInput!]!) {
    updateSheirutpend(id: $id, data: { vots: $vots }) {
      data {
        id
        attributes {
          vots {
            what
            id
            order
            zman
            ide
            users_permissions_user {
              data {
                id
              }
            }
          }
        }
      }
    }
  }`,
  '53GetPendingMeetings': `query GetPendingMeetings($userId: ID!) {
    pgishauserpends(filters: { users_permissions_user: { id: { eq: $userId } }, archived: { ne: true } }) {
      data {
        id
        attributes {
          pgisha {
            data {
              id
              attributes {
                name
                desc
                publishedAt
                pgishausers {
                  data {
                    attributes {
                       users_permissions_user { data { attributes { username profilePic { data { attributes { url } } } } } }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }`,
  '54ApprovePendMeeting': `mutation ApprovePendMeeting($id: ID!) {
    updatePgishauserpend(id: $id, data: { approved: true, archived: true }) {
      data {
        id
      }
    }
  }`,
  '55CheckMeetingStatus': `query CheckMeetingStatus($pgishaId: ID!) {
    pgisha(id: $pgishaId) {
      data {
        id
        attributes {
          name
          set
          pgishauserpends(filters: { archived: { ne: true } }) {
            data {
              id
            }
          }
          pgishausers {
            data {
              attributes {
                users_permissions_user {
                  data {
                    id
                    attributes {
                      username
                      email
                      lang
                      telegramId
                      machshirs { data { attributes { jsoni } } }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }`,
  '56SetMeetingSet': `mutation SetMeetingSet($id: ID!) {
    updatePgisha(id: $id, data: { set: true }) {
      data {
        id
        attributes {
          set
        }
      }
    }
  }`,
  '57StartMeeting': `mutation StartMeeting($id: ID!, $videoLink: String!, $isLive: Boolean!, $meetingStartedAt: DateTime!, $startedBy: ID!, $forum: ID) {
    updatePgisha(id: $id, data: { 
      videoLink: $videoLink, 
      isLive: $isLive, 
      meetingStartedAt: $meetingStartedAt,
      startedBy: $startedBy,
      forum: $forum
    }) {
      data {
        id
        attributes {
          videoLink
          isLive
          meetingStartedAt
          forum { data { id } }
        }
      }
    }
  }`,
  '58CreateMeetingForum': `mutation CreateMeetingForum($pgishaId: ID!, $publishedAt: DateTime!) {
    createForum(data: { 
      pgisha: $pgishaId,
      publishedAt: $publishedAt
    }) {
      data {
        id
      }
    }
  }`,
  '59GetMeetingDetails': `query GetMeetingDetails($id: ID!) {
    pgisha(id: $id) {
      data {
        id
        attributes {
          name
          desc
          available
          set
          isLive
          videoLink
          meetingStartedAt
          forum { 
            data { 
              id 
              attributes {
                messages {
                  data {
                    id
                    attributes {
                      content
                      createdAt
                      users_permissions_user {
                        data {
                          id
                          attributes {
                            username
                            profilePic { data { attributes { url } } }
                          }
                        }
                      }
                    }
                  }
                }
              }
            } 
          }
          startedBy { data { id attributes { username } } }
          pgishausers {
            data {
              id
              attributes {
                available
                users_permissions_user {
                  data {
                    id
                    attributes {
                      username
                      email
                      lang
                      telegramId
                      profilePic { data { attributes { url } } }
                      machshirs { data { attributes { jsoni } } }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }`,
  '60EndMeeting': `mutation EndMeeting($id: ID!) {
    updatePgisha(id: $id, data: { isLive: false }) {
      data {
        id
        attributes {
          isLive
        }
      }
    }
  }`,
  '61RequestMeetingStart': `mutation RequestMeetingStart($id: ID!, $videoLink: String!, $pendingStart: Boolean!, $startRequestedAt: DateTime!, $startRequestedBy: ID!, $forum: ID) {
    updatePgisha(id: $id, data: { 
      videoLink: $videoLink, 
      pendingStart: $pendingStart, 
      startRequestedAt: $startRequestedAt,
      startRequestedBy: $startRequestedBy,
      forum: $forum
    }) {
      data {
        id
        attributes {
          videoLink
          pendingStart
          startRequestedAt
          forum { data { id } }
        }
      }
    }
  }`,
  '62SetUserReadyForStart': `mutation SetUserReadyForStart($id: ID!, $ready: Boolean!) {
    updatePgishauser(id: $id, data: { readyForStart: $ready }) {
      data {
        id
        attributes {
          readyForStart
        }
      }
    }
  }`,
  '63CheckMeetingReadyStatus': `query CheckMeetingReadyStatus($id: ID!) {
    pgisha(id: $id) {
      data {
        id
        attributes {
          name
          pendingStart
          isLive
          videoLink
          startRequestedAt
          startRequestedBy { data { id attributes { username } } }
          forum { data { id } }
          pgishausers {
            data {
              id
              attributes {
                readyForStart
                available
                users_permissions_user {
                  data {
                    id
                    attributes {
                      username
                      email
                      lang
                      telegramId
                      profilePic { data { attributes { url } } }
                      machshirs { data { attributes { jsoni } } }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }`,
  '64ClearPendingStart': `mutation ClearPendingStart($id: ID!) {
    updatePgisha(id: $id, data: { pendingStart: false }) {
      data {
        id
        attributes {
          pendingStart
        }
      }
    }
  }`,
  'updateMeetingAvailability': `mutation UpdateMeetingAvailability($id: ID!, $available: Boolean) {
    updatePgisha(id: $id, data: { available: $available }) {
      data {
        id
        attributes {
          available
        }
      }
    }
  }`,
  '65GetAskById': `query GetAskById($id: ID!) {
      ask(id: $id) {
        data {
          id
          attributes {
            users_permissions_user { data { id } }
            project { data { id attributes { projectName } } }
            forums { data { id } }
          }
        }
      }
    }`,
  '66CreateForumForAsk': `mutation CreateForumForAsk($publishedAt: DateTime, $subject: String, $pid: ID) {
      createForum(data: { publishedAt: $publishedAt, subject: $subject, project: $pid }) {
        data { id }
      }
    }`,
  '67UpdateAskForum': `mutation UpdateAskForum($id: ID!, $forumId: ID!) {
      updateAsk(id: $id, data: { forums: [$forumId] }) {
        data { id }
      }
    }`,
  '80usersPermissionsUserWithAskeds': `query GetUsersPermissionsUserWithAskeds($id: ID!) {
        usersPermissionsUser(id: $id) {
          data {
            id
            attributes {
              askeds {
                data {
                  id
                }
              }
            }
          }
        }
      }`,
  '81updateAskeds': `mutation UpdateAskeds(
      $userId: ID!,
      $askedsList: [ID]
    ) {
      updateUsersPermissionsUser(
        id: $userId
        data: { askeds: $askedsList }
      ) {
        data {
          id
          attributes {
            askeds {
              data {
                id
              }
            }
          }
        }
      }
    }`,
  '81.5createAsk': `mutation CreateAsk(
      $userId: ID!,
      $openMissionId: ID,
      $projectId: ID!,
      $publishedAt: DateTime,
      $vote: [ComponentProjectsVotsInput]
    ) {
      createAsk(
        data: {
          open_mission: $openMissionId,
          project: $projectId,
          users_permissions_user: $userId,
          publishedAt: $publishedAt,
          vots: $vote
        }
      ) {
        data {
          id
        }
      }
    }`,
  '82createTimegramaForAsk': `mutation CreateTimegramaForAsk($date: DateTime, $whatami: String, $askId: ID) {
      createTimegrama(
        data: {
          date: $date,
          whatami: $whatami,
          ask: $askId
        }
      ) {
        data {
          id
        }
      }
    }`,
  '128getProjectMembersAndRestime': `query GetProjectMembersAndRestime($pid: ID!) {
    project(id: $pid) {
      data {
        attributes {
          restime
          user_1s { data { id } }
        }
      }
    }
  }`,
  // Users who hold the given roles (tafkidim) — used to notify only the role
  // holders (intersected with project members) when a task is assigned to a role.
  'getRolesHolders': `query GetRolesHolders($ids: [ID]) {
    tafkidims(filters: { id: { in: $ids } }) {
      data {
        id
        attributes {
          users_permissions_users { data { id } }
        }
      }
    }
  }`,
  // People (members) and roles (tafkidim) of a project — used to resolve a task
  // assignee ("for a person or a role") by name when creating an Act via chat/MCP/Telegram.
  'getProjectPeopleAndRoles': `query GetProjectPeopleAndRoles($pid: ID!) {
    project(id: $pid) {
      data {
        id
        attributes {
          projectName
          user_1s { data { id attributes { username } } }
          tafkidims { data { id attributes { roleDescription localizations { data { attributes { roleDescription } } } } } }
        }
      }
    }
  }`,
  '125createAskm': `mutation CreateAskm($publishedAt: DateTime!, $openMashaabimId: ID!, $projectId: ID!, $spId: ID!, $userId: ID!, $vots: [ComponentProjectsVotsInput], $archived: Boolean) {
    createAskm(data: {
      publishedAt: $publishedAt,
      open_mashaabim: $openMashaabimId,
      project: $projectId,
      sp: $spId,
      users_permissions_user: $userId,
      vots: $vots,
      archived: $archived
    }) { data { id } }
  }`,
  '126updateSpDeclined': `mutation UpdateSpDeclined($id: ID!, $openMashaabimId: ID!) {
    updateSp(id: $id, data: { declinedm: $openMashaabimId }) {
      data { id }
    }
  }`,
  '127createTimegramaForAskm': `mutation CreateTimegramaForAskm($date: DateTime!, $askmId: ID!) {
    createTimegrama(data: { date: $date, whatami: "askm", askm: $askmId }) {
      data { id }
    }
  }`,
  '129updateUserDeclined': `mutation UpdateUserDeclined($userId: ID!, $declinedList: [ID]) {
    updateUsersPermissionsUser(id: $userId, data: { declined: $declinedList }) {
      data { id }
    }
  }`,
  '130updateOpenMissionDeclined': `mutation UpdateOpenMissionDeclined($id: ID!, $declinedId: ID) {
    updateOpenMission(id: $id, data: { declined: $declinedId }) {
      data { id }
    }
  }`,
  '131archiveOpenMashaabim': `mutation ArchiveOpenMashaabim($id: ID!) {
    updateOpenMashaabim(id: $id, data: { archived: true }) {
      data { id attributes { askms { data { id } } } }
    }
  }`,
  '131bArchiveAskm': `mutation ArchiveAskm($id: ID!) {
    updateAskm(id: $id, data: { archived: true }) {
      data { id }
    }
  }`,
  '132archiveAskmWithVotes': `mutation ArchiveAskmWithVotes($id: ID!, $vots: [ComponentProjectsVotsInput]) {
    updateAskm(id: $id, data: { archived: true, vots: $vots }) {
      data { id }
    }
  }`,
  '133addVoteToAskm': `mutation AddVoteToAskm($id: ID!, $vots: [ComponentProjectsVotsInput]) {
    updateAskm(id: $id, data: { vots: $vots }) {
      data { id }
    }
  }`,
  '83levMainUserQuery': `query LevMainUserQuery($idL: ID!) {
  usersPermissionsUser(id: $idL) {
    data {
      id
      attributes {
        haskama
        ratsons {
          data {
            id
            attributes {
              name
              desc
              logo { data { attributes { url formats } } }
              extracted_missions { id name }
              extracted_resources { id name }
              ratson_proposals {
                data {
                  id
                  attributes {
                    kind
                    status_proposal
                    total_price
                    createdAt
                    proposer_users {
                      data {
                        id
                        attributes {
                          username
                          profilePic { data { attributes { url formats } } }
                        }
                      }
                    }
                    open_mission {
                      data {
                        id
                        attributes { name noofhours perhour }
                      }
                    }
                    forum { data { id } }
                    covered_missions { id extracted_mission_idx hours price }
                  }
                }
              }
            }
          }
        }
        asks(filters: { archived: { eq: false } }) {
          data {
            id
            attributes {
              archived
              project {
                data {
                  id
                  attributes {
                    projectName
                    profilePic {
                      data {
                        attributes {
                          url
                          formats
                        }
                      }
                    }
                  }
                }
              }
              vots {
                what
                zman
                order
                id
                users_permissions_user {
                  data {
                    id
                  }
                }
              }
              timegrama {
                data {
                  id
                  attributes {
                    date
                    done
                  }
                }
              }
              negopendmissions(sort: "ordern:desc") {
                data {
                  id
                  attributes {
                    ordern
                    proposedBy
                    status
                    name
                    descrip
                    hearotMeyuchadot
                    noofhours
                    perhour
                    date
                    dates
                    createdAt
                  }
                }
              }
              createdAt
              open_mission {
                data {
                  id
                  attributes {
                    name
                    isRishon
                  }
                }
              }
              chat {
                why
                ide
                what
                zman
                id
                users_permissions_user {
                  data {
                    id
                    attributes {
                      username
                      profilePic {
                        data {
                          attributes {
                            url
                            formats
                          }
                        }
                      }
                    }
                  }
                }
              }
              forums {
                data {
                  id
                  attributes {
                    messages(pagination: { limit: 100 }) {
                      data {
                        id
                        attributes {
                          content
                          createdAt
                          users_permissions_user {
                            data {
                              id
                              attributes {
                                username
                                profilePic {
                                  data {
                                    attributes {
                                      url
                                      formats
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
        askms(filters: { archived: { eq: false } }) {
          data {
            id
            attributes {
              vots {
                what
                why
                zman
                order
                id
                users_permissions_user {
                  data {
                    id
                  }
                }
              }
              timegrama {
                data {
                  id
                  attributes {
                    date
                    done
                  }
                }
              }
              nego_mashes(sort: "ordern:desc") {
                data {
                  id
                  attributes {
                    ordern
                    proposedBy
                    status
                    name
                    descrip
                    spnot
                    easy
                    hm
                    price
                    kindOf
                    sqadualed
                    sqadualedf
                    linkto
                    createdAt
                  }
                }
              }
              open_mashaabim {
                data {
                  id
                  attributes {
                    price
                    descrip
                    spnot
                    kindOf
                    sqadualedf
                    sqadualed
                    linkto
                    createdAt
                    hm
                    name
                    easy
                    recurring
                    cycleSize
                  }
                }
              }
              project {
                data {
                  id
                  attributes {
                    projectName
                    user_1s {
                      data {
                        id
                      }
                    }
                    profilePic {
                      data {
                        attributes {
                          url
                          formats
                        }
                      }
                    }
                  }
                }
              }
              users_permissions_user {
                data {
                  id
                  attributes {
                    haskama
                    username
                    profilePic {
                      data {
                        attributes {
                          url
                          formats
                        }
                      }
                    }
                  }
                }
              }
              isSelfProposal
              sp { data { id } }
              pmash { data { id } }
            }
          }
        }
        sps {
          data {
            id
            attributes {
              name
              unit
              price
              myp
              mashaabim {
                data {
                  id
                  attributes {
                    price
                  }
                }
              }
            }
          }
        }
        mesimabetahaliches(
          filters: { forappruval: { eq: false }, finnished: { eq: false } }
        ) {
          data {
            id
            attributes {
              status
              stname
              timer
              hearotMeyuchadot
              name
              descrip
              hoursassinged
              perhour
              privatlinks
              publicklinks
              iskvua
              howmanyhoursalready
              admaticedai
              dates
              forums{ 
              data { id 
              }
              }
              mission {
                data {
                  id
                }
              }
              project {
                data {
                  id
                  attributes {
                    projectName
                  }
                }
              }
              acts {
                data {
                  id
                  attributes {
                    shem
                    myIshur
                    link
                    vali{data{id attributes{ username profilePic {data{attributes{ url }}}}}}
                    hashivut
                    valiIshur
                    des
                    dateF
                    dateS
                    status
                    naasa
                  }
                }
              }
            }
          }
        }
        welcom_tops(filters: { clicked: { eq: false } }) {
          data {
            id
            attributes {
              project {
                data {
                  id
                  attributes {
                    descripFor
                    publicDescription
                  }
                }
              }
            }
          }
        }
        skills {
          data {
            id
          }
        }
        username
        hervachti
        profilePic {
          data {
            attributes {
              url
              formats
            }
          }
        }
        askeds {
          data {
            id
          }
        }
        declined {
          data {
            id
          }
        }
        work_ways {
          data {
            id
          }
        }
        tafkidims {
          data {
            id
          }
        }
        projects_1s {
          data {
            id
            attributes {
              projectName
              restime
              user_1s {
                data {
                  id
                  attributes {
                    username
                    haskamaz
                    haskamac
                    email
                    noMail
                    haskama
                    profilePic {
                      data {
                        attributes {
                          url
                          formats
                        }
                      }
                    }
                  }
                }
              }
              profilePic {
                data {
                  attributes {
                    url
                    formats
                  }
                }
              }
              sheiruts {
                data {
                  id
                  attributes {
                    name
                    descrip
                    equaliSplited
                    oneTime
                    archived
                    isApruved
                    isItOnlyOneInProject
                    price
                    quant
                    startDate
                    finnishDate
                    total
                    iGotIt
                    iTransferMoney
                    iGotMoney { iGotMoney users_permissions_user { data { id } } }
                    moneyTransfered
                    productExepted
                    isSiteShareIncome
                    weFinnish {
                      data {
                        id
                        attributes {
                          what
                          order
                          why
                          users_permissions_user {
                            data {
                              id
                            }
                          }
                        }
                      }
                    }
                    iCanGetMonay {
                      data {
                        id
                        attributes {
                          username
                          profilePic {
                            data {
                              attributes {
                                url
                                formats
                              }
                            }
                          }
                        }
                      }
                    }
                    iTransferedTo {
                      data {
                        id
                        attributes {
                          username
                          profilePic {
                            data {
                              attributes {
                                url
                                formats
                              }
                            }
                          }
                        }
                      }
                    }
                    users_permissions_users {
                      data {
                        id
                        attributes {
                          username
                          profilePic {
                            data {
                              attributes {
                                url
                                formats
                              }
                            }
                          }
                        }
                      }
                    }
                    matanot {
                      data {
                        id
                        attributes {
                          name
                          desc
                          price
                          quant
                          kindOf
                          pic {
                            data {
                              attributes {
                                url
                                formats
                              }
                            }
                          }
                        }
                      }
                    }
                    forums {
                      data {
                        id
                        attributes {
                          messages(pagination: { limit: 50 }) {
                            data {
                              id
                              attributes {
                                content
                                createdAt
                                users_permissions_user {
                                  data {
                                    id
                                    attributes {
                                      username
                                      profilePic {
                                        data {
                                          attributes {
                                            url
                                            formats
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                    halukas(filters: { ushar: { eq: true } }) {
                      data {
                        id
                        attributes {
                          senderconf
                          confirmed
                          amount
                          isSiteShare
                          forum { data { id } }
                          usersend {
                            data {
                              id
                              attributes {
                                username
                                profilePic { data { attributes { url formats } } }
                              }
                            }
                          }
                          userrecive {
                            data {
                              id
                              attributes {
                                username
                                profilePic { data { attributes { url formats } } }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
              sheirutpends(filters: { archived: { eq: false } }) {
                data {
                  id
                  attributes {
                    sheirut {
                      data {
                        id
                        attributes {
                          name
                          descrip
                          equaliSplited
                          oneTime
                        }
                      }
                    }
                    startDate
                    finnishDate
                    price
                    quant
                    total
                    users_permissions_user {
                      data {
                        id
                        attributes {
                          username
                          profilePic {
                            data {
                              attributes {
                                url
                                formats
                              }
                            }
                          }
                        }
                      }
                    }
                    matanots {
                      data {
                        id
                        attributes {
                          name
                          desc
                          price
                          quant
                          kindOf
                          pic {
                            data {
                              attributes {
                                url
                                formats
                              }
                            }
                          }
                        }
                      }
                    }
                    createdAt
                    votes {
                      data {
                        id
                        attributes {
                          what
                          order
                          why
                          users_permissions_user {
                            data {
                              id
                            }
                          }
                        }
                      }
                    }
                    timegrama {
                      data {
                        id
                        attributes {
                          date
                        }
                      }
                    }
                  }
                }
              }
              decisions(filters: { archived: { eq: false } }) {
                data {
                  id
                  attributes {
                    kind
                    createdAt
                    timegrama {
                      data {
                        id
                        attributes {
                          date
                        }
                      }
                    }
                    newpic {
                      data {
                        id
                        attributes {
                          url
                          formats
                        }
                      }
                    }
                    vots {
                      what
                      why
                      id
                      order
                      users_permissions_user {
                        data {
                          id
                        }
                      }
                    }
                    negom {
                      id
                      hm
                      price
                      kindOf
                      sqadualed
                      sqadualedf
                      notes
                    }
                    sale {
                      data {
                        id
                        attributes {
                          in
                          unit
                          date
                          startDate
                          finishDate
                          note
                          holderStatus
                          reporter { data { id attributes { username } } }
                          users_permissions_user { data { id attributes { username } } }
                          matanot { data { id attributes { name quant } } }
                        }
                      }
                    }
                  }
                }
              }
              tosplits(filters: { finished: { eq: false } }) {
                data {
                  id
                  attributes {
                    name
                    halukas {
                      data {
                        id
                        attributes {
                          amount
                          confirmed
                          usersend { data { id } }
                          userrecive { data { id } }
                        }
                      }
                    }
                    vots {
                      what
                      why
                      id
                      users_permissions_user {
                        data {
                          id
                        }
                      }
                    }
                    hervachti {
                      amount
                      noten
                      mekabel
                      users_permissions_user {
                        data {
                          id
                          attributes {
                            hervachti
                          }
                        }
                      }
                    }
                    siteShareHalukas {
                      data {
                        id
                        attributes {
                          amount
                          confirmed
                          senderconf
                          proposedAmount
                          adjustDirection
                          adjustReason
                          usersend { data { id } }
                          userrecive { data { id } }
                          recive_project {
                            data {
                              id
                              attributes {
                                projectName
                                profilePic { data { attributes { url } } }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
              halukas(
                filters: { and: [{ ushar: { eq: true } }, { confirmed: { eq: false } }] }
              ) {
                data {
                  id
                  attributes {
                    amount
                    senderconf
                    forum {
                      data {
                        id
                      }
                    }
                    chatre {
                      freetext
                      send {
                        data {
                          id
                        }
                      }
                      when
                      seen
                    }
                    usersend {
                      data {
                        id
                      }
                    }
                    userrecive {
                      data {
                        id
                      }
                    }
                    tosplit {
                      data {
                        id
                        attributes {
                          halukas {
                            data {
                              id
                              attributes {
                                confirmed
                              }
                            }
                          }
                          hervachti {
                            nirsham
                            amount
                            noten
                            mekabel
                            users_permissions_user {
                              data {
                                id
                                attributes {
                                  hervachti
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
              maaps(filters: { archived: { eq: false } }) {
                data {
                  id
                  attributes {
                    createdAt
                    name
                    quantityDelivered
                    cycleIndex
                    cycleStart
                    cycleEnd
                    mashabetahalich {
                      data {
                        id
                        attributes {
                          name
                          pricePerUnit
                          kindOf
                          start
                          end
                          status_mashab
                          users_permissions_user { data { id } }
                        }
                      }
                    }
                    timegrama { data { id attributes { date done } } }
                    sp {
                      data {
                        id
                        attributes {
                          name
                          myp
                          unit
                          users_permissions_user {
                            data {
                              id
                              attributes {
                                username
                                profilePic {
                                  data {
                                    attributes {
                                      url
                                      formats
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                    open_mashaabim {
                      data {
                        id
                        attributes {
                          name
                          sqadualed
                          sqadualedf
                          kindOf
                          spnot
                          easy
                        }
                      }
                    }
                    vots {
                      what
                      why
                      id
                      order
                      users_permissions_user {
                        data {
                          id
                        }
                      }
                    }
                  }
                }
              }
              pmashes(filters: { archived: { eq: false }, matanot_recipe_resources: { id: { null: true } } }) {
                data {
                  id
                  attributes {
                    hm
                    sqadualedf
                    sqadualed
                    linkto
                    createdAt
                    name
                    descrip
                    easy
                    price
                    kindOf
                    spnot
                    recurring
                    cycleSize
                    location {
                      location_mode
                      lat
                      lng
                      radius
                      location_hint
                    }
                    nego_mashes {
                      data {
                        id
                        attributes {
                          hm
                          sqadualedf
                          sqadualed
                          linkto
                          createdAt
                          name
                          descrip
                          easy
                          price
                          kindOf
                          spnot
                          recurring
                          cycleSize
                          location {
                            location_mode
                            lat
                            lng
                            radius
                            location_hint
                          }
                          users_permissions_user {
                            data {
                              id
                            }
                          }
                        }
                      }
                    }
                    mashaabim {
                      data {
                        id
                      }
                    }
                    timegrama {
                      data {
                        id
                        attributes {
                          date
                        }
                      }
                    }
                    diun {
                      what
                      why
                      order
                      id
                      zman
                      users_permissions_user {
                        data {
                          id
                        }
                      }
                    }
                    users {
                      what
                      order
                      why
                      id
                      users_permissions_user {
                        data {
                          id
                        }
                      }
                    }
                  }
                }
              }
              open_mashaabims {
                data {
                  id
                  attributes {
                    name
                    project {
                      data {
                        id
                      }
                    }
                    mashaabim {
                      data {
                        attributes {
                          sps {
                            data {
                              id
                              attributes {
                                name
                                price
                                kindOf
                                spnot
                                myp
                                users_permissions_user {
                                  data {
                                    id
                                    attributes {
                                      username
                                      profilePic {
                                        data {
                                          attributes {
                                            url
                                            formats
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
              askwants(filters: { archived: { eq: false } }) {
                data {
                  id
                  attributes {
                    timegrama {
                      data {
                        id
                      }
                    }
                    vots {
                      what
                      why
                      order
                      ide
                      zman
                      users_permissions_user {
                        data {
                          id
                        }
                      }
                    }
                    users_permissions_user {
                      data {
                        id
                      }
                    }
                    sheirut {
                      data {
                        id
                      }
                    }
                  }
                }
              }
              askms(filters: { archived: { eq: false } }) {
                data {
                  id
                  attributes {
                    isSelfProposal
                    pendingMainVote
                    vots {
                      what
                      zman
                      why
                      id
                      users_permissions_user {
                        data {
                          id
                        }
                      }
                    }
                    timegrama {
                      data {
                        id
                        attributes {
                          date
                          done
                        }
                      }
                    }
                    nego_mashes(sort: "ordern:desc") {
                      data {
                        id
                        attributes {
                          ordern
                          proposedBy
                          status
                          name
                          descrip
                          spnot
                          easy
                          hm
                          price
                          kindOf
                          sqadualed
                          sqadualedf
                          linkto
                        }
                      }
                    }
                    createdAt
                    chat {
                      why
                      ide
                      what
                      zman
                      id
                      users_permissions_user {
                        data {
                          id
                        }
                      }
                    }
                    users_permissions_user {
                      data {
                        id
                        attributes {
                          username
                          profilePic {
                            data {
                              attributes {
                                url
                                formats
                              }
                            }
                          }
                        }
                      }
                    }
                    open_mashaabim {
                      data {
                        id
                        attributes {
                          price
                          descrip
                          spnot
                          kindOf
                          sqadualedf
                          sqadualed
                          linkto
                          createdAt
                          hm
                          name
                          easy
                          recurring
                          cycleSize
                        }
                      }
                    }
                    pmash {
                      data {
                        id
                        attributes {
                          name
                          descrip
                          spnot
                          price
                          easy
                          hm
                          kindOf
                          sqadualed
                          sqadualedf
                          recurring
                          cycleSize
                        }
                      }
                    }
                    sp {
                      data {
                        id
                        attributes {
                          name
                          descrip
                          price
                          myp
                          spnot
                          users_permissions_user {
                            data {
                              id
                              attributes {
                                username
                                profilePic {
                                  data {
                                    attributes {
                                      url
                                      formats
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
              asks(filters: { archived: { eq: false } }) {
                data {
                  id
                  attributes {
                    vots {
                      what
                      why
                      zman
                      order
                      id
                      users_permissions_user {
                        data {
                          id
                        }
                      }
                    }
                    timegrama {
                      data {
                        id
                        attributes {
                          date
                          done
                        }
                      }
                    }
                    negopendmissions(sort: "ordern:desc") {
                      data {
                        id
                        attributes {
                          ordern
                          proposedBy
                          status
                          name
                          descrip
                          hearotMeyuchadot
                          noofhours
                          perhour
                          date
                          dates
                          createdAt
                        }
                      }
                    }
                    createdAt
                    chat {
                      why
                      id
                      ide
                      what
                      zman
                      users_permissions_user {
                        data {
                          id
                        }
                      }
                    }
                    forums {
                      data {
                        id
                        attributes {
                          messages(pagination: { limit: 100 }) {
                            data {
                              id
                              attributes {
                                content
                                createdAt
                                users_permissions_user {
                                  data {
                                    id
                                    attributes {
                                      username
                                      profilePic {
                                        data {
                                          attributes {
                                            url
                                            formats
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                    open_mission {
                      data {
                        id
                        attributes {
                          acts {
                            data {
                              id
                              attributes {
                                shem
                                link
                                des
                                dateF
                                dateS
                              }
                            }
                          }
                          mission {
                            data {
                              id
                            }
                          }
                          negopendmissions(sort: "ordern:desc") {
                            data {
                              id
                              attributes {
                                name
                                hearotMeyuchadot
                                descrip
                                createdAt
                                ordern
                                proposedBy
                                noofhours
                                perhour
                                isOriginal
                                date
                                dates
                                isMonth
                                users_permissions_user {
                                  data {
                                    id
                                    attributes {
                                      username
                                    }
                                  }
                                }
                                skills {
                                  data {
                                    id
                                    attributes {
                                      skillName
                                      localizations {
                                        data {
                                          attributes {
                                            skillName
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                                tafkidims {
                                  data {
                                    id
                                    attributes {
                                      roleDescription
                                      localizations {
                                        data {
                                          attributes {
                                            roleDescription
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                                work_ways {
                                  data {
                                    id
                                    attributes {
                                      workWayName
                                      localizations {
                                        data {
                                          attributes {
                                            workWayName
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                                acts {
                                  data {
                                    id
                                    attributes {
                                      shem
                                      link
                                      des
                                      dateF
                                      dateS
                                    }
                                  }
                                }
                              }
                            }
                          }
                          declined {
                            data {
                              id
                            }
                          }
                          iskvua
                          isRishon
                          sqadualed
                          dates
                          publicklinks
                          skills {
                            data {
                              id
                              attributes {
                                skillName
                                localizations {
                                  data {
                                    attributes {
                                      skillName
                                    }
                                  }
                                }
                              }
                            }
                          }
                          work_ways {
                            data {
                              id
                              attributes {
                                workWayName
                                localizations {
                                  data {
                                    attributes {
                                      workWayName
                                    }
                                  }
                                }
                              }
                            }
                          }
                          tafkidims {
                            data {
                              id
                              attributes {
                                roleDescription
                                localizations {
                                  data {
                                    attributes {
                                      roleDescription
                                    }
                                  }
                                }
                              }
                            }
                          }
                          noofhours
                          perhour
                          privatlinks
                          descrip
                          hearotMeyuchadot
                          name
                        }
                      }
                    }
                    project {
                      data {
                        id
                      }
                    }
                    users_permissions_user {
                      data {
                        id
                        attributes {
                          username
                          skills {
                            data {
                              id
                              attributes {
                                skillName
                                localizations {
                                  data {
                                    attributes {
                                      skillName
                                    }
                                  }
                                }
                              }
                            }
                          }
                          work_ways {
                            data {
                              id
                              attributes {
                                workWayName
                                localizations {
                                  data {
                                    attributes {
                                      workWayName
                                    }
                                  }
                                }
                              }
                            }
                          }
                          tafkidims {
                            data {
                              id
                              attributes {
                                roleDescription
                                localizations {
                                  data {
                                    attributes {
                                      roleDescription
                                    }
                                  }
                                }
                              }
                            }
                          }
                          email
                          profilePic {
                            data {
                              attributes {
                                url
                                formats
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
              finiapruvals(filters: { archived: { eq: false } }) {
                data {
                  id
                  attributes {
                    timegrama {
                      data {
                        id
                        attributes {
                          date
                        }
                      }
                    }
                    missname
                    noofhours
                    why
                    what {
                      data {
                        id
                        attributes {
                          url
                          formats
                        }
                      }
                    }
                    mesimabetahalich {
                      data {
                        id
                        attributes {
                          perhour
                          hearotMeyuchadot
                          descrip
                          mission {
                            data {
                              id
                            }
                          }
                        }
                      }
                    }
                    vots {
                      what
                      why
                      id
                      users_permissions_user {
                        data {
                          id
                        }
                      }
                    }
                    project {
                      data {
                        id
                      }
                    }
                    users_permissions_user {
                      data {
                        id
                      }
                    }
                  }
                }
              }
              pendms(filters: { archived: { eq: false }, matanot_recipe_missions: { id: { null: true } } }) {
                data {
                  id
                  attributes {
                    name
                    createdAt
                    iskvua
                    hearotMeyuchadot
                    descrip
                    noofhours
                    perhour
                    sqadualed
                    privatlinks
                    publicklinks
                    dates
                    location {
                      location_mode
                      lat
                      lng
                      radius
                      location_hint
                    }
                    rishon {
                      data {
                        id
                      }
                    }
                    acts {
                      data {
                        id
                        attributes {
                          shem
                          link
                          des
                          dateF
                          dateS
                        }
                      }
                    }
                    negopendmissions(sort: "ordern:desc") {
                      data {
                        id
                        attributes {
                          name
                          hearotMeyuchadot
                          descrip
                          createdAt
                          ordern
                          proposedBy
                          noofhours
                          perhour
                          isOriginal
                          date
                          dates
                          isMonth
                          location {
                            location_mode
                            lat
                            lng
                            radius
                            location_hint
                          }
                          users_permissions_user {
                            data {
                              id
                              attributes {
                                username
                              }
                            }
                          }
                          skills {
                            data {
                              id
                              attributes {
                                skillName
                                localizations {
                                  data {
                                    attributes {
                                      skillName
                                    }
                                  }
                                }
                              }
                            }
                          }
                          tafkidims {
                            data {
                              id
                              attributes {
                                roleDescription
                                localizations {
                                  data {
                                    attributes {
                                      roleDescription
                                    }
                                  }
                                }
                              }
                            }
                          }
                          work_ways {
                            data {
                              id
                              attributes {
                                workWayName
                                localizations {
                                  data {
                                    attributes {
                                      workWayName
                                    }
                                  }
                                }
                              }
                            }
                          }
                          acts {
                            data {
                              id
                              attributes {
                                shem
                                link
                                des
                                dateF
                                dateS
                              }
                            }
                          }
                        }
                      }
                    }
                    skills {
                      data {
                        id
                        attributes {
                          skillName
                          localizations {
                            data {
                              attributes {
                                skillName
                              }
                            }
                          }
                        }
                      }
                    }
                    tafkidims {
                      data {
                        id
                        attributes {
                          roleDescription
                          localizations {
                            data {
                              attributes {
                                roleDescription
                              }
                            }
                          }
                        }
                      }
                    }
                    work_ways {
                      data {
                        id
                        attributes {
                          workWayName
                          localizations {
                            data {
                              attributes {
                                workWayName
                              }
                            }
                          }
                        }
                      }
                    }
                    mission {
                      data {
                        id
                      }
                    }
                    vallues {
                      data {
                        id
                      }
                    }
                    timegrama {
                      data {
                        id
                        attributes {
                          date
                        }
                      }
                    }
                    diun {
                      what
                      why
                      id
                      zman
                      order
                      users_permissions_user {
                        data {
                          id
                        }
                      }
                    }
                    users {
                      what
                      order
                      why
                      zman
                      id
                      users_permissions_user {
                        data {
                          id
                        }
                      }
                    }
                  }
                }
              }
              open_missions(filters: { archived: { eq: false } }) {
                data {
                  id
                  attributes {
                    declined {
                      data {
                        id
                      }
                    }
                    users {
                      data {
                        id
                      }
                    }
                  }
                }
              }
            }
          }
        }
        sheiruts {
          data {
            id
            attributes {
              project {
                data {
                  id
                  attributes {
                    projectName
                    user_1s {
                      data {
                        id
                        attributes {
                          username
                          profilePic {
                            data {
                              attributes {
                                url
                                formats
                              }
                            }
                          }
                        }
                      }
                    }
                    profilePic {
                      data {
                        attributes {
                          url
                          formats
                        }
                      }
                    }
                  }
                }
              }
              name
              descrip
              equaliSplited
              oneTime
              archived
              isApruved
              price
              quant
              startDate
              finnishDate
              total
              iGotIt
              iTransferMoney
              iGotMoney { iGotMoney users_permissions_user { data { id } } }
              moneyTransfered
              productExepted
              weFinnish {
                data {
                  id
                  attributes {
                    what
                    order
                    why
                    users_permissions_user {
                      data {
                        id
                      }
                    }
                  }
                }
              }
              iCanGetMonay {
                data {
                  id
                  attributes {
                    username
                    profilePic {
                      data {
                        attributes {
                          url
                          formats
                        }
                      }
                    }
                  }
                }
              }
              iTransferedTo {
                data {
                  id
                  attributes {
                    username
                    profilePic {
                      data {
                        attributes {
                          url
                          formats
                        }
                      }
                    }
                  }
                }
              }
              users_permissions_users {
                data {
                  id
                  attributes {
                    username
                    profilePic {
                      data {
                        attributes {
                          url
                          formats
                        }
                      }
                    }
                  }
                }
              }
              matanot {
                data {
                  id
                  attributes {
                    name
                    desc
                    price
                    quant
                    kindOf
                    pic {
                      data {
                        attributes {
                          url
                          formats
                        }
                      }
                    }
                  }
                }
              }
              forums {
                data {
                  id
                  attributes {
                    messages(pagination: { limit: 50 }) {
                      data {
                        id
                        attributes {
                          content
                          createdAt
                          users_permissions_user {
                            data {
                              id
                              attributes {
                                username
                                profilePic {
                                  data {
                                    attributes {
                                      url
                                      formats
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
              halukas(filters: { ushar: { eq: true } }) {
                data {
                  id
                  attributes {
                    senderconf
                    confirmed
                    amount
                    forum { data { id } }
                    usersend { data { id } }
                    userrecive {
                      data {
                        id
                        attributes {
                          username
                          profilePic { data { attributes { url formats } } }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}
`,
  '84levOpenMissionsQuery': `query LevOpenMissionsQuery($ids: [ID]) {
  openMissions(filters: { id: { in: $ids } }) {
    data {
      id
      attributes {
        project {
          data {
            id
            attributes {
              projectName
              restime
              timeToP
              user_1s {
                data {
                  id
                }
              }
              profilePic {
                data {
                  attributes {
                    url
                    formats
                  }
                }
              }
            }
          }
        }
        sqadualed
        acts {
          data {
            id
            attributes {
              shem
              des
            }
          }
        }
        tafkidims {
          data {
            attributes {
              roleDescription
              localizations {
                data {
                  attributes {
                    roleDescription
                  }
                }
              }
            }
          }
        }
        skills {
          data {
            attributes {
              skillName
              localizations {
                data {
                  attributes {
                    skillName
                  }
                }
              }
            }
          }
        }
        descrip
        hearotMeyuchadot
        name
        dates
        work_ways {
          data {
            attributes {
              workWayName
              localizations {
                data {
                  attributes {
                    workWayName
                  }
                }
              }
            }
          }
        }
        noofhours
        perhour
        source
        ratson {
          data {
            id
            attributes {
              name
              logo { data { attributes { url formats } } }
            }
          }
        }
      }
    }
  }
}
`,


  '86addVoteToSheirutpend_v2': `mutation CreateVote($sheirutpend: ID, $user: ID, $what: Boolean, $order: Int, $why: String) {
    createVote(data: { sheirutpend: $sheirutpend, users_permissions_user: $user, what: $what, order: $order, why: $why }) {
      data {
        id
      }
    }
  }`,
  '87createSheirut': `mutation CreateSheirut($data: SheirutInput!) {
    createSheirut(data: $data) {
      data {
        id
      }
    }
  }`,
  '88GetMissionTimersForRecalc': `query GetMissionTimers($missionId: ID!) {
        timers(filters: { mesimabetahalich: { id: { eq: $missionId } } }, pagination: { limit: -1 }) {
          data {
            id
            attributes {
              saved
              isActive
              timers {
                start
                stop
              }
            }
          }
        }
        mesimabetahalich(id: $missionId) {
          data {
            id
            attributes {
              name
              howmanyhoursalready
            }
          }
        }
      }`,
  '89getUsersCount': `query GetUsersCount {
    usersPermissionsUsers {
      meta {
        pagination {
          total
        }
      }
    }
  }`,
  '90myActsQuery': `query MyActs($idL: ID!) {
  usersPermissionsUser(id: $idL) {
    data {
      id
      attributes {
        mesimabetahaliches(
          filters: { forappruval: { eq: false }, finnished: { eq: false } }
        ) {
          data {
            id
            attributes {
              name
              project {
                data {
                  id
                  attributes {
                  projectName
                  }
                }
              }
              acts {
                data {
                  id
                  attributes {
                    shem
                    myIshur
                    link
                    hashivut
                    valiIshur
                    vali{data{id attributes{ username profilePic {data{attributes{ url }}}}}}
                    des
                    dateF
                    dateS
                    status
                    naasa
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`,
  '91createPartof': `mutation CreatePartof($default: Boolean) {
    createPartof(data: { default: $default }) {
      data {
        id
        attributes {
          default
        }
      }
    }
  }`,
  '92updateForumSubject': `mutation UpdateForumSubject($id: ID!, $subject: String!, $spec: ENUM_FORUM_SPEC, $done: Boolean) {
    updateForum(
      id: $id
      data: {
        subject: $subject
        spec: $spec
        done: $done
      }
    ) {
      data {
        id
        attributes {
          subject
          spec
          done
        }
      }
    }
  }`,
  '93updateOpenMissionPartofs': `mutation UpdateOpenMissionPartofs($id: ID!, $partofIds: [ID]) {
    updateOpenMission(id: $id, data: { partofs: $partofIds }) {
      data {
        id
        attributes {
          partofs { data { id } }
        }
      }
    }
  }`,
  '94updateOpenMashaabimPartofs': `mutation UpdateOpenMashaabimPartofs($id: ID!, $partofIds: [ID]) {
    updateOpenMashaabim(id: $id, data: { partofs: $partofIds }) {
      data {
        id
        attributes {
          partofs { data { id } }
        }
      }
    }
  }`,
  '95updateMesimabetahalichPartofs': `mutation UpdateMesimabetahalichPartofs($id: ID!, $partofIds: [ID]) {
    updateMesimabetahalich(id: $id, data: { partofs: $partofIds }) {
      data {
        id
        attributes {
          partofs { data { id } }
        }
      }
    }
  }`,
  '96updateMaapPartofs': `mutation UpdateMaapPartofs($id: ID!, $partofIds: [ID]) {
    updateMaap(id: $id, data: { partofs: $partofIds }) {
      data {
        id
        attributes {
          partofs { data { id } }
        }
      }
    }
  }`,
  '97getOpenMissionPartofs': `query GetOpenMissionPartofs($id: ID!) {
    openMission(id: $id) {
      data {
        id
        attributes {
          partofs {
            data {
              id
            }
          }
        }
      }
    }
  }`,
  '98getAskForums': `query GetAskForums($id: ID!) {
    ask(id: $id) {
      data {
        id
        attributes {
          forums {
            data {
              id
            }
          }
        }
      }
    }
  }`,
  '99updateAskForums': `mutation UpdateAskForums($id: ID!, $forumIds: [ID]) {
    updateAsk(id: $id, data: { forums: $forumIds }) {
      data {
        id
        attributes {
          forums { data { id } }
        }
      }
    }
  }`,
  '100getMesimabetahalichForums': `query GetMesimabetahalichForums($id: ID!) {
    mesimabetahalich(id: $id) {
      data {
        id
        attributes {
          forums {
            data {
              id
            }
          }
        }
      }
    }
  }`,
  '101updateMesimabetahalichForums': `mutation UpdateMesimabetahalichForums($id: ID!, $forumIds: [ID]) {
    updateMesimabetahalich(id: $id, data: { forums: $forumIds }) {
      data {
        id
        attributes {
          forums { data { id } }
        }
      }
    }
  }`,
  '102projectProcessesQuery': `query ProjectProcessesQuery($projectId: ID!) {
    project(id: $projectId) {
      data {
        id
        attributes {
          projectName
          forums(sort: ["updatedAt:desc"]) {
            data {
              id
              attributes {
                subject
                spec
                done
                updatedAt
                messages(sort: ["when:asc"]) {
                  data {
                    id
                    attributes {
                      content
                      when
                      users_permissions_user {
                        data {
                          id
                          attributes {
                            username
                            profilePic {
                              data {
                                attributes {
                                  url
                                  formats
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          pendms(filters: { archived: { ne: true } }) {
            data {
              id
              attributes {
                name
                descrip
                hearotMeyuchadot
                createdAt
                noofhours
                perhour
                users {
                  what
                  ide
                  zman
                  users_permissions_user {
                    data {
                      id
                      attributes {
                        username
                      }
                    }
                  }
                }
              }
            }
          }
          pmashes(filters: { archived: { ne: true } }) {
            data {
              id
              attributes {
                name
                descrip
                spnot
                createdAt
                hm
                price
                easy
                kindOf
                users {
                  what
                  ide
                  zman
                  users_permissions_user {
                    data {
                      id
                      attributes {
                        username
                      }
                    }
                  }
                }
              }
            }
          }
          open_missions(filters: { archived: { ne: true } }) {
            data {
              id
              attributes {
                name
                descrip
                hearotMeyuchadot
                createdAt
                noofhours
                perhour
                partofs { data { id } }
                asks(filters: { archived: { ne: true } }) {
                  data {
                    id
                    attributes {
                      createdAt
                      forums { data { id } }
                      users_permissions_user {
                        data {
                          id
                          attributes {
                            username
                          }
                        }
                      }
                      vots {
                        what
                        users_permissions_user {
                          data { id }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
          open_mashaabims(filters: { archived: { ne: true } }) {
            data {
              id
              attributes {
                name
                descrip
                spnot
                createdAt
                price
                easy
                hm
                kindOf
                partofs { data { id } }
                askms(filters: { archived: { ne: true } }) {
                  data {
                    id
                    attributes {
                      createdAt
                      users_permissions_user {
                        data {
                          id
                          attributes {
                            username
                          }
                        }
                      }
                      vots {
                        what
                        users_permissions_user {
                          data { id }
                        }
                      }
                    }
                  }
                }
                maap {
                  data {
                    id
                    attributes {
                      createdAt
                      vots {
                        what
                        users_permissions_user {
                          data { id }
                        }
                      }
                    }
                  }
                }
                rikmashes {
                  data {
                    id
                    attributes {
                      createdAt
                      total
                      name
                    }
                  }
                }
              }
            }
          }
          mesimabetahaliches(filters: { finnished: { ne: true } }) {
            data {
              id
              attributes {
                name
                descrip
                createdAt
                hoursassinged
                howmanyhoursalready
                perhour
                partofs { data { id } }
                forums { data { id } }
                users_permissions_user {
                  data {
                    id
                    attributes {
                      username
                    }
                  }
                }
                finiapruvals {
                  data {
                    id
                    attributes {
                      createdAt
                      missname
                      noofhours
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }`,
  '102getMesimabetahalichForFinish': `query GetMesimabetahalichForFinish($id: ID!) {
    mesimabetahalich(id: $id) {
      data {
        id
        attributes {
          name
          descrip
          howmanyhoursalready
          hoursassinged
          perhour
          project {
            data {
              id
              attributes {
                projectName
                restime
                profilePic {
                  data {
                    attributes {
                      url
                      formats
                    }
                  }
                }
                user_1s {
                  data {
                    id
                  }
                }
              }
            }
          }
          mission {
            data {
              id
            }
          }
          users_permissions_user {
            data {
              id
            }
          }
          activeTimer {
            data {
              id
              attributes {
                isActive
              }
            }
          }
        }
      }
    }
  }`,
  '103createFinnishedMission': `mutation CreateFinnishedMission(
    $missionName: String,
    $why: String,
    $what: [ID],
    $noofhours: Float,
    $mesimabetahalich: ID,
    $perhour: Float,
    $total: Float,
    $project: ID,
    $descrip: String,
    $users_permissions_user: ID,
    $publishedAt: DateTime,
    $mission: ID
  ) {
    createFinnishedMission(
      data: {
        missionName: $missionName,
        why: $why,
        what: $what,
        noofhours: $noofhours,
        mesimabetahalich: $mesimabetahalich,
        perhour: $perhour,
        total: $total,
        project: $project,
        descrip: $descrip,
        users_permissions_user: $users_permissions_user,
        publishedAt: $publishedAt,
        mission: $mission
      }
    ) {
      data {
        id
      }
    }
  }`,
  '104createFiniapruval': `mutation CreateFiniapruval(
    $missname: String,
    $what: [ID],
    $why: String,
    $noofhours: Float,
    $mesimabetahalich: ID,
    $project: ID,
    $publishedAt: DateTime,
    $users_permissions_user: ID,
    $vots: [ComponentProjectsVotsInput]
  ) {
    createFiniapruval(
      data: {
        missname: $missname,
        what: $what,
        why: $why,
        noofhours: $noofhours,
        mesimabetahalich: $mesimabetahalich,
        project: $project,
        publishedAt: $publishedAt,
        users_permissions_user: $users_permissions_user,
        vots: $vots
      }
    ) {
      data {
        id
      }
    }
  }`,
  '105updateMesimabetahalichForFinish': `mutation UpdateMesimabetahalichForFinish(
    $id: ID!,
    $finnished: Boolean,
    $forappruval: Boolean
  ) {
    updateMesimabetahalich(
      id: $id,
      data: {
        finnished: $finnished,
        forappruval: $forappruval
      }
    ) {
      data {
        id
        attributes {
          finnished
          forappruval
          howmanyhoursalready
        }
      }
    }
  }`,

  '110getMissionForTimerSave': `query GetMissionForTimerSave($mId: ID!) {
    mesimabetahalich(id: $mId) {
      data {
        id
        attributes {
          name
          perhour
          howmanyhoursalready
          totalHoursSaved
          iskvua
          hoursassinged
          users_permissions_user { data { id } }
          mission { data { id } }
          project {
            data {
              id
              attributes {
                restime
                user_1s { data { id } }
              }
            }
          }
          finnished_missions(filters: { isNotFinished: { eq: true } }) {
            data { id attributes { noofhours perhour } }
          }
        }
      }
    }
  }`,

  '111createFiniapruvalForTimer': `mutation CreateFiniapruvalForTimer(
    $missname: String,
    $noofhours: Float,
    $mesimabetahalich: ID,
    $project: ID,
    $publishedAt: DateTime,
    $users_permissions_user: ID,
    $vots: [ComponentProjectsVotsInput],
    $timer: ID,
    $month: Date
  ) {
    createFiniapruval(
      data: {
        missname: $missname,
        noofhours: $noofhours,
        mesimabetahalich: $mesimabetahalich,
        project: $project,
        publishedAt: $publishedAt,
        users_permissions_user: $users_permissions_user,
        vots: $vots,
        isTimerSave: true,
        timer: $timer,
        month: $month
      }
    ) { data { id } }
  }`,

  '112updateMissionMonthlyHours': `mutation UpdateMissionMonthlyHours(
    $id: ID!,
    $howmanyhoursalready: Float,
    $stname: String
  ) {
    updateMesimabetahalich(
      id: $id,
      data: {
        howmanyhoursalready: $howmanyhoursalready,
        activeTimer: null,
        stname: $stname,
        timer: 0
      }
    ) { data { id attributes { howmanyhoursalready stname } } }
  }`,

  '113createFinnishedMissionForTimerSave': `mutation CreateFinnishedMissionForTimerSave(
    $missionName: String,
    $noofhours: Float,
    $mesimabetahalich: ID,
    $mission: ID,
    $project: ID,
    $publishedAt: DateTime,
    $users_permissions_user: ID,
    $perhour: Float,
    $total: Float,
    $why: String
  ) {
    createFinnishedMission(
      data: {
        missionName: $missionName,
        noofhours: $noofhours,
        mesimabetahalich: $mesimabetahalich,
        mission: $mission,
        project: $project,
        publishedAt: $publishedAt,
        users_permissions_user: $users_permissions_user,
        perhour: $perhour,
        total: $total,
        isNotFinished: true,
        isFinished: false,
        why: $why
      }
    ) { data { id } }
  }`,

  '114updateFinnishedMissionHours': `mutation UpdateFinnishedMissionHours(
    $id: ID!,
    $noofhours: Float!,
    $total: Float!
  ) {
    updateFinnishedMission(
      id: $id,
      data: { noofhours: $noofhours, total: $total }
    ) { data { id attributes { noofhours total } } }
  }`,

  '115updateMissionTotalHoursSaved': `mutation UpdateMissionTotalHoursSaved(
    $id: ID!,
    $totalHoursSaved: Float!
  ) {
    updateMesimabetahalich(
      id: $id,
      data: { totalHoursSaved: $totalHoursSaved }
    ) { data { id attributes { totalHoursSaved } } }
  }`,

  '116monthlyReset': `mutation MonthlyReset(
    $id: ID!,
    $monter: [ComponentNewMonterInput],
    $howmanyhoursalready: Float
  ) {
    updateMesimabetahalich(
      id: $id,
      data: { monter: $monter, howmanyhoursalready: $howmanyhoursalready }
    ) { data { id } }
  }`,

  '118updateFiniapruvalVots': `mutation UpdateFiniapruvalVots(
    $id: ID!,
    $vots: [ComponentProjectsVotsInput],
    $archived: Boolean
  ) {
    updateFiniapruval(id: $id, data: { vots: $vots, archived: $archived }) {
      data { id }
    }
  }`,

  '119createFinnishedMissionFinal': `mutation CreateFinnishedMissionFinal(
    $missionName: String,
    $why: String,
    $noofhours: Float,
    $mesimabetahalich: ID,
    $perhour: Float,
    $total: Float,
    $project: ID,
    $mission: ID,
    $users_permissions_user: ID,
    $publishedAt: DateTime,
    $finiapruvals: [ID]
  ) {
    createFinnishedMission(data: {
      missionName: $missionName,
      why: $why,
      noofhours: $noofhours,
      mesimabetahalich: $mesimabetahalich,
      perhour: $perhour,
      total: $total,
      project: $project,
      mission: $mission,
      users_permissions_user: $users_permissions_user,
      isFinished: true,
      finiapruvals: $finiapruvals,
      publishedAt: $publishedAt
    }) { data { id } }
  }`,

  '117getFiniapruvalForClose': `query GetFiniapruvalForClose($id: ID!) {
    finiapruval(id: $id) {
      data {
        id
        attributes {
          archived
          isTimerSave
          noofhours
          missname
          why
          iskvua
          month
          vots { what users_permissions_user { data { id } } }
          mesimabetahalich {
            data {
              id
              attributes {
                perhour
                totalHoursSaved
                mission { data { id } }
                project { data { id attributes { user_1s { data { id } } } } }
                finnished_missions(filters: { isNotFinished: { eq: true } }) {
                  data { id attributes { noofhours perhour } }
                }
              }
            }
          }
          project { data { id } }
          users_permissions_user { data { id } }
          what { data { id } }
          timer { data { id } }
        }
      }
    }
  }`,

  '120addVoteToAsk': `mutation AddVoteToAsk($askId: ID!, $vots: [ComponentProjectsVotsInput]) {
    updateAsk(id: $askId, data: { vots: $vots }) {
      data {
        id
      }
    }
  }`,

  '121addVoteToDecision': `mutation AddVoteToDecision($decisionId: ID!, $vots: [ComponentProjectsVotsInput]) {
    updateDecision(id: $decisionId, data: { vots: $vots }) {
      data {
        id
      }
    }
  }`,

  '122addWeFinnishVote': `mutation CreateWeFinnishVote($sheirut: ID, $user: ID) {
    createVote(data: { sheirut: $sheirut, users_permissions_user: $user, what: true }) {
      data {
        id
      }
    }
  }`,
  '123dealsForUser': `query DealsForUser($idL: ID!) {
    usersPermissionsUser(id: $idL) {
      data {
        id
        attributes {
          username
          profilePic { data { attributes { url formats } } }
          sheiruts {
            data {
              id
              attributes {
                name descrip equaliSplited oneTime archived isApruved
                price quant total startDate finnishDate
                iGotIt iTransferMoney moneyTransfered productExepted
                iGotMoney { iGotMoney users_permissions_user { data { id } } }
                weFinnish {
                  data { id attributes { what order why users_permissions_user { data { id } } } }
                }
                iCanGetMonay {
                  data { id attributes { username profilePic { data { attributes { url formats } } } } }
                }
                iTransferedTo {
                  data { id attributes { username profilePic { data { attributes { url formats } } } } }
                }
                users_permissions_users {
                  data { id attributes { username profilePic { data { attributes { url formats } } } } }
                }
                matanot {
                  data { id attributes { name desc price quant kindOf pic { data { attributes { url formats } } } } }
                }
                forums {
                  data {
                    id
                    attributes {
                      messages(pagination: { limit: 50 }) {
                        data {
                          id
                          attributes {
                            content createdAt
                            users_permissions_user {
                              data { id attributes { username profilePic { data { attributes { url formats } } } } }
                            }
                          }
                        }
                      }
                    }
                  }
                }
                halukas(filters: { ushar: { eq: true } }) {
                  data {
                    id
                    attributes {
                      senderconf confirmed amount
                      forum { data { id } }
                      usersend { data { id } }
                      userrecive { data { id attributes { username profilePic { data { attributes { url formats } } } } } }
                    }
                  }
                }
                project {
                  data {
                    id
                    attributes {
                      projectName
                      profilePic { data { attributes { url formats } } }
                      user_1s {
                        data { id attributes { username profilePic { data { attributes { url formats } } } } }
                      }
                    }
                  }
                }
              }
            }
          }
          sheirutpends(filters: { archived: { eq: false } }) {
            data {
              id
              attributes {
                price quant total startDate finnishDate createdAt
                conditional
                maagad_offer { data { id attributes { title status_offer } } }
                forum { data { id } }
                ratson_proposal {
                  data {
                    id
                    attributes {
                      kind
                      ratson { data { id attributes { name } } }
                    }
                  }
                }
                matanots {
                  data {
                    id
                    attributes {
                      name kindOf pricingMode estimatedPrice marginPct
                      pic { data { attributes { url } } }
                      matanot_recipe_missions {
                        data { id attributes { hoursPerUnit unitsPerProduct ratePerHour mode notes
                          pendm { data { id attributes { name } } }
                          mesimabetahalich { data { id attributes { name } } }
                        } }
                      }
                      matanot_recipe_resources {
                        data { id attributes { quantityPerUnit pricePerUnit kindOf mode notes
                          pmash { data { id attributes { name } } }
                          mashabetahalich { data { id attributes { name pricePerUnit kindOf } } }
                        } }
                      }
                    }
                  }
                }
                project {
                  data { id attributes { projectName profilePic { data { attributes { url } } } } }
                }
              }
            }
          }
          projects_1s {
            data {
              id
              attributes {
                projectName
                profilePic { data { attributes { url formats } } }
                user_1s {
                  data { id attributes { username profilePic { data { attributes { url formats } } } } }
                }
                sheiruts {
                  data {
                    id
                    attributes {
                      name descrip equaliSplited oneTime archived isApruved
                      price quant total startDate finnishDate
                      iGotIt iTransferMoney moneyTransfered productExepted
                      iGotMoney { iGotMoney users_permissions_user { data { id } } }
                      weFinnish {
                        data { id attributes { what order why users_permissions_user { data { id } } } }
                      }
                      iCanGetMonay {
                        data { id attributes { username profilePic { data { attributes { url formats } } } } }
                      }
                      iTransferedTo {
                        data { id attributes { username profilePic { data { attributes { url formats } } } } }
                      }
                      users_permissions_users {
                        data { id attributes { username profilePic { data { attributes { url formats } } } } }
                      }
                      matanot {
                        data { id attributes { name desc price quant kindOf pic { data { attributes { url formats } } } } }
                      }
                      forums {
                        data {
                          id
                          attributes {
                            messages(pagination: { limit: 50 }) {
                              data {
                                id
                                attributes {
                                  content createdAt
                                  users_permissions_user {
                                    data { id attributes { username profilePic { data { attributes { url formats } } } } }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                      halukas(filters: { ushar: { eq: true } }) {
                        data {
                          id
                          attributes {
                            senderconf confirmed amount
                            forum { data { id } }
                            usersend { data { id } }
                            userrecive { data { id attributes { username profilePic { data { attributes { url formats } } } } } }
                          }
                        }
                      }
                    }
                  }
                }
                sheirutpends(filters: { archived: { eq: false } }) {
                  data {
                    id
                    attributes {
                      price quant total startDate finnishDate createdAt
                      conditional
                      maagad_offer { data { id attributes { title status_offer } } }
                      forum { data { id } }
                      ratson_proposal {
                        data {
                          id
                          attributes {
                            kind
                            ratson { data { id attributes { name } } }
                          }
                        }
                      }
                      matanots {
                        data {
                          id
                          attributes {
                            name kindOf pricingMode estimatedPrice marginPct
                            pic { data { attributes { url } } }
                            matanot_recipe_missions {
                              data { id attributes { hoursPerUnit unitsPerProduct ratePerHour mode notes
                                pendm { data { id attributes { name } } }
                                mesimabetahalich { data { id attributes { name } } }
                              } }
                            }
                            matanot_recipe_resources {
                              data { id attributes { quantityPerUnit pricePerUnit kindOf mode notes
                                pmash { data { id attributes { name } } }
                                mashabetahalich { data { id attributes { name pricePerUnit kindOf } } }
                              } }
                            }
                          }
                        }
                      }
                      users_permissions_user {
                        data { id attributes { username profilePic { data { attributes { url } } } } }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }`,
  '125userPendingForMatanot': `query UserPendingForMatanot($uid: ID!, $matId: ID!) {
    sheirutpends(filters: {
      users_permissions_user: { id: { eq: $uid } },
      matanots: { id: { in: [$matId] } },
      archived: { eq: false }
    }) {
      data {
        id
        attributes {
          price quant total startDate finnishDate createdAt
          project { data { id attributes { projectName } } }
        }
      }
    }
  }`,
  '124sheirutForDeal': `query SheirutForDeal($id: ID!) {
    sheirut(id: $id) {
      data {
        id
        attributes {
          name descrip equaliSplited oneTime archived isApruved
          price quant total startDate finnishDate
          iGotIt iTransferMoney moneyTransfered productExepted
          iGotMoney { iGotMoney users_permissions_user { data { id } } }
          weFinnish {
            data { id attributes { what order why users_permissions_user { data { id } } } }
          }
          iCanGetMonay {
            data { id attributes { username profilePic { data { attributes { url formats } } } } }
          }
          iTransferedTo {
            data { id attributes { username profilePic { data { attributes { url formats } } } } }
          }
          users_permissions_users {
            data { id attributes { username profilePic { data { attributes { url formats } } } } }
          }
          matanot {
            data { id attributes { name desc price quant kindOf pic { data { attributes { url formats } } } } }
          }
          forums {
            data {
              id
              attributes {
                messages(pagination: { limit: 50 }) {
                  data {
                    id
                    attributes {
                      content createdAt
                      users_permissions_user {
                        data { id attributes { username profilePic { data { attributes { url formats } } } } }
                      }
                    }
                  }
                }
              }
            }
          }
          halukas(filters: { ushar: { eq: true } }) {
            data {
              id
              attributes {
                senderconf confirmed amount
                forum { data { id } }
                usersend { data { id } }
                userrecive { data { id attributes { username profilePic { data { attributes { url formats } } } } } }
              }
            }
          }
          project {
            data {
              id
              attributes {
                projectName
                profilePic { data { attributes { url formats } } }
                user_1s {
                  data { id attributes { username profilePic { data { attributes { url formats } } } } }
                }
              }
            }
          }
        }
      }
    }
  }`,

  '125createMatanotRecipeMission': `mutation CreateMatanotRecipeMission(
    $matanot: ID!,
    $pendm: ID,
    $mesimabetahalich: ID,
    $hoursPerUnit: Float!,
    $unitsPerProduct: Float,
    $ratePerHour: Float,
    $mode: ENUM_MATANOTRECIPEMISSION_MODE,
    $notes: String,
    $partof: ID,
    $assignedMember: ID,
    $publishedAt: DateTime
  ) {
    createMatanotRecipeMission(data: {
      matanot: $matanot,
      pendm: $pendm,
      mesimabetahalich: $mesimabetahalich,
      hoursPerUnit: $hoursPerUnit,
      unitsPerProduct: $unitsPerProduct,
      ratePerHour: $ratePerHour,
      mode: $mode,
      notes: $notes,
      partof: $partof,
      assignedMember: $assignedMember,
      publishedAt: $publishedAt
    }) {
      data { id attributes { hoursPerUnit unitsPerProduct mode } }
    }
  }`,

  '126updateMatanotRecipeMission': `mutation UpdateMatanotRecipeMission(
    $id: ID!,
    $hoursPerUnit: Float,
    $unitsPerProduct: Float,
    $ratePerHour: Float,
    $mode: ENUM_MATANOTRECIPEMISSION_MODE,
    $notes: String,
    $mesimabetahalich: ID
  ) {
    updateMatanotRecipeMission(id: $id, data: {
      hoursPerUnit: $hoursPerUnit,
      unitsPerProduct: $unitsPerProduct,
      ratePerHour: $ratePerHour,
      mode: $mode,
      notes: $notes,
      mesimabetahalich: $mesimabetahalich
    }) {
      data { id attributes { hoursPerUnit unitsPerProduct mode } }
    }
  }`,

  '127deleteMatanotRecipeMission': `mutation DeleteMatanotRecipeMission($id: ID!) {
    deleteMatanotRecipeMission(id: $id) {
      data { id }
    }
  }`,

  '128createMatanotRecipeResource': `mutation CreateMatanotRecipeResource(
    $matanot: ID!,
    $pmash: ID,
    $mashabetahalich: ID,
    $quantityPerUnit: Float!,
    $pricePerUnit: Float,
    $kindOf: ENUM_MATANOTRECIPERESOURCE_KINDOF,
    $mode: ENUM_MATANOTRECIPERESOURCE_MODE,
    $notes: String,
    $assignedMember: ID,
    $publishedAt: DateTime
  ) {
    createMatanotRecipeResource(data: {
      matanot: $matanot,
      pmash: $pmash,
      mashabetahalich: $mashabetahalich,
      quantityPerUnit: $quantityPerUnit,
      pricePerUnit: $pricePerUnit,
      kindOf: $kindOf,
      mode: $mode,
      notes: $notes,
      assignedMember: $assignedMember,
      publishedAt: $publishedAt
    }) {
      data { id attributes { quantityPerUnit pricePerUnit mode } }
    }
  }`,

  '129updateMatanotRecipeResource': `mutation UpdateMatanotRecipeResource(
    $id: ID!,
    $quantityPerUnit: Float,
    $pricePerUnit: Float,
    $mode: ENUM_MATANOTRECIPERESOURCE_MODE,
    $notes: String,
    $pmash: ID,
    $mashabetahalich: ID
  ) {
    updateMatanotRecipeResource(id: $id, data: {
      quantityPerUnit: $quantityPerUnit,
      pricePerUnit: $pricePerUnit,
      mode: $mode,
      notes: $notes,
      pmash: $pmash,
      mashabetahalich: $mashabetahalich
    }) {
      data { id attributes { quantityPerUnit pricePerUnit mode } }
    }
  }`,

  '130deleteMatanotRecipeResource': `mutation DeleteMatanotRecipeResource($id: ID!) {
    deleteMatanotRecipeResource(id: $id) {
      data { id }
    }
  }`,

  '131createSheirutFulfillment': `mutation CreateSheirutFulfillment(
    $sheirut: ID!,
    $matanot: ID!,
    $quantity: Float!,
    $process: ID,
    $agreedPrice: Float,
    $status_process: ENUM_SHEIRUTFULFILLMENT_STATUS_PROCESS,
    $publishedAt: DateTime
  ) {
    createSheirutFulfillment(data: {
      sheirut: $sheirut,
      matanot: $matanot,
      quantity: $quantity,
      process: $process,
      agreedPrice: $agreedPrice,
      status_process: $status_process,
      publishedAt: $publishedAt
    }) {
      data {
        id
        attributes { quantity agreedPrice status_process }
      }
    }
  }`,

  '132updateSheirutFulfillment': `mutation UpdateSheirutFulfillment(
    $id: ID!,
    $agreedPrice: Float,
    $status_process: ENUM_SHEIRUTFULFILLMENT_STATUS_PROCESS,
    $createdMissions: ID,
    $createdMaaps: ID,
    $createdPmashes: ID
  ) {
    updateSheirutFulfillment(id: $id, data: {
      agreedPrice: $agreedPrice,
      status_process: $status_process,
      createdMissions: $createdMissions,
      createdMaaps: $createdMaaps,
      createdPmashes: $createdPmashes
    }) {
      data { id attributes { agreedPrice status_process } }
    }
  }`,

  '133queryComplexMatanot': `query QueryComplexMatanot($id: ID!) {
    matanot(id: $id) {
      data {
        id
        attributes {
          name desc price quant kindOf
          pricingMode marginPct estimatedPrice currency
          status_of_voting appruved
          pic { data { attributes { url formats } } }
          projectcreates { data { id attributes { projectName } } }
          process {
            data {
              id
              attributes {
                forums { data { id attributes { subject spec } } }
              }
            }
          }
          matanot_recipe_missions {
            data {
              id
              attributes {
                hoursPerUnit unitsPerProduct ratePerHour mode notes
                pendm { data { id attributes { name descrip } } }
                mesimabetahalich {
                  data {
                    id
                    attributes { name howmanyhoursalready hoursassinged status }
                  }
                }
                partof { data { id } }
              }
            }
          }
          matanot_recipe_resources {
            data {
              id
              attributes {
                quantityPerUnit pricePerUnit kindOf mode notes
                pmash { data { id attributes { name } } }
                mashabetahalich {
                  data {
                    id
                    attributes { name 
                        pricePerUnit
                        kindOf
                        descrip
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }`,

  '134updateMatanotStatus': `mutation UpdateMatanotStatus(
    $id: ID!,
    $status_of_voting: ENUM_MATANOT_STATUS_OF_VOTING,
    $pricingMode: ENUM_MATANOT_PRICINGMODE,
    $estimatedPrice: Float,
    $marginPct: Float,
    $process: ID
  ) {
    updateMatanot(id: $id, data: {
      status_of_voting: $status_of_voting,
      pricingMode: $pricingMode,
      estimatedPrice: $estimatedPrice,
      marginPct: $marginPct,
      process: $process
    }) {
      data {
        id
        attributes { status_of_voting pricingMode estimatedPrice marginPct }
      }
    }
  }`,

  '135approveMatanot': `mutation ApproveMatanot($id: ID!) {
    updateMatanot(id: $id, data: { status_of_voting: active, appruved: true }) {
      data {
        id
        attributes { status_of_voting appruved }
      }
    }
  }`,

  '136createMatanot': `mutation CreateMatanot(
    $projectcreates: ID!,
    $name: String!,
    $desc: JSON,
    $price: Float,
    $quant: Float,
    $kindOf: ENUM_MATANOT_KINDOF,
    $pic: ID,
    $startDate: DateTime,
    $finnishDate: DateTime,
    $oneForeProject: Boolean,
    $pricingMode: ENUM_MATANOT_PRICINGMODE,
    $marginPct: Float,
    $estimatedPrice: Float,
    $status_of_voting: ENUM_MATANOT_STATUS_OF_VOTING,
    $process: ID,
    $location: ComponentNewLocationInput,
    $publishedAt: DateTime
  ) {
    createMatanot(data: {
      projectcreates: [$projectcreates],
      name: $name,
      desc: $desc,
      price: $price,
      quant: $quant,
      kindOf: $kindOf,
      pic: $pic,
      startDate: $startDate,
      finnishDate: $finnishDate,
      oneForeProject: $oneForeProject,
      pricingMode: $pricingMode,
      marginPct: $marginPct,
      estimatedPrice: $estimatedPrice,
      status_of_voting: $status_of_voting,
      process: $process,
      location: $location,
      publishedAt: $publishedAt
    }) {
      data {
        id
        attributes {
          name desc price quant kindOf
          pricingMode marginPct estimatedPrice status_of_voting
          process { data { id } }
        }
      }
    }
  }`,

  '137createPendmForRecipe': `mutation CreatePendmForRecipe(
    $name: String,
    $project: ID,
    $perhour: Float,
    $noofhours: Float,
    $descrip: String,
    $publishedAt: DateTime
  ) {
    createPendm(data: {
      name: $name,
      project: $project,
      isglobal: true,
      perhour: $perhour,
      noofhours: $noofhours,
      descrip: $descrip,
      publishedAt: $publishedAt
    }) {
      data { id attributes { name isglobal perhour noofhours } }
    }
  }`,

  '138createPmashForRecipe': `mutation CreatePmashForRecipe(
    $name: String,
    $project: ID,
    $price: Float,
    $easy: Float,
    $hm: Float,
    $kindOf: ENUM_PMASH_KINDOF,
    $descrip: String,
    $publishedAt: DateTime
  ) {
    createPmash(data: {
      name: $name,
      project: $project,
      price: $price,
      easy: $easy,
      hm: $hm,
      kindOf: $kindOf,
      descrip: $descrip,
      publishedAt: $publishedAt
    }) {
      data { id attributes { name price hm kindOf } }
    }
  }`,

  '139createMesimabetahalich': `mutation CreateMesimabetahalich($data: MesimabetahalichInput!) {
    createMesimabetahalich(data: $data) { data { id } }
  }`,

  '140createAct': `mutation CreateAct($data: ActInput!) {
    createAct(data: $data) { data { id } }
  }`,

  '141createMaap': `mutation CreateMaap($data: MaapInput!) {
    createMaap(data: $data) { data { id } }
  }`,

  /* ─────────────────────────────────────────────────────────────────────
   * Concierge / Ratson — read-only queries (PLAN_CONCIERGE §2.5)
   * Schema additions in §2.1 (status_ratson, extracted_*, chat_forum,
   * process, derivedComplexMatanot, fulfillment_score, last_matched_at)
   * and entities ratson-proposal, ratson-match-job (§2.2 / §2.3).
   * ─────────────────────────────────────────────────────────────────── */

  '105queryRatsonWithProposals': `query QueryRatsonWithProposals($id: ID!) {
    ratson(id: $id) {
      data {
        id
        attributes {
          name
          desc
          longDes
          startDate
          finnishDate
          fulfilled
          allowJoin
          bounti
          totalbounti
          language
          age_group
          frequency
          isOnline
          lat
          lng
          radius
          location_hint
          sub_category
          access_mode
          ai_meta
          pinecone_id
          status_ratson
          fulfillment_score
          last_matched_at
          logo { data { attributes { url formats } } }
          users_permissions_users {
            data { id attributes { username } }
          }
          vallues { data { id attributes { valueName } } }
          categories { data { id attributes { name } } }
          missions { data { id attributes { missionName } } }
          mashaabims { data { id attributes { name } } }
          matanots { data { id attributes { name } } }
          extracted_missions {
            id
            name
            hoursEst
            importance
            notes
            missions { data { id attributes { missionName } } }
          }
          extracted_resources {
            id
            name
            kindOf
            quantityEst
            importance
            notes
            mashaabims { data { id attributes { name } } }
          }
          chat_forum { data { id } }
          process { data { id } }
          derivedComplexMatanot { data { id attributes { name } } }
        }
      }
    }
    ratsonProposals(
      filters: { ratson: { id: { eq: $id } } }
      sort: ["match_score:desc","createdAt:desc"]
      pagination: { limit: 50 }
    ) {
      data {
        id
        attributes {
          kind
          status_proposal
          match_score
          total_price
          auto_generated
          createdAt
          proposer_users {
            data { id attributes { username } }
          }
          project { data { id attributes { projectName } } }
          matanot { data { id attributes { name } } }
          matbea { data { id attributes { name simbol } } }
          forum { data { id } }
          negos { data { id } }
          open_mission { data { id } }
          covered_missions { id extracted_mission_idx hours price }
          covered_resources { id extracted_resource_idx quantity price }
        }
      }
    }
  }`,

  '106listMyRatsons': `query ListMyRatsons($uid: ID!) {
    ratsons(
      filters: { users_permissions_users: { id: { eq: $uid } } }
      sort: ["createdAt:desc"]
      pagination: { limit: 60 }
    ) {
      data {
        id
        attributes {
          name
          desc
          longDes
          startDate
          finnishDate
          fulfilled
          totalbounti
          access_mode
          status_ratson
          fulfillment_score
          last_matched_at
          createdAt
          vallues { data { id attributes { valueName } } }
          categories { data { id attributes { name } } }
          missions { data { id attributes { missionName } } }
          mashaabims { data { id attributes { name } } }
          extracted_missions { id name importance }
          extracted_resources { id name importance }
        }
      }
    }
  }`,

  '100updateRatson': `mutation UpdateRatson(
    $id: ID!,
    $name: String,
    $desc: String,
    $longDes: String,
    $startDate: DateTime,
    $finnishDate: DateTime,
    $fulfilled: Boolean,
    $allowJoin: Boolean,
    $bounti: Boolean,
    $totalbounti: Float,
    $logo: ID,
    $vallues: [ID],
    $categories: [ID],
    $missions: [ID],
    $mashaabims: [ID],
    $matanots: [ID],
    $matanots_offered: [ID],
    $users_permissions_users: [ID],
    $status_ratson: ENUM_RATSON_STATUS_RATSON,
    $access_mode: ENUM_RATSON_ACCESS_MODE,
    $sub_category: String,
    $language: String,
    $lat: Float,
    $lng: Float,
    $radius: Long,
    $location_hint: String,
    $frequency: String,
    $isOnline: Boolean,
    $age_group: String,
    $ai_meta: JSON,
    $pinecone_id: String,
    $fulfillment_score: Float,
    $last_matched_at: DateTime,
    $chat_forum: ID,
    $process: ID,
    $derivedComplexMatanot: ID,
    $extracted_missions: [ComponentNewExtractedMissionsInput],
    $extracted_resources: [ComponentNewExtractedResourcesInput]
  ) {
    updateRatson(
      id: $id,
      data: {
        name: $name,
        desc: $desc,
        longDes: $longDes,
        startDate: $startDate,
        finnishDate: $finnishDate,
        fulfilled: $fulfilled,
        allowJoin: $allowJoin,
        bounti: $bounti,
        totalbounti: $totalbounti,
        logo: $logo,
        vallues: $vallues,
        categories: $categories,
        missions: $missions,
        mashaabims: $mashaabims,
        matanots: $matanots,
        matanots_offered: $matanots_offered,
        users_permissions_users: $users_permissions_users,
        status_ratson: $status_ratson,
        access_mode: $access_mode,
        sub_category: $sub_category,
        language: $language,
        lat: $lat,
        lng: $lng,
        radius: $radius,
        location_hint: $location_hint,
        frequency: $frequency,
        isOnline: $isOnline,
        age_group: $age_group,
        ai_meta: $ai_meta,
        pinecone_id: $pinecone_id,
        fulfillment_score: $fulfillment_score,
        last_matched_at: $last_matched_at,
        chat_forum: $chat_forum,
        process: $process,
        derivedComplexMatanot: $derivedComplexMatanot,
        extracted_missions: $extracted_missions,
        extracted_resources: $extracted_resources
      }
    ) {
      data { id attributes { status_ratson fulfillment_score last_matched_at } }
    }
  }`,

  '101createRatsonProposal': `mutation CreateRatsonProposal(
    $ratson: ID!,
    $kind: ENUM_RATSONPROPOSAL_KIND,
    $status_proposal: ENUM_RATSONPROPOSAL_STATUS_PROPOSAL,
    $matanot: ID,
    $project: ID,
    $proposer_users: [ID],
    $total_price: Float,
    $matbea: ID,
    $forum: ID,
    $match_score: Float,
    $auto_generated: Boolean,
    $covered_missions: [ComponentNewCoveredMissionsInput],
    $covered_resources: [ComponentNewCoveredResourcesInput],
    $open_mission: ID,
    $publishedAt: DateTime
  ) {
    createRatsonProposal(
      data: {
        ratson: $ratson,
        kind: $kind,
        status_proposal: $status_proposal,
        matanot: $matanot,
        project: $project,
        proposer_users: $proposer_users,
        total_price: $total_price,
        matbea: $matbea,
        forum: $forum,
        match_score: $match_score,
        auto_generated: $auto_generated,
        covered_missions: $covered_missions,
        covered_resources: $covered_resources,
        open_mission: $open_mission,
        publishedAt: $publishedAt
      }
    ) {
      data { id attributes { status_proposal kind match_score } }
    }
  }`,

  '102updateRatsonProposal': `mutation UpdateRatsonProposal(
    $id: ID!,
    $kind: ENUM_RATSONPROPOSAL_KIND,
    $status_proposal: ENUM_RATSONPROPOSAL_STATUS_PROPOSAL,
    $matanot: ID,
    $project: ID,
    $proposer_users: [ID],
    $total_price: Float,
    $matbea: ID,
    $forum: ID,
    $match_score: Float,
    $auto_generated: Boolean,
    $covered_missions: [ComponentNewCoveredMissionsInput],
    $covered_resources: [ComponentNewCoveredResourcesInput],
    $negos: [ID]
  ) {
    updateRatsonProposal(
      id: $id,
      data: {
        kind: $kind,
        status_proposal: $status_proposal,
        matanot: $matanot,
        project: $project,
        proposer_users: $proposer_users,
        total_price: $total_price,
        matbea: $matbea,
        forum: $forum,
        match_score: $match_score,
        auto_generated: $auto_generated,
        covered_missions: $covered_missions,
        covered_resources: $covered_resources,
        negos: $negos
      }
    ) {
      data { id attributes { status_proposal match_score } }
    }
  }`,

  '107listRatsonsForProject': `query ListRatsonsForProject($projectId: ID!, $limit: Int) {
    ratsonProposals(
      filters: { project: { id: { eq: $projectId } } }
      sort: ["createdAt:desc"]
      pagination: { limit: $limit }
    ) {
      data {
        id
        attributes {
          status_proposal
          kind
          match_score
          createdAt
          ratson {
            data {
              id
              attributes {
                name
                longDes
                status_ratson
                totalbounti
                startDate
                finnishDate
                createdAt
                vallues { data { id attributes { valueName } } }
                categories { data { id attributes { name } } }
              }
            }
          }
        }
      }
    }
  }`,

  '108createRatsonMatchJob': `mutation CreateRatsonMatchJob(
    $ratson: ID!,
    $mode: ENUM_RATSONMATCHJOB_MODE,
    $started_at: DateTime,
    $finished_at: DateTime,
    $proposals_created: Int,
    $error: String,
    $publishedAt: DateTime
  ) {
    createRatsonMatchJob(
      data: {
        ratson: $ratson,
        mode: $mode,
        started_at: $started_at,
        finished_at: $finished_at,
        proposals_created: $proposals_created,
        error: $error,
        publishedAt: $publishedAt
      }
    ) {
      data { id attributes { mode proposals_created } }
    }
  }`,

  '110listCandidateMatanots': `query ListCandidateMatanots($limit: Int) {
    matanots(
      filters: {
        archived: { eq: false }
        status_of_voting: { eq: "active" }
      }
      pagination: { limit: $limit }
    ) {
      data {
        id
        attributes {
          name
          price
          estimatedPrice
          lat
          lng
          radius
          categories { data { id attributes { name } } }
          projectcreates {
            data {
              id
              attributes {
                projectName
                vallues { data { id attributes { valueName } } }
              }
            }
          }
        }
      }
    }
  }`,

  '109listOpenRatsons': `query ListOpenRatsons($limit: Int) {
    ratsons(
      filters: {
        fulfilled: { eq: false }
        status_ratson: { in: ["open", "matching", "negotiating"] }
      }
      sort: ["createdAt:desc"]
      pagination: { limit: $limit }
    ) {
      data {
        id
        attributes {
          name
          desc
          longDes
          startDate
          finnishDate
          totalbounti
          lat
          lng
          sub_category
          status_ratson
          createdAt
          users_permissions_users {
            data { id attributes { username } }
          }
          vallues { data { id attributes { valueName } } }
          categories { data { id attributes { name } } }
        }
      }
    }
  }`,

  /* ── Concierge: wish invitations addressed to me (PLAN_CONCIERGE §5) ──────────
   * Personal surface for `requestSuggestion` Track B: a wisher invited *this*
   * user to fill a need (proposer_users contains me). Track A (matanot service
   * requests) already surface as Sheirutpends in /deals "pending"; this is the
   * person/resource invitation that otherwise only lived as a /lev notification.
   */
  '111listMyWishInvitations': `query ListMyWishInvitations($uid: ID!, $limit: Int) {
    ratsonProposals(
      filters: {
        proposer_users: { id: { eq: $uid } }
        status_proposal: { in: ["suggested", "viewed"] }
      }
      sort: ["createdAt:desc"]
      pagination: { limit: $limit }
    ) {
      data {
        id
        attributes {
          status_proposal
          kind
          total_price
          createdAt
          forum { data { id } }
          covered_missions { id extracted_mission_idx hours price }
          covered_resources { id extracted_resource_idx quantity price }
          ratson {
            data {
              id
              attributes {
                name
                desc
                longDes
                status_ratson
                startDate
                finnishDate
                totalbounti
                chat_forum { data { id } }
                users_permissions_users {
                  data {
                    id
                    attributes {
                      username
                      profilePic { data { attributes { url } } }
                    }
                  }
                }
                vallues { data { id attributes { valueName } } }
                categories { data { id attributes { name } } }
              }
            }
          }
        }
      }
    }
  }`,

  /* ── Concierge: provider response → complex-matanot binding (PLAN_CONCIERGE §5.3) ──
   * 139 creates the wish's aggregator product WITHOUT a project (neutral, anchored
   * only to the wish's process) — the assembly-phase product per the two-phase model.
   * 112 records the provider's commitment on the proposal (willingness + status).
   */
  '139createWishMatanot': `mutation CreateWishMatanot(
    $name: String!,
    $desc: JSON,
    $pricingMode: ENUM_MATANOT_PRICINGMODE,
    $estimatedPrice: Float,
    $status_of_voting: ENUM_MATANOT_STATUS_OF_VOTING,
    $process: ID,
    $publishedAt: DateTime
  ) {
    createMatanot(data: {
      name: $name,
      desc: $desc,
      pricingMode: $pricingMode,
      estimatedPrice: $estimatedPrice,
      price: $estimatedPrice,
      status_of_voting: $status_of_voting,
      process: $process,
      publishedAt: $publishedAt
    }) {
      data { id attributes { name pricingMode status_of_voting } }
    }
  }`,

  '141listMyWeavesDetailed': `query ListMyWeavesDetailed($uid: ID!) {
    usersPermissionsUser(id: $uid) {
      data {
        attributes {
          projects_1s {
            data {
              id
              attributes {
                projectName
                restime
                profilePic { data { attributes { url } } }
                user_1s { data { id } }
              }
            }
          }
        }
      }
    }
  }`,

  '143assignRecipeMissionMember': `mutation AssignRecipeMissionMember($id: ID!, $assignedMember: ID) {
    updateMatanotRecipeMission(id: $id, data: { assignedMember: $assignedMember }) {
      data { id attributes { mode } }
    }
  }`,

  '144assignRecipeResourceMember': `mutation AssignRecipeResourceMember($id: ID!, $assignedMember: ID) {
    updateMatanotRecipeResource(id: $id, data: { assignedMember: $assignedMember }) {
      data { id attributes { mode } }
    }
  }`,

  /* ── Concierge: materialize phase (PLAN_CONCIERGE §5.3 phase 2 / M7) ────────
   * 166 creates the dedicated partner weave (providers = members; the customer
   * is the *client* of the resulting Sheirut, NOT a member). 167 hosts the
   * composed product on that weave and activates it. 168 reads the BOM lines
   * with their assignedMember so the action can verify readiness + collect the
   * providers before producing the deal via the existing createSheirutFromPending.
   */
  '166crWishWeave': `mutation CrWishWeave($members: [ID], $projectName: String!, $descripFor: String, $publishedAt: DateTime, $isOt: Boolean) {
    createProject(data: {
      user_1s: $members,
      projectName: $projectName,
      descripFor: $descripFor,
      isOt: $isOt,
      publishedAt: $publishedAt
    }) {
      data { id attributes { projectName } }
    }
  }`,

  '167hostWishMatanot': `mutation HostWishMatanot($id: ID!, $projectcreates: ID!, $publishedAt: DateTime) {
    updateMatanot(id: $id, data: {
      projectcreates: [$projectcreates],
      status_of_voting: active,
      publishedAt: $publishedAt
    }) {
      data { id attributes { status_of_voting } }
    }
  }`,

  '168wishRecipeForMaterialize': `query WishRecipeForMaterialize($id: ID!) {
    matanot(id: $id) {
      data {
        id
        attributes {
          name
          pricingMode
          estimatedPrice
          matanot_recipe_missions {
            data {
              id
              attributes {
                hoursPerUnit
                unitsPerProduct
                ratePerHour
                mode
                notes
                assignedMember { data { id } }
                pendm { data { id attributes { name descrip } } }
              }
            }
          }
          matanot_recipe_resources {
            data {
              id
              attributes {
                quantityPerUnit
                pricePerUnit
                kindOf
                mode
                notes
                assignedMember { data { id } }
                pmash { data { id attributes { name descrip } } }
              }
            }
          }
        }
      }
    }
  }`,

  /* ── Weave creation (baci.svelte "יצירת ריקמה") ────────────────────────────
   * Reusable project-creation flow moved server-side so the JWT stays in the
   * HttpOnly cookie. `baciFormData` feeds the create form (vallue options +
   * existing project names for the uniqueness check). `crVallue` mints any
   * vallue the user typed that doesn't exist yet. `crWeaveFull` creates the
   * project itself with all the form fields (creator = sole member). */
  'baciFormData': `query BaciFormData {
    vallues(sort: "valueName:asc") {
      data { id attributes { valueName localizations { data { attributes { valueName } } } } }
    }
    projects { data { attributes { projectName } } }
  }`,

  'crVallue': `mutation CrVallue($valueName: String!, $publishedAt: DateTime) {
    createVallue(data: { valueName: $valueName, publishedAt: $publishedAt }) {
      data { id attributes { valueName } }
    }
  }`,

  'crWeaveFull': `mutation CrWeaveFull(
    $members: [ID],
    $projectName: String!,
    $publicDescription: String,
    $descripFor: String,
    $linkToWebsite: String,
    $vallues: [ID],
    $restime: ENUM_PROJECT_RESTIME,
    $timeToP: ENUM_PROJECT_TIMETOP,
    $profilePic: ID,
    $isOt: Boolean,
    $publishedAt: DateTime
  ) {
    createProject(data: {
      user_1s: $members,
      projectName: $projectName,
      publicDescription: $publicDescription,
      descripFor: $descripFor,
      linkToWebsite: $linkToWebsite,
      vallues: $vallues,
      restime: $restime,
      timeToP: $timeToP,
      profilePic: $profilePic,
      isOt: $isOt,
      publishedAt: $publishedAt
    }) {
      data { id attributes { projectName } }
    }
  }`,

  /* ── Concierge: publish a wish need to the community lev feed (PLAN_CONCIERGE
   * §5.2). 169/170 create a project-LESS open-mission / open-mashaabim linked to
   * the source wish (ratson) with source='concierge'. They surface to matching
   * users through the existing skill/role → open_missions (and sp → open_mashaabims)
   * suggestion matcher — no project required. 172 resolves skill names → ids so the
   * published mission carries the matching dimensions. */
  '169crWishOpenMission': `mutation CrWishOpenMission(
    $name: String!,
    $descrip: String,
    $hearotMeyuchadot: String,
    $noofhours: Float,
    $perhour: Float,
    $isMust: Boolean,
    $ratson: ID,
    $pendm: ID,
    $mission: ID,
    $skills: [ID],
    $tafkidims: [ID],
    $work_ways: [ID],
    $source: ENUM_OPENMISSION_SOURCE,
    $location: ComponentNewLocationInput,
    $sqadualed: DateTime,
    $publishedAt: DateTime
  ) {
    createOpenMission(data: {
      name: $name,
      descrip: $descrip,
      hearotMeyuchadot: $hearotMeyuchadot,
      noofhours: $noofhours,
      perhour: $perhour,
      isMust: $isMust,
      archived: false,
      ratson: $ratson,
      pendm: $pendm,
      mission: $mission,
      skills: $skills,
      tafkidims: $tafkidims,
      work_ways: $work_ways,
      source: $source,
      location: $location,
      sqadualed: $sqadualed,
      publishedAt: $publishedAt
    }) {
      data { id attributes { name } }
    }
  }`,

  '170crWishOpenMashaabim': `mutation CrWishOpenMashaabim(
    $name: String!,
    $descrip: String,
    $spnot: String,
    $price: Float,
    $easy: Float,
    $hm: Float,
    $kindOf: ENUM_OPENMASHAABIM_KINDOF,
    $isMust: Boolean,
    $ratson: ID,
    $pmash: ID,
    $mashaabim: ID,
    $source: ENUM_OPENMASHAABIM_SOURCE,
    $linkto: String,
    $recurring: Boolean,
    $location: ComponentNewLocationInput,
    $sqadualed: DateTime,
    $sqadualedf: DateTime,
    $publishedAt: DateTime
  ) {
    createOpenMashaabim(data: {
      name: $name,
      descrip: $descrip,
      spnot: $spnot,
      price: $price,
      easy: $easy,
      hm: $hm,
      kindOf: $kindOf,
      isMust: $isMust,
      archived: false,
      ratson: $ratson,
      pmash: $pmash,
      mashaabim: $mashaabim,
      source: $source,
      linkto: $linkto,
      recurring: $recurring,
      location: $location,
      sqadualed: $sqadualed,
      sqadualedf: $sqadualedf,
      publishedAt: $publishedAt
    }) {
      data { id attributes { name } }
    }
  }`,

  '172resolveSkillsByName': `query ResolveSkillsByName($names: [String]) {
    skills(filters: { skillName: { in: $names } }, pagination: { limit: 50 }) {
      data { id attributes { skillName } }
    }
  }`,

  '112commitWishWillingness': `mutation CommitWishWillingness(
    $id: ID!,
    $status_proposal: ENUM_RATSONPROPOSAL_STATUS_PROPOSAL,
    $total_price: Float,
    $ratson_willingness_entry: [ComponentNewWillingnessEntriesInput]
  ) {
    updateRatsonProposal(
      id: $id,
      data: {
        status_proposal: $status_proposal,
        total_price: $total_price,
        ratson_willingness_entry: $ratson_willingness_entry
      }
    ) {
      data { id attributes { status_proposal } }
    }
  }`,

  // ── Mission creation / edit ────────────────────────────────────────────────

  '162getMissionForEdit': `query GetMissionForEdit($id: ID!) {
    mission(id: $id) {
      data {
        id
        attributes {
          missionName
          descrip
          skills {
            data {
              id
              attributes {
                skillName
                localizations { data { attributes { skillName } } }
              }
            }
          }
          tafkidims {
            data {
              id
              attributes {
                roleDescription
                localizations { data { attributes { roleDescription } } }
              }
            }
          }
          work_ways {
            data {
              id
              attributes {
                workWayName
                localizations { data { attributes { workWayName } } }
              }
            }
          }
        }
      }
    }
  }`,

  '163createPendm': `mutation CreatePendmFull(
    $projectId: ID!
    $missionId: ID!
    $name: String!
    $descrip: String
    $skills: [ID]
    $tafkidims: [ID]
    $workWays: [ID]
    $vallues: [ID]
    $noofhours: Float
    $perhour: Float
    $iskvua: Boolean
    $sqadualed: DateTime
    $dates: DateTime
    $publicklinks: String
    $privatlinks: String
    $hearotMeyuchadot: String
    $users: [ComponentProjectsPendmnegoInput]
    $location: ComponentNewLocationInput
    $publishedAt: DateTime!
  ) {
    createPendm(data: {
      project: $projectId
      mission: $missionId
      name: $name
      descrip: $descrip
      skills: $skills
      tafkidims: $tafkidims
      work_ways: $workWays
      vallues: $vallues
      noofhours: $noofhours
      perhour: $perhour
      iskvua: $iskvua
      sqadualed: $sqadualed
      dates: $dates
      publicklinks: $publicklinks
      privatlinks: $privatlinks
      hearotMeyuchadot: $hearotMeyuchadot
      users: $users
      location: $location
      publishedAt: $publishedAt
    }) {
      data { id }
    }
  }`,

  '164createOpenMission': `mutation CreateOpenMissionFull(
    $projectId: ID!
    $missionId: ID!
    $name: String!
    $descrip: String
    $skills: [ID]
    $tafkidims: [ID]
    $workWays: [ID]
    $vallues: [ID]
    $noofhours: Float
    $perhour: Float
    $iskvua: Boolean
    $sqadualed: DateTime
    $dates: DateTime
    $publicklinks: String
    $privatlinks: String
    $hearotMeyuchadot: String
    $isRishon: Boolean
    $rishon: ID
    $archived: Boolean
    $location: ComponentNewLocationInput
    $publishedAt: DateTime!
  ) {
    createOpenMission(data: {
      project: $projectId
      mission: $missionId
      name: $name
      descrip: $descrip
      skills: $skills
      tafkidims: $tafkidims
      work_ways: $workWays
      vallues: $vallues
      noofhours: $noofhours
      perhour: $perhour
      iskvua: $iskvua
      sqadualed: $sqadualed
      dates: $dates
      publicklinks: $publicklinks
      privatlinks: $privatlinks
      hearotMeyuchadot: $hearotMeyuchadot
      isRishon: $isRishon
      rishon: $rishon
      archived: $archived
      location: $location
      publishedAt: $publishedAt
    }) {
      data { id }
    }
  }`,

  '165createTimegramaForPendm': `mutation CreateTimegramaForPendm($date: DateTime!, $pendmId: ID!) {
    createTimegrama(data: { date: $date, whatami: "pendm", pendm: $pendmId }) {
      data { id }
    }
  }`,

  '166createWorkWay': `mutation CreateWorkWay($name: String!, $publishedAt: DateTime!) {
    createWorkWay(data: { workWayName: $name, publishedAt: $publishedAt }) {
      data {
        id
        attributes {
          workWayName
          localizations { data { attributes { workWayName } } }
        }
      }
    }
  }`,

  '167getUserHervachti': `query GetUserHervachti($id: ID!) {
    usersPermissionsUser(id: $id) {
      data {
        id
        attributes { hervachti }
      }
    }
  }`,

  'negoCreateNegopendmission': `mutation NegoCreateNegopendmission(
    $publishedAt: DateTime!, $userId: ID!,
    $pendm: ID, $open_mission: ID,
    $isOriginal: Boolean, $isMonth: Boolean,
    $noofhours: Float, $perhour: Float,
    $hearotMeyuchadot: String, $descrip: String, $name: String,
    $skills: [ID], $tafkidims: [ID], $work_ways: [ID],
    $sqadualed: DateTime, $dates: DateTime, $acts: [ID],
    $location: [ComponentNewLocationInput]
  ) {
    createNegopendmission(data: {
      publishedAt: $publishedAt
      users_permissions_user: $userId
      pendm: $pendm
      open_mission: $open_mission
      isOriginal: $isOriginal
      isMonth: $isMonth
      noofhours: $noofhours
      perhour: $perhour
      hearotMeyuchadot: $hearotMeyuchadot
      descrip: $descrip
      name: $name
      skills: $skills
      tafkidims: $tafkidims
      work_ways: $work_ways
      date: $sqadualed
      dates: $dates
      acts: $acts
      location: $location
    }) { data { id } }
  }`,

  'negoUpdatePendm': `mutation NegoUpdatePendm($id: ID!, $data: PendmInput!) {
    updatePendm(id: $id, data: $data) { data { id } }
  }`,

  'negoUpdateOpenMission': `mutation NegoUpdateOpenMission($id: ID!, $data: OpenMissionInput!) {
    updateOpenMission(id: $id, data: $data) { data { id } }
  }`,

  'negoUpdateAskVots': `mutation NegoUpdateAskVots($id: ID!, $vots: [ComponentProjectsVotsInput]) {
    updateAsk(id: $id, data: { vots: $vots }) { data { id } }
  }`,

  'negoCreateNegoMash': `mutation NegoCreateNegoMash(
    $publishedAt: DateTime!, $userId: ID!, $pmash: ID,
    $isOriginal: Boolean, $name: String, $descrip: String, $spnot: String,
    $easy: Float, $hm: Float, $price: Float, $kindOf: ENUM_NEGOMASH_KINDOF,
    $sqadualed: DateTime, $sqadualedf: DateTime, $linkto: String,
    $location: [ComponentNewLocationInput], $recurring: Boolean, $cycleSize: Int
  ) {
    createNegoMash(data: {
      publishedAt: $publishedAt
      users_permissions_user: $userId
      pmash: $pmash
      isOriginal: $isOriginal
      name: $name
      descrip: $descrip
      spnot: $spnot
      easy: $easy
      hm: $hm
      price: $price
      kindOf: $kindOf
      sqadualed: $sqadualed
      sqadualedf: $sqadualedf
      linkto: $linkto
      location: $location
      recurring: $recurring
      cycleSize: $cycleSize
    }) { data { id } }
  }`,

  'negoUpdatePmash': `mutation NegoUpdatePmash($id: ID!, $data: PmashInput!) {
    updatePmash(id: $id, data: $data) { data { id } }
  }`,

  // ─── Open-resource (openMashaabim) candidate negotiation ───
  // A candidate proposes parallel terms on an open resource. Each candidate has
  // their own Askm; the proposed terms live as NegoMash rounds bound to that
  // Askm — the shared OpenMashaabim is never overwritten.

  // Create a NegoMash round. Works for both the internal pmash flow and the
  // external candidate flow (open_mashaabim + askm), with round bookkeeping.
  'negoCreateNegoMashRound': `mutation NegoCreateNegoMashRound(
    $publishedAt: DateTime!, $userId: ID!,
    $pmash: ID, $open_mashaabim: ID, $askm: ID,
    $ordern: Int, $proposedBy: ENUM_NEGOMASH_PROPOSEDBY, $status: ENUM_NEGOMASH_STATUS,
    $isOriginal: Boolean, $name: String, $descrip: String, $spnot: String,
    $easy: Float, $hm: Float, $price: Float, $kindOf: ENUM_NEGOMASH_KINDOF,
    $sqadualed: DateTime, $sqadualedf: DateTime, $linkto: String,
    $location: [ComponentNewLocationInput]
  ) {
    createNegoMash(data: {
      publishedAt: $publishedAt
      users_permissions_user: $userId
      pmash: $pmash
      open_mashaabim: $open_mashaabim
      askm: $askm
      ordern: $ordern
      proposedBy: $proposedBy
      status: $status
      isOriginal: $isOriginal
      name: $name
      descrip: $descrip
      spnot: $spnot
      easy: $easy
      hm: $hm
      price: $price
      kindOf: $kindOf
      sqadualed: $sqadualed
      sqadualedf: $sqadualedf
      linkto: $linkto
      location: $location
    }) { data { id } }
  }`,

  // Note: Askm has no scalar negotiation-state fields. The state (current round,
  // whose turn, status) is DERIVED from its NegoMash rounds. So creating an Askm
  // for a candidate proposal is a plain createAskm (reuse '125createAskm'), and
  // adding a vote/round reuses '133addVoteToAskm'.

  // Read an Askm's negotiation rounds (latest first) for the card / materialization.
  'getAskmNegoRounds': `query GetAskmNegoRounds($id: ID!) {
    askm(id: $id) { data { id attributes {
      archived
      vots { what order users_permissions_user { data { id } } }
      nego_mashes(sort: "ordern:desc") { data { id attributes {
        ordern proposedBy status name descrip spnot
        easy hm price kindOf sqadualed sqadualedf linkto
        users_permissions_user { data { id } }
      } } }
    } } }
  }`,

  // At acceptance, flow the winning candidate's negotiated terms onto the
  // open resource (which is archived for this candidate right after), so the
  // existing downstream materialization picks up the agreed values.
  'applyRoundToOpenMashaabim': `mutation ApplyRoundToOpenMashaabim($id: ID!, $data: OpenMashaabimInput!) {
    updateOpenMashaabim(id: $id, data: $data) { data { id } }
  }`,

  // ─── Open-mission (openMission) candidate negotiation ───
  // Mirrors the openMashaabim flow: each candidate has their own Ask; proposed
  // terms live as Negopendmission rounds bound to that Ask. The shared
  // OpenMission stays untouched as the rikma baseline for comparison.

  // Create a Negopendmission round. Works for both the internal pendm flow and
  // the external candidate/counter flow (open_mission + ask), with round bookkeeping.
  'negoCreateNegopendmissionRound': `mutation NegoCreateNegopendmissionRound(
    $publishedAt: DateTime!, $userId: ID!,
    $pendm: ID, $open_mission: ID, $ask: ID,
    $ordern: Int, $proposedBy: ENUM_NEGOPENDMISSION_PROPOSEDBY, $status: ENUM_NEGOPENDMISSION_STATUS,
    $isOriginal: Boolean,
    $noofhours: Float, $perhour: Float,
    $hearotMeyuchadot: String, $descrip: String, $name: String,
    $skills: [ID], $tafkidims: [ID], $work_ways: [ID],
    $sqadualed: DateTime, $dates: DateTime,
    $location: [ComponentNewLocationInput]
  ) {
    createNegopendmission(data: {
      publishedAt: $publishedAt
      users_permissions_user: $userId
      pendm: $pendm
      open_mission: $open_mission
      ask: $ask
      ordern: $ordern
      proposedBy: $proposedBy
      status: $status
      isOriginal: $isOriginal
      noofhours: $noofhours
      perhour: $perhour
      hearotMeyuchadot: $hearotMeyuchadot
      descrip: $descrip
      name: $name
      skills: $skills
      tafkidims: $tafkidims
      work_ways: $work_ways
      date: $sqadualed
      dates: $dates
      location: $location
    }) { data { id } }
  }`,

  // Read an Ask's negotiation rounds (latest first) for the card / finalization.
  'getAskNegoRounds': `query GetAskNegoRounds($id: ID!) {
    ask(id: $id) { data { id attributes {
      archived
      vots { what order users_permissions_user { data { id } } }
      negopendmissions(sort: "ordern:desc") { data { id attributes {
        ordern proposedBy status name descrip hearotMeyuchadot
        noofhours perhour date dates
        skills { data { id } }
        tafkidims { data { id } }
        work_ways { data { id } }
        users_permissions_user { data { id } }
      } } }
    } } }
  }`,

  // At acceptance, flow the winning candidate's negotiated terms onto the
  // open mission (archived right after), so the Mesimabetahalich uses the agreed values.
  'applyRoundToOpenMission': `mutation ApplyRoundToOpenMission($id: ID!, $data: OpenMissionInput!) {
    updateOpenMission(id: $id, data: $data) { data { id } }
  }`,

  // ─── Cron finalizers (timegrama auto-approval) ───
  // Everything the askm finalizer needs to run the bilateral gate (rounds +
  // vots + members + taker) and then materialize (open_mashaabim + sp + name +
  // sibling askms to archive).
  'getAskmForFinalize': `query GetAskmForFinalize($id: ID!) {
    askm(id: $id) { data { id attributes {
      archived
      vots { what order users_permissions_user { data { id } } }
      users_permissions_user { data { id } }
      sp { data { id } }
      project { data { id attributes { restime user_1s { data { id } } } } }
      open_mashaabim { data { id attributes { name askms { data { id } } } } }
      nego_mashes(sort: "ordern:desc") { data { id attributes { ordern proposedBy } } }
    } } }
  }`,

  // Archive a sibling Askm (a losing candidate) once another is accepted.
  'archiveAskmSimple': `mutation ArchiveAskmSimple($id: ID!) {
    updateAskm(id: $id, data: { archived: true }) { data { id } }
  }`,

  // ─── Candidacy timegrama lifecycle (ensure / reset) ───
  // The deadline timegrama for an Ask/Askm is created when a rikma member first
  // engages (favorable vote or counter), and reset when a counter opens a fresh
  // response window. These let the nego helper find an active one before deciding
  // whether to create or reset.
  'getActiveTimegramaForAsk': `query GetActiveTimegramaForAsk($id: ID!) {
    timegramas(filters: { ask: { id: { eq: $id } }, done: { ne: true } }, sort: "id:desc", pagination: { limit: 1 }) {
      data { id }
    }
  }`,
  'getActiveTimegramaForAskm': `query GetActiveTimegramaForAskm($id: ID!) {
    timegramas(filters: { askm: { id: { eq: $id } }, done: { ne: true } }, sort: "id:desc", pagination: { limit: 1 }) {
      data { id }
    }
  }`,
  'getAskProjectRestime': `query GetAskProjectRestime($id: ID!) {
    ask(id: $id) { data { id attributes { project { data { id attributes { restime } } } } } }
  }`,
  'getAskmProjectRestime': `query GetAskmProjectRestime($id: ID!) {
    askm(id: $id) { data { id attributes { project { data { id attributes { restime } } } } } }
  }`
};

export const moachQids = {
  // ─── Monthly recurring resources (mashabetahalich cyclic engine) ──────────
  // A "mashabetahalich" with recurring=true is a recurring expense (server rent,
  // apartment, stall…). Each month /api/monthi opens a cycle (a Maap with
  // cycleIndex/cycleStart/cycleEnd) that surfaces on the lev screen; once the
  // responsible user confirms the amount and the project approves it, the spend
  // is archived as a delivery line on the resource's Rikmash.
  'mrCreateMashabetahalich': `mutation MrCreateMashabetahalich($data: MashabetahalichInput!) {
    createMashabetahalich(data: $data) { data { id attributes { name } } }
  }`,
  'mrUpdateMashabetahalich': `mutation MrUpdateMashabetahalich($id: ID!, $data: MashabetahalichInput!) {
    updateMashabetahalich(id: $id, data: $data) { data { id attributes { status_mashab finnished } } }
  }`,
  'mrGetMashabetahalich': `query MrGetMashabetahalich($id: ID!) {
    mashabetahalich(id: $id) {
      data { id attributes {
        name descrip pricePerUnit start end cycleSize kindOf recurring status_mashab
        finnished quantityDelivered
        project { data { id attributes { user_1s { data { id } } } } }
        users_permissions_user { data { id attributes { username email lang noMail } } }
        maaps { data { id attributes { cycleIndex cycleStart cycleEnd archived } } }
        rikmash { data { id } }
      } }
    }
  }`,
  // Used by /api/monthi: every active, non-finished recurring resource.
  'mrGetRecurringForMonthi': `query MrGetRecurringForMonthi {
    mashabetahaliches(
      filters: { recurring: { eq: true }, status_mashab: { eq: "active" }, finnished: { eq: false } }
      pagination: { limit: 300 }
    ) {
      data { id attributes {
        name pricePerUnit start end cycleSize kindOf
        project { data { id attributes { projectName user_1s { data { id } } } } }
        users_permissions_user { data { id attributes { username email lang noMail } } }
        maaps(pagination: { limit: 500 }) { data { id attributes { cycleIndex cycleStart cycleEnd archived } } }
        rikmash { data { id } }
      } }
    }
  }`,
  'mrCreateCycleMaap': `mutation MrCreateCycleMaap($data: MaapInput!) {
    createMaap(data: $data) { data { id attributes { cycleIndex } } }
  }`,
  'mrGetRikmashForDelivery': `query MrGetRikmashForDelivery($id: ID!) {
    rikmash(id: $id) {
      data { id attributes {
        total cyclesCount firstDeliveryAt lastDeliveryAt
        deliveries { id cycleIndex deliveredAt quantity note maap { data { id } } }
      } }
    }
  }`,
  'mrCreateRikmash': `mutation MrCreateRikmash($data: RikmashInput!) {
    createRikmash(data: $data) { data { id } }
  }`,
  'mrUpdateRikmash': `mutation MrUpdateRikmash($id: ID!, $data: RikmashInput!) {
    updateRikmash(id: $id, data: $data) { data { id } }
  }`,
  'mrLinkRikmashToMashabetahalich': `mutation MrLinkRikmash($id: ID!, $rikmash: ID!) {
    updateMashabetahalich(id: $id, data: { rikmash: $rikmash }) { data { id } }
  }`,
  // Resolve the approved recurring Pmash's final (possibly negotiated) terms so
  // askm approval can spin up the mashabetahalich engine. Matched by project +
  // name; only returns when the final pmash is still flagged recurring, so a
  // member negotiating recurring → false cleanly results in no engine.
  'mrGetPmashRecurringTerms': `query MrGetPmashRecurringTerms($pid: ID!, $name: String!) {
    pmashes(
      filters: {
        project: { id: { eq: $pid } }
        name: { eq: $name }
        recurring: { eq: true }
      }
      sort: ["createdAt:desc"]
      pagination: { limit: 1 }
    ) {
      data { id attributes {
        recurring cycleSize easy price kindOf sqadualed sqadualedf
        mashaabim { data { id } }
      } }
    }
  }`,
  'mrUpdateCycleMaap': `mutation MrUpdateCycleMaap($id: ID!, $data: MaapInput!) {
    updateMaap(id: $id, data: $data) { data { id } }
  }`,
  // Each monthly cycle Maap gets its own Timegrama (deadline). When it elapses the
  // clients auto-approve the reported amount; a counter-offer resets the date.
  'mrCreateCycleTimegrama': `mutation MrCreateCycleTimegrama($date: DateTime!, $maapId: ID!) {
    createTimegrama(data: { date: $date, done: false, whatami: "maap", maap: $maapId }) {
      data { id }
    }
  }`,
  'mrLinkMaapTimegrama': `mutation MrLinkMaapTimegrama($id: ID!, $timegrama: ID!) {
    updateMaap(id: $id, data: { timegrama: $timegrama }) { data { id } }
  }`,
  // Snapshot of a counter-offer on a recurring cycle: old amount + proposed amount
  // + who/why/cycle in des(JSON). Requires a `maap` relation on the Nego collection.
  'mrCreateNego': `mutation MrCreateNego($maapId: ID!, $price: Float, $proposedPrice: Float, $des: JSON, $publishedAt: DateTime) {
    createNego(data: { maap: $maapId, price: $price, proposedPrice: $proposedPrice, des: $des, publishedAt: $publishedAt }) {
      data { id }
    }
  }`,
  // The engine's chat forum (for posting counter-offer reasons). May not exist yet.
  'mrGetMashabForum': `query MrGetMashabForum($id: ID!) {
    mashabetahalich(id: $id) {
      data { id attributes {
        name
        project { data { id } }
        forums(pagination: { limit: 1 }) { data { id } }
      } }
    }
  }`,
  'mrCreateForumMashab': `mutation MrCreateForumMashab($pid: ID, $mashabId: ID, $da: DateTime) {
    createForum(data: { project: $pid, mashabetahalich: $mashabId, publishedAt: $da }) {
      data { id }
    }
  }`,
  'mrGetProjectRestime': `query MrGetProjectRestime($pid: ID!) {
    project(id: $pid) { data { id attributes { restime } } }
  }`,
  'mrSetTimegramaDone': `mutation MrSetTimegramaDone($id: ID!, $done: Boolean!) {
    updateTimegrama(id: $id, data: { done: $done }) { data { id } }
  }`,
  'mrResetTimegrama': `mutation MrResetTimegrama($id: ID!, $date: DateTime!) {
    updateTimegrama(id: $id, data: { date: $date, done: false }) { data { id } }
  }`,

  'getProjectBaseInfo': `query GetProjectBaseInfo($pid: ID!) {
    project(id: $pid) {
      data {
        attributes {
          projectName
          descripFor
          publicDescription
          profilePic { data { attributes { url formats } } }
          user_1s { data { id attributes { email username lang profilePic { data { attributes { url formats } } } } } }
          restime githublink fblink discordlink drivelink twiterlink watsapplink linkToWebsite
          vallues { data { id attributes { valueName localizations { data { attributes { valueName } } } } } }
          acts{data{id attributes{shem hashivut isAssigned open_mission{data{id attributes {name}}} pendm{data{id attributes{name}}}
                 dateS naasa my{data{ id attributes{ username profilePic {data{attributes{ url }}}}}}
                 des dateF vali{data{id attributes{ username profilePic {data{attributes{ url }}}}}}
                 myIshur valiIshur status mesimabetahaliches{data{id
                  attributes{name forums{data{id}}}}}}}}
          sheiruts{data{ id attributes{name descrip equaliSplited oneTime isApruved}}}
        }
      }
    }
  }`,
  'getProjectBaseInfoWithAuth': `query GetProjectBaseInfoWithAuth($pid: ID!) {
    project(id: $pid) {
      data {
        attributes {
          projectName
          descripFor
          publicDescription
          profilePic { data { attributes { url formats } } }
          user_1s { data { id attributes { email username lang profilePic { data { attributes { url formats } } } } } }
          restime githublink fblink discordlink drivelink twiterlink watsapplink linkToWebsite
          vallues { data { id attributes { valueName localizations { data { attributes { locale valueName } } } } } }
          acts{data{id attributes{shem hashivut isAssigned open_mission{data{id attributes {name}}} pendm{data{id attributes{name}}}
                 dateS naasa my{data{ id attributes{ username profilePic {data{attributes{ url }}}}}}
                 des dateF vali{data{id attributes{ username profilePic {data{attributes{ url }}}}}}
                 myIshur valiIshur status mesimabetahaliches{data{id
                  attributes{name forums{data{id}}}}}
                 tafkidims{data{id attributes{roleDescription localizations{data{attributes{roleDescription}}}}}}
                 }}}
          sheiruts{data{ id attributes{name descrip equaliSplited oneTime isApruved}}}
        }
      }
    }
    me { id }
  }`,
  /* Chain view "extra" lookups (moach/[projectId]/chains): open_missions /
   * pendms referenced by BOM lines but not in the main missions payload. Filter
   * by the specific ids the client computed. Routed through /api/send so the JWT
   * stays in the HttpOnly cookie (was a direct client /graphql bearer call). */
  'chainExtraData': `query ChainExtraData($pid: ID!, $omIds: [ID], $pmIds: [ID]) {
    project(id: $pid) {
      data {
        attributes {
          extraOm: open_missions(filters: { id: { in: $omIds } }) {
            data { id attributes { name noofhours perhour sqadualed privatlinks publicklinks
              rishon { data { id } } mission { data { id } } acts { data { id attributes { shem dateS } } } createdAt
              asks { data { id attributes { archived
                users_permissions_user { data { id attributes { username profilePic { data { attributes { url } } } } } }
                forums { data { id } }
              } } }
            } }
          }
          extraPendm: pendms(filters: { id: { in: $pmIds } }) {
            data { id attributes { name createdAt dates noofhours perhour mission { data { id } }
              users { what why id users_permissions_user { data { id attributes { username } } } }
            } }
          }
        }
      }
    }
  }`,

  /* Single-chain detail page (moach/[projectId]/chains/[chainId]): the full
   * active-work snapshot used to reconstruct the requested chain. `$withLoc`
   * mirrors the original lang-conditional roleDescription localization (he only).
   * Routed through /api/send so the JWT stays server-side (was a direct bearer). */
  'chainDetailProjectData': `query ChainDetailProjectData($pid: ID!, $withLoc: Boolean!) {
    project(id: $pid) {
      data {
        attributes {
          acts { data { id attributes {
            shem hashivut naasa myIshur valiIshur status dateS dateF
            pendm { data { id } }
            open_mission { data { id } }
            mesimabetahaliches { data { id } }
            my { data { id attributes { username profilePic { data { attributes { url } } } } } }
            vali { data { id } }
          } } }
          mesimabetahaliches(filters: { finnished: { eq: false } }) { data {
            id attributes {
              name status iskvua createdAt
              open_missions { data { id } }
              forums { data { id } }
              finiapruvals { data { id attributes { missname archived } } }
              users_permissions_user { data { id attributes { username profilePic { data { attributes { url } } } } } }
              acts { data { id attributes { shem dateS naasa myIshur valiIshur status } } }
            }
          } }
          open_missions(filters: { archived: { eq: false } }) { data {
            id attributes {
              name descrip noofhours perhour sqadualed createdAt
              pendm { data { id } }
              asks { data { id attributes { username } } }
              tafkidims { data { id attributes { roleDescription localizations @include(if: $withLoc) { data { attributes { roleDescription } } } } } }
            }
          } }
          pendms(filters: { archived: { eq: false } }) { data {
            id attributes {
              name dates createdAt archived
              mission { data { id } }
              tafkidims { data { id attributes { roleDescription localizations @include(if: $withLoc) { data { attributes { roleDescription } } } } } }
            }
          } }
          finnished_missions { data {
            id attributes {
              missionName start finish total
              mesimabetahalich { data { id } }
            }
          } }
          open_mashaabims(filters: { archived: { eq: false } }) { data {
            id attributes {
              name kindOf hm descrip price easy spnot sqadualed sqadualedf
              pmash { data { id attributes { name } } }
              askms { data { id attributes { name } } }
              maap { data { id attributes { name archived } } }
              rikmashes { data { id attributes { name kindOf total hm price } } }
            }
          } }
          rikmashes { data {
            id attributes { name kindOf total hm price }
          } }
        }
      }
    }
  }`,

  'getProjectMissions': `query GetProjectMissions($pid: ID!) {
    project(id: $pid) {
      data {
        attributes {
          open_missions(filters: { archived: { eq: false } }) {
            data {
              id
              attributes {
                name hearotMeyuchadot descrip noofhours perhour sqadualed
                privatlinks publicklinks acts { data { id attributes { shem dateS } } }
                tafkidims { data { id attributes { roleDescription } } }
                skills { data { id attributes { skillName } } }
                work_ways { data { id attributes { workWayName } } }
                rishon { data { id } }
                pendm { data { id } }
                mission { data { id } }
                asks { data { id attributes { archived users_permissions_user { data { id attributes { username profilePic { data { attributes { url } } } } } } forums { data { id } } } } }
                createdAt
              }
            }
          }
          mesimabetahaliches(filters: { finnished: { ne: true } }) {
            data {
              id
              attributes {
                name status iskvua finnished howmanyhoursalready perhour hoursassinged createdAt start dates
                hearotMeyuchadot descrip admaticedai privatlinks publicklinks
                monter { monthStart hours isDone hoursDone }
                forums { data { id } }
                open_missions { data { id } }
                finiapruvals { data { id attributes { missname archived } } }
                tafkidims { data { id attributes { roleDescription localizations { data { attributes { roleDescription } } } } } }
                acts { data { id attributes {
                  shem dateS hashivut naasa des dateF myIshur valiIshur status
                  my { data { id attributes { username profilePic { data { attributes { url } } } } } }
                  vali { data { id } }
                  mesimabetahaliches { data { id } }
                } } }
                users_permissions_user { data { id attributes { username profilePic { data { attributes { url } } } } } }
              }
            }
          }
          pendms(filters: { archived: { eq: false } }) {
            data {
              id
              attributes {
                name descrip noofhours perhour createdAt dates hearotMeyuchadot sqadualed privatlinks publicklinks
                rishon { data { id } }
                skills { data { id attributes { skillName } } }
                tafkidims { data { id attributes { roleDescription } } }
                work_ways { data { id attributes { workWayName } } }
                mission { data { id } }
                users { what why id users_permissions_user { data { id } } }
              }
            }
          }
          open_mashaabims(filters: { archived: { eq: false } }) {
            data {
              id
              attributes {
                name descrip kindOf price easy hm spnot linkto sqadualed sqadualedf
              }
            }
          }
          pmashes(filters: { archived: { eq: false } }) {
            data {
              id
              attributes {
                name descrip kindOf price easy hm spnot linkto sqadualed sqadualedf
                users { what why id users_permissions_user { data { id } } }
              }
            }
          }
          finnished_missions {
            data {
              id
              attributes {
                missionName start finish createdAt total
                mesimabetahalich { data { id } }
              }
            }
          }
        }
      }
    }
  }`,
  'getMissionTemplates': `query GetMissionTemplates {
    missions { data { id attributes { 
      missionName 
      descrip
      skills { data { id attributes { skillName localizations { data { attributes { skillName } } } } } }
      tafkidims { data { id attributes { roleDescription localizations { data { attributes { roleDescription } } } } } }
      work_ways { data { id attributes { workWayName localizations { data { attributes { workWayName } } } } } }
    } } }
  }`,
  'getProjectFinancials': `query GetProjectFinancials($pid: ID!) {
    project(id: $pid) {
      data {
        attributes {
          tosplits(filters: { finished: { eq: false } }) {
            data {
              id
              attributes {
                name prectentage halukas { data { id attributes { confirmed userrecive { data { id } } amount usersend { data { id } } } } }
                hervachti { users_permissions_user { data { id attributes { hervachti } } } noten mekabel amount }
                vots { what users_permissions_user { data { id } } }
                sales { data { id } }
                siteShareHalukas { data { id attributes { amount confirmed usersend { data { id } } userrecive { data { id } } } } }
              }
            }
          }
          sales {
            data {
              id
              attributes {
                in date pending splited holderStatus confirmedBy note tosplits { data { id } }
                matanot { data { id attributes { name } } }
                users_permissions_user { data { id attributes { username } } }
              }
            }
          }
          matanotofs {
            data {
              id
              attributes {
                name price quant kindOf startDate finnishDate
              }
            }
          }
          rikmashes {
            data {
              id
              attributes {
                name kindOf total hm price agprice sp { data { id } } spnot
                users_permissions_user { data { id attributes { username } } }
              }
            }
          }
          finnished_missions {
            data {
              id
              attributes {
                missionName start finish createdAt why total descrip hearotMeyuchadot noofhours perhour
                mesimabetahalich { data { id attributes { createdAt } } }
                users_permissions_user { data { id attributes { username } } }
              }
            }
          }
        }
      }
    }
  }`,
  'getProjectProcesses': `query GetProjectProcesses($pid: ID!) {
    project(id: $pid) {
      data {
        attributes {
          projectName
          processes {
            data {
              id
              attributes {
                name descrip createdAt
              }
            }
          }
        }
      }
    }
  }`,
  'getProjectVotes': `query GetProjectVotes($pid: ID!) {
    project(id: $pid) {
      data {
        attributes {
          tosplits(filters: { finished: { eq: false } }) {
            data { id attributes { name vots { what why users_permissions_user { data { id attributes { username } } } } } }
          }
          decisions(filters: { archived: { eq: false } }) {
            data { id attributes { kind newname vots { what users_permissions_user { data { id } } } } }
          }
          open_missions(filters: { archived: { eq: false } }) {
            data {
              id
              attributes {
                name
                asks(filters: { archived: { eq: false } }) {
                  data { id attributes { vots { what why users_permissions_user { data { id attributes { username } } } } } }
                }
              }
            }
          }
          askms(filters: { archived: { eq: false } }) {
            data {
              id
              attributes {
                vots { what why users_permissions_user { data { id } } }
                pmash { data { attributes { name } } }
                open_mashaabim { data { attributes { name } } }
                users_permissions_user { data { id attributes { username } } }
                sp { data { attributes { users_permissions_user { data { attributes { username } } } } } }
              }
            }
          }
        }
      }
    }
  }`,
  // Cheap count-only query for the "votes" tab badge in the moach nav. Uses
  // pagination meta so no rows are fetched — safe to call on layout mount and
  // on each vote socket event without affecting the moach base load.
  'getOpenVoteCounts': `query GetOpenVoteCounts($pid: ID!) {
    project(id: $pid) {
      data {
        attributes {
          pmashes(filters: { archived: { eq: false } }) { data { id } }
          pendms(filters: { archived: { eq: false } }) { data { id } }
          tosplits(filters: { finished: { eq: false } }) { data { id } }
          decisions(filters: { archived: { eq: false } }) { data { id } }
          askms(filters: { archived: { eq: false } }) { data { id } }
          open_missions(filters: { archived: { eq: false } }) {
            data { id attributes { asks(filters: { archived: { eq: false } }) { data { id } } } }
          }
        }
      }
    }
  }`,
  // Cheap count-only query for the "opportunities" group badge in the moach
  // nav — id + status only, counted client-side with the same active statuses
  // (suggested/viewed) the wishes page uses.
  'getOpenWishCounts': `query GetOpenWishCounts($projectId: ID!, $limit: Int) {
    ratsonProposals(
      filters: { project: { id: { eq: $projectId } } }
      pagination: { limit: $limit }
    ) {
      data { id attributes { status_proposal } }
    }
  }`,
  // Single-entity queries for the focused in-moach vote pages
  // (moach/[projectId]/votes/[kind]/[id]). Field selections mirror the lev
  // page's pendm/pmash selections exactly so the shared extractors/processors
  // consume them unchanged. project{id} is included for the cross-project guard.
  'getPendmForVote': `query GetPendmForVote($eid: ID!) {
    pendm(id: $eid) {
      data {
        id
        attributes {
          project { data { id } }
          name createdAt iskvua hearotMeyuchadot descrip noofhours perhour sqadualed privatlinks publicklinks dates
          location { location_mode lat lng radius location_hint }
          rishon { data { id } }
          mission { data { id } }
          vallues { data { id } }
          timegrama { data { id attributes { date } } }
          acts { data { id attributes { shem link des dateF dateS } } }
          skills { data { id attributes { skillName localizations { data { attributes { skillName } } } } } }
          tafkidims { data { id attributes { roleDescription localizations { data { attributes { roleDescription } } } } } }
          work_ways { data { id attributes { workWayName localizations { data { attributes { workWayName } } } } } }
          negopendmissions(sort: "ordern:desc") {
            data { id attributes {
              name hearotMeyuchadot descrip createdAt ordern proposedBy noofhours perhour isOriginal date dates isMonth
              location { location_mode lat lng radius location_hint }
              users_permissions_user { data { id attributes { username } } }
              skills { data { id attributes { skillName localizations { data { attributes { skillName } } } } } }
              tafkidims { data { id attributes { roleDescription localizations { data { attributes { roleDescription } } } } } }
              work_ways { data { id attributes { workWayName localizations { data { attributes { workWayName } } } } } }
              acts { data { id attributes { shem link des dateF dateS } } }
            } }
          }
          diun { what why order id zman users_permissions_user { data { id } } }
          users { what why order id users_permissions_user { data { id } } }
        }
      }
    }
  }`,
  'getPmashForVote': `query GetPmashForVote($eid: ID!) {
    pmash(id: $eid) {
      data {
        id
        attributes {
          project { data { id } }
          hm sqadualedf sqadualed linkto createdAt name descrip easy price kindOf spnot recurring cycleSize
          location { location_mode lat lng radius location_hint }
          nego_mashes {
            data { id attributes {
              hm sqadualedf sqadualed linkto createdAt name descrip easy price kindOf spnot recurring cycleSize
              location { location_mode lat lng radius location_hint }
              users_permissions_user { data { id } }
            } }
          }
          mashaabim { data { id } }
          timegrama { data { id attributes { date } } }
          diun { what why order id zman users_permissions_user { data { id } } }
          users { what order why id users_permissions_user { data { id } } }
        }
      }
    }
  }`,
  // Join request (candidate → open_mission). Field selection mirrors the lev
  // `asks` block so extractAsked/processAsked consume it unchanged. Renders via
  // Reqtojoin. project{id} is for the cross-project guard.
  'getAskForVote': `query GetAskForVote($eid: ID!) {
    ask(id: $eid) {
      data {
        id
        attributes {
          project { data { id } }
          vots { what why zman order id users_permissions_user { data { id } } }
          timegrama { data { id attributes { date done } } }
          negopendmissions(sort: "ordern:desc") {
            data { id attributes { ordern proposedBy status name descrip hearotMeyuchadot noofhours perhour date dates createdAt } }
          }
          createdAt
          chat { why id ide what zman users_permissions_user { data { id } } }
          forums { data { id attributes { messages(pagination: { limit: 100 }) { data { id attributes { content createdAt users_permissions_user { data { id attributes { username profilePic { data { attributes { url formats } } } } } } } } } } }
          open_mission {
            data { id attributes {
              acts { data { id attributes { shem link des dateF dateS } } }
              mission { data { id } }
              negopendmissions(sort: "ordern:desc") {
                data { id attributes {
                  name hearotMeyuchadot descrip createdAt ordern proposedBy noofhours perhour isOriginal date dates isMonth
                  users_permissions_user { data { id attributes { username } } }
                  skills { data { id attributes { skillName localizations { data { attributes { skillName } } } } } }
                  tafkidims { data { id attributes { roleDescription localizations { data { attributes { roleDescription } } } } } }
                  work_ways { data { id attributes { workWayName localizations { data { attributes { workWayName } } } } } }
                  acts { data { id attributes { shem link des dateF dateS } } }
                } }
              }
              declined { data { id } }
              iskvua isRishon sqadualed dates publicklinks
              skills { data { id attributes { skillName localizations { data { attributes { skillName } } } } } }
              work_ways { data { id attributes { workWayName localizations { data { attributes { workWayName } } } } } }
              tafkidims { data { id attributes { roleDescription localizations { data { attributes { roleDescription } } } } } }
              noofhours perhour privatlinks descrip hearotMeyuchadot name
            } }
          }
          users_permissions_user {
            data { id attributes {
              username
              skills { data { id attributes { skillName localizations { data { attributes { skillName } } } } } }
              work_ways { data { id attributes { workWayName localizations { data { attributes { workWayName } } } } } }
              tafkidims { data { id attributes { roleDescription localizations { data { attributes { roleDescription } } } } } }
              email
              profilePic { data { attributes { url formats } } }
            } }
          }
        }
      }
    }
  }`,
  // Resource join request (candidate/self → open_mashaabim/pmash). Mirrors the
  // lev `askms` block so extractAskedResources/processAskedResources consume it
  // unchanged. Renders via Reqtom. project{id} added for the cross-project guard.
  'getAskmForVote': `query GetAskmForVote($eid: ID!) {
    askm(id: $eid) {
      data {
        id
        attributes {
          project { data { id } }
          isSelfProposal
          pendingMainVote
          vots { what zman why id users_permissions_user { data { id } } }
          timegrama { data { id attributes { date done } } }
          nego_mashes(sort: "ordern:desc") {
            data { id attributes { ordern proposedBy status name descrip spnot easy hm price kindOf sqadualed sqadualedf linkto } }
          }
          createdAt
          chat { why ide what zman id users_permissions_user { data { id } } }
          users_permissions_user { data { id attributes { username profilePic { data { attributes { url formats } } } } } }
          open_mashaabim { data { id attributes { price descrip spnot kindOf sqadualedf sqadualed linkto createdAt hm name easy recurring cycleSize } } }
          pmash { data { id attributes { name descrip spnot price easy hm kindOf sqadualed sqadualedf recurring cycleSize } } }
          sp { data { id attributes { name descrip price myp spnot users_permissions_user { data { id attributes { username profilePic { data { attributes { url formats } } } } } } } } }
        }
      }
    }
  }`,

  // Tosplit (haluka) vote page — single focused split. Fields mirror what
  // extractHalukas + processHalukas need; project{id} is for the cross-project guard.
  'getTosplitForVote': `query GetTosplitForVote($eid: ID!) {
    tosplit(id: $eid) {
      data {
        id
        attributes {
          project { data { id } }
          name
          createdAt
          vots { what why ide order users_permissions_user { data { id } } }
          hervachti {
            users_permissions_user { data { id attributes { username profilePic { data { attributes { url } } } } } }
            amount
            mekabel
            noten
          }
          halukas {
            data {
              id
              attributes {
                amount
                senderconf
                confirmed
                usersend { data { id attributes { username } } }
                userrecive { data { id attributes { username } } }
              }
            }
          }
          siteShareHalukas {
            data {
              id
              attributes {
                amount
                proposedAmount
                senderconf
                confirmed
                adjustDirection
                adjustReason
              }
            }
          }
        }
      }
    }
  }`,

  'getMissionInProgress': `query GetMissionInProgress($id: ID!) {
    mesimabetahalich(id: $id) {
      data {
        id
        attributes {
          name status iskvua howmanyhoursalready hoursassinged perhour
          users_permissions_user { data { id attributes { username profilePic { data { attributes { url } } } } } }
          forums { data { id attributes { messages { data { id attributes { content when } } } } } }
          acts { data { id attributes { shem naasa status } } }
          finiapruvals { data { id attributes { missname archived } } }
          descrip
        }
      }
    }
  }`,
  'getVote': `query GetVote($id: ID!) {
    vot(id: $id) {
      data {
        id
        attributes {
          what why zman order
          users_permissions_user { data { id attributes { username } } }
        }
      }
    }
  }`,
  'getAct': `query GetAct($id: ID!) {
    act(id: $id) {
      data {
        id
        attributes {
          shem des status naasa dateS dateF link
          my { data { id attributes { username } } }
          vali { data { id attributes { username } } }
        }
      }
    }
  }`,

  'getAllVallues': `query GetAllVallues {
    vallues { data { id attributes { valueName localizations { data { attributes { valueName } } } } } }
  }`,

  'updateProjectDetails': `mutation UpdateProjectDetails(
    $id: ID!
    $projectName: String
    $publicDescription: String
    $descripFor: String
    $linkToWebsite: String
    $githublink: String
    $fblink: String
    $discordlink: String
    $drivelink: String
    $twiterlink: String
    $watsapplink: String
    $restime: ENUM_PROJECT_RESTIME
    $vallues: [ID]
  ) {
    updateProject(id: $id, data: {
      projectName: $projectName
      publicDescription: $publicDescription
      descripFor: $descripFor
      linkToWebsite: $linkToWebsite
      githublink: $githublink
      fblink: $fblink
      discordlink: $discordlink
      drivelink: $drivelink
      twiterlink: $twiterlink
      watsapplink: $watsapplink
      restime: $restime
      vallues: $vallues
    }) {
      data {
        attributes {
          projectName publicDescription descripFor linkToWebsite
          githublink fblink discordlink drivelink twiterlink watsapplink restime
          vallues { data { id attributes { valueName localizations { data { attributes { valueName } } } } } }
        }
      }
    }
  }`,

  'createProjectDecision': `mutation CreateProjectDecision(
    $projectIds: [ID]
    $publishedAt: DateTime
    $decisionName: String
    $kind: ENUM_DECISION_KIND
    $newname: String
    $newpubdes: String
    $newprides: String
    $newFlink: String
    $newWlink: String
    $timtoM: String
    $valluesadd: [ID]
    $valluesles: [ID]
    $newpic: ID
    $vots: [ComponentProjectsVotsInput]
  ) {
    createDecision(data: {
      projects: $projectIds
      publishedAt: $publishedAt
      decisionName: $decisionName
      kind: $kind
      newname: $newname
      newpubdes: $newpubdes
      newprides: $newprides
      newFlink: $newFlink
      newWlink: $newWlink
      timtoM: $timtoM
      valluesadd: $valluesadd
      valluesles: $valluesles
      newpic: $newpic
      vots: $vots
    }) {
      data { id }
    }
  }`,
  '103getForumThreadById': `query GetForumThreadById($forumId: ID!) {
    forum(id: $forumId) {
      data {
        ...ForumThreadCore
      }
    }
  }

  fragment ForumThreadCore on ForumEntity {
    id
    attributes {
      subject
      spec
      done
      createdAt
      publishedAt
      updatedAt
      messages(filters: { archived: { ne: true } }, sort: ["when:asc"], pagination: { limit: 500 }) {
        data {
          id
          attributes {
            content
            when
            users_permissions_user {
              data {
                id
                attributes {
                  username
                  profilePic { data { attributes { url formats } } }
                }
              }
            }
          }
        }
      }
      project { data { ...ForumProjectCore } }
      ratson {
        data {
          id
          attributes {
            name
            users_permissions_users {
              data { id attributes { username profilePic { data { attributes { url formats } } } } }
            }
          }
        }
      }
      ratson_proposal {
        data {
          id
          attributes {
            ratson {
              data {
                id
                attributes {
                  name
                  users_permissions_users {
                    data { id attributes { username profilePic { data { attributes { url formats } } } } }
                  }
                }
              }
            }
            proposer_users {
              data { id attributes { username profilePic { data { attributes { url formats } } } } }
            }
          }
        }
      }
      haluka {
        data {
          id
          attributes {
            amount
            usersend { data { id attributes { username profilePic { data { attributes { url formats } } } } } }
            userrecive { data { id attributes { username profilePic { data { attributes { url formats } } } } } }
            project { data { ...ForumProjectCore } }
          }
        }
      }
      pgisha {
        data {
          id
          attributes {
            name
            desc
            publishedAt
            pgishausers {
              data {
                id
                attributes {
                  users_permissions_user {
                    data { id attributes { username profilePic { data { attributes { url formats } } } } }
                  }
                }
              }
            }
          }
        }
      }
      asks {
        data {
          id
          attributes {
            users_permissions_user { data { id attributes { username profilePic { data { attributes { url formats } } } } } }
            project { data { ...ForumProjectCore } }
          }
        }
      }
      sheiruts {
        data {
          id
          attributes {
            name
            descrip
            project { data { ...ForumProjectCore } }
            users_permissions_users { data { id attributes { username profilePic { data { attributes { url formats } } } } } }
            sheirutpend {
              data {
                id
                attributes {
                  users_permissions_user { data { id attributes { username profilePic { data { attributes { url formats } } } } } }
                }
              }
            }
          }
        }
      }
      sheirutpend {
        data {
          id
          attributes {
            users_permissions_user { data { id attributes { username profilePic { data { attributes { url formats } } } } } }
            project { data { ...ForumProjectCore } }
            sheirut { data { id attributes { name project { data { ...ForumProjectCore } } } } }
          }
        }
      }
      mesimabetahaliches {
        data {
          id
          attributes {
            name
            descrip
            project { data { ...ForumProjectCore } }
          }
        }
      }
      decisions(pagination: { limit: 5 }) {
        data {
          id
          attributes {
            kind
            sale {
              data {
                id
                attributes {
                  reporter { data { id attributes { username profilePic { data { attributes { url formats } } } } } }
                  users_permissions_user { data { id attributes { username profilePic { data { attributes { url formats } } } } } }
                }
              }
            }
          }
        }
      }
    }
  }

  fragment ForumProjectCore on ProjectEntity {
    id
    attributes {
      projectName
      profilePic { data { attributes { url formats } } }
      user_1s {
        data {
          id
          attributes {
            username
            profilePic { data { attributes { url formats } } }
          }
        }
      }
    }
  }`,

  '105getForumSummaryById': `query GetForumSummaryById($forumId: ID!) {
    forum(id: $forumId) {
      data {
        ...ForumSummaryCore
      }
    }
  }

  fragment ForumSummaryCore on ForumEntity {
    id
    attributes {
      subject
      spec
      done
      createdAt
      publishedAt
      updatedAt
      messages(filters: { archived: { ne: true } }, sort: ["when:desc"], pagination: { limit: 1 }) {
        data {
          id
          attributes {
            content
            when
            users_permissions_user {
              data { id attributes { username profilePic { data { attributes { url formats } } } } }
            }
          }
        }
      }
      project { data { ...ForumProjectSummaryCore } }
      ratson {
        data {
          id
          attributes {
            name
            users_permissions_users {
              data { id attributes { username profilePic { data { attributes { url formats } } } } }
            }
          }
        }
      }
      ratson_proposal {
        data {
          id
          attributes {
            ratson {
              data {
                id
                attributes {
                  name
                  users_permissions_users {
                    data { id attributes { username profilePic { data { attributes { url formats } } } } }
                  }
                }
              }
            }
            proposer_users {
              data { id attributes { username profilePic { data { attributes { url formats } } } } }
            }
          }
        }
      }
      haluka {
        data {
          id
          attributes {
            amount
            usersend { data { id attributes { username profilePic { data { attributes { url formats } } } } } }
            userrecive { data { id attributes { username profilePic { data { attributes { url formats } } } } } }
            project { data { ...ForumProjectSummaryCore } }
          }
        }
      }
      pgisha {
        data {
          id
          attributes {
            name
            desc
            publishedAt
            pgishausers {
              data {
                id
                attributes {
                  users_permissions_user {
                    data { id attributes { username profilePic { data { attributes { url formats } } } } }
                  }
                }
              }
            }
          }
        }
      }
      asks {
        data {
          id
          attributes {
            users_permissions_user { data { id attributes { username profilePic { data { attributes { url formats } } } } } }
            project { data { ...ForumProjectSummaryCore } }
          }
        }
      }
      sheiruts {
        data {
          id
          attributes {
            name
            descrip
            project { data { ...ForumProjectSummaryCore } }
            users_permissions_users { data { id attributes { username profilePic { data { attributes { url formats } } } } } }
            sheirutpend {
              data {
                id
                attributes {
                  users_permissions_user { data { id attributes { username profilePic { data { attributes { url formats } } } } } }
                }
              }
            }
          }
        }
      }
      sheirutpend {
        data {
          id
          attributes {
            users_permissions_user { data { id attributes { username profilePic { data { attributes { url formats } } } } } }
            project { data { ...ForumProjectSummaryCore } }
            sheirut { data { id attributes { name project { data { ...ForumProjectSummaryCore } } } } }
          }
        }
      }
      mesimabetahaliches {
        data {
          id
          attributes {
            name
            descrip
            project { data { ...ForumProjectSummaryCore } }
          }
        }
      }
      decisions(pagination: { limit: 5 }) {
        data {
          id
          attributes {
            kind
            sale {
              data {
                id
                attributes {
                  reporter { data { id attributes { username profilePic { data { attributes { url formats } } } } } }
                  users_permissions_user { data { id attributes { username profilePic { data { attributes { url formats } } } } } }
                }
              }
            }
          }
        }
      }
    }
  }

  fragment ForumProjectSummaryCore on ProjectEntity {
    id
    attributes {
      projectName
      profilePic { data { attributes { url formats } } }
      user_1s {
        data {
          id
          attributes {
            username
            profilePic { data { attributes { url formats } } }
          }
        }
      }
    }
  }`,

  '104getUserForumSources': `query GetUserForumSources($uid: ID!) {
    usersPermissionsUser(id: $uid) {
      data {
        id
        attributes {
          username
          projects_1s {
            data {
              id
              attributes {
                projectName
                profilePic { data { attributes { url formats } } }
                forums(sort: ["updatedAt:desc"], pagination: { limit: 100 }) {
                  data { ...ForumListCore }
                }
              }
            }
          }
          halukasres {
            data {
              id
              attributes {
                forum { data { ...ForumListCore } }
              }
            }
          }
          halukasend {
            data {
              id
              attributes {
                forum { data { ...ForumListCore } }
              }
            }
          }
          pgishausers {
            data {
              id
              attributes {
                pgishas {
                  data {
                    id
                    attributes {
                      forum { data { ...ForumListCore } }
                    }
                  }
                }
              }
            }
          }
          asks {
            data {
              id
              attributes {
                forums { data { ...ForumListCore } }
              }
            }
          }
          sheirutpends {
            data {
              id
              attributes {
                forum { data { ...ForumListCore } }
                sheirut { data { id attributes { forums { data { ...ForumListCore } } } } }
              }
            }
          }
          sheiruts {
            data {
              id
              attributes {
                forums { data { ...ForumListCore } }
              }
            }
          }
          ratson_proposals {
            data {
              id
              attributes {
                forum { data { ...ForumListCore } }
              }
            }
          }
          ratsons {
            data {
              id
              attributes {
                ratson_proposals {
                  data {
                    id
                    attributes {
                      forum { data { ...ForumListCore } }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }

  fragment ForumListCore on ForumEntity {
    id
    attributes {
      subject
      spec
      done
      createdAt
      publishedAt
      updatedAt
      messages(filters: { archived: { ne: true } }, sort: ["when:desc"], pagination: { limit: 1 }) {
        data {
          id
          attributes {
            content
            when
            users_permissions_user {
              data { id attributes { username profilePic { data { attributes { url formats } } } } }
            }
          }
        }
      }
      project { data { ...ForumListProjectCore } }
      ratson_proposal {
        data {
          id
          attributes {
            ratson {
              data {
                id
                attributes {
                  name
                  users_permissions_users {
                    data { id attributes { username profilePic { data { attributes { url formats } } } } }
                  }
                }
              }
            }
            proposer_users {
              data { id attributes { username profilePic { data { attributes { url formats } } } } }
            }
          }
        }
      }
      haluka {
        data {
          id
          attributes {
            amount
            usersend { data { id attributes { username profilePic { data { attributes { url formats } } } } } }
            userrecive { data { id attributes { username profilePic { data { attributes { url formats } } } } } }
            project { data { ...ForumListProjectCore } }
          }
        }
      }
      pgisha {
        data {
          id
          attributes {
            name
            desc
            publishedAt
            pgishausers {
              data {
                id
                attributes {
                  users_permissions_user {
                    data { id attributes { username profilePic { data { attributes { url formats } } } } }
                  }
                }
              }
            }
          }
        }
      }
      asks {
        data {
          id
          attributes {
            users_permissions_user { data { id attributes { username profilePic { data { attributes { url formats } } } } } }
            project { data { ...ForumListProjectCore } }
          }
        }
      }
      sheiruts {
        data {
          id
          attributes {
            name
            descrip
            project { data { ...ForumListProjectCore } }
            users_permissions_users { data { id attributes { username profilePic { data { attributes { url formats } } } } } }
            sheirutpend {
              data {
                id
                attributes {
                  users_permissions_user { data { id attributes { username profilePic { data { attributes { url formats } } } } } }
                }
              }
            }
          }
        }
      }
      sheirutpend {
        data {
          id
          attributes {
            users_permissions_user { data { id attributes { username profilePic { data { attributes { url formats } } } } } }
            project { data { ...ForumListProjectCore } }
            sheirut { data { id attributes { name project { data { ...ForumListProjectCore } } } } }
          }
        }
      }
      mesimabetahaliches {
        data {
          id
          attributes {
            name
            descrip
            project { data { ...ForumListProjectCore } }
          }
        }
      }
      decisions(pagination: { limit: 5 }) {
        data {
          id
          attributes {
            kind
            sale {
              data {
                id
                attributes {
                  reporter { data { id attributes { username profilePic { data { attributes { url formats } } } } } }
                  users_permissions_user { data { id attributes { username profilePic { data { attributes { url formats } } } } } }
                }
              }
            }
          }
        }
      }
    }
  }

  fragment ForumListProjectCore on ProjectEntity {
    id
    attributes {
      projectName
      profilePic { data { attributes { url formats } } }
      user_1s {
        data {
          id
          attributes {
            username
            profilePic { data { attributes { url formats } } }
          }
        }
      }
    }
  }`,

  'getMashaabims': `query getMashaabims { mashaabims { data { id attributes { name descrip price kindOf linkto } } } }`,
  'getUserSpByMashaabim': `query GetUserSpByMashaabim($idL: ID!, $mashaabimId: ID!) {
    usersPermissionsUser(id: $idL) {
      data {
        attributes {
          sps(filters: { mashaabim: { id: { eq: $mashaabimId } }, archived: { eq: false }, panui: { ne: false } }) {
            data {
              id
              attributes {
                name
                panui
              }
            }
          }
        }
      }
    }
  }`
};

export const qids = {
  '85levHubSummary': `query LevHubSummary($idL: ID!) {
  usersPermissionsUser(id: $idL) {
    data {
      id
      attributes {
        username
        hervachti
        profilePic {
          data {
            attributes {
              url
            }
          }
        }
        # Purchases (user as buyer)
        sheiruts(filters: { archived: { eq: false }, isApruved: { eq: true } }) {
          data {
            id
            attributes {
              moneyTransfered
              productExepted
            }
          }
        }
        # Active missions count (proxy for suggestions KPI)
        mesimabetahaliches(
          filters: { forappruval: { eq: false }, finnished: { eq: false } }
        ) {
          data {
            id
          }
        }
        projects_1s {
          data {
            id
            attributes {
              projectName
              # Mission applications – members vote via pendms.users (ordered)
              pendms(filters: { archived: { eq: false } }) {
                data {
                  id
                  attributes {
                    name
                    createdAt
                    timegrama {
                      data {
                        attributes {
                          date
                        }
                      }
                    }
                    negopendmissions {
                      data {
                        id
                      }
                    }
                    users {
                      what
                      order
                      users_permissions_user {
                        data {
                          id
                        }
                      }
                    }
                  }
                }
              }
              # Completion approvals – members vote via finiapruvals.vots (no order)
              finiapruvals(filters: { archived: { eq: false } }) {
                data {
                  id
                  attributes {
                    missname
                    createdAt
                    timegrama {
                      data {
                        attributes {
                          date
                        }
                      }
                    }
                    vots {
                      what
                      users_permissions_user {
                        data {
                          id
                        }
                      }
                    }
                  }
                }
              }
              # Resource requests – members vote via askms.vots (no order)
              askms(filters: { archived: { eq: false } }) {
                data {
                  id
                  attributes {
                    createdAt
                    timegrama {
                      data {
                        attributes {
                          date
                        }
                      }
                    }
                    open_mashaabim {
                      data {
                        attributes {
                          name
                        }
                      }
                    }
                    pmash {
                      data {
                        attributes {
                          name
                        }
                      }
                    }
                    sp {
                      data {
                        attributes {
                          name
                        }
                      }
                    }
                    vots {
                      what
                      users_permissions_user {
                        data {
                          id
                        }
                      }
                    }
                  }
                }
              }
              # Resource approvals – members vote via maaps.vots (no order)
              maaps(filters: { archived: { eq: false } }) {
                data {
                  id
                  attributes {
                    name
                    createdAt
                    timegrama {
                      data {
                        attributes {
                          date
                        }
                      }
                    }
                    mashabetahalich {
                      data {
                        attributes {
                          name
                        }
                      }
                    }
                    vots {
                      what
                      users_permissions_user {
                        data {
                          id
                        }
                      }
                    }
                  }
                }
              }
              # Project decisions – members vote via decisions.vots (no orderon, any vote counts)
              decisions(filters: { archived: { eq: false } }) {
                data {
                  id
                  attributes {
                    kind
                    createdAt
                    timegrama {
                      data {
                        attributes {
                          date
                        }
                      }
                    }
                    vots {
                      what
                      users_permissions_user {
                        data {
                          id
                        }
                      }
                    }
                  }
                }
              }
              # Split proposals – members vote via tosplits.vots (ordered)
              tosplits(filters: { finished: { eq: false } }) {
                data {
                  id
                  attributes {
                    name
                    createdAt
                    vots {
                      what
                      order
                      users_permissions_user {
                        data {
                          id
                        }
                      }
                    }
                  }
                }
              }
              # Service purchase requests – members vote via sheirutpends.votes (relational, ordered)
              sheirutpends(filters: { archived: { eq: false } }) {
                data {
                  id
                  attributes {
                    createdAt
                    sheirut {
                      data {
                        attributes {
                          name
                        }
                      }
                    }
                    timegrama {
                      data {
                        attributes {
                          date
                        }
                      }
                    }
                    votes {
                      data {
                        id
                        attributes {
                          what
                          order
                          users_permissions_user {
                            data {
                              id
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
              # Sales (user as seller)
              sheiruts(
                filters: { archived: { eq: false }, isApruved: { eq: true } }
              ) {
                data {
                  id
                  attributes {
                    moneyTransfered
                    productExepted
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`,

  // ── Lev quantum (incremental) slice queries ───────────────────────────────
  // Each query returns the same mini-userData envelope as query 83, restricted
  // to one collection and optionally to a subset of projects ($pids).
  // Passing $pids: null (or omitting it) returns data for ALL projects.
  // The existing extractors in levDataExtractors.ts run unchanged on the result.

  '87levSliceSheirutp': `query LevSliceSheirutp($idL: ID!, $pids: [ID]) {
  usersPermissionsUser(id: $idL) {
    data {
      id
      attributes {
        projects_1s(filters: { id: { in: $pids } }) {
          data {
            id
            attributes {
              projectName
              restime
              user_1s {
                data {
                  id
                  attributes {
                    username
                    haskamaz
                    haskamac
                    email
                    noMail
                    haskama
                    profilePic {
                      data {
                        attributes {
                          url
                          formats
                        }
                      }
                    }
                  }
                }
              }
              profilePic {
                data {
                  attributes {
                    url
                    formats
                  }
                }
              }
              sheirutpends(filters: { archived: { eq: false } }) {
                data {
                  id
                  attributes {
                    sheirut {
                      data {
                        id
                        attributes {
                          name
                          descrip
                          equaliSplited
                          oneTime
                        }
                      }
                    }
                    startDate
                    finnishDate
                    price
                    quant
                    total
                    users_permissions_user {
                      data {
                        id
                        attributes {
                          username
                          profilePic {
                            data {
                              attributes {
                                url
                                formats
                              }
                            }
                          }
                        }
                      }
                    }
                    matanots {
                      data {
                        id
                        attributes {
                          name
                          desc
                          price
                          quant
                          kindOf
                          pic {
                            data {
                              attributes {
                                url
                                formats
                              }
                            }
                          }
                        }
                      }
                    }
                    createdAt
                    votes {
                      data {
                        id
                        attributes {
                          what
                          order
                          why
                          users_permissions_user {
                            data {
                              id
                            }
                          }
                        }
                      }
                    }
                    timegrama {
                      data {
                        id
                        attributes {
                          date
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`,

  '87levSliceSales': `query LevSliceSales($idL: ID!, $pids: [ID]) {
  usersPermissionsUser(id: $idL) {
    data {
      id
      attributes {
        projects_1s(filters: { id: { in: $pids } }) {
          data {
            id
            attributes {
              projectName
              restime
              user_1s {
                data {
                  id
                  attributes {
                    username
                    haskamaz
                    haskamac
                    email
                    noMail
                    haskama
                    profilePic {
                      data {
                        attributes {
                          url
                          formats
                        }
                      }
                    }
                  }
                }
              }
              profilePic {
                data {
                  attributes {
                    url
                    formats
                  }
                }
              }
              sheiruts {
                data {
                  id
                  attributes {
                    name
                    descrip
                    equaliSplited
                    oneTime
                    archived
                    isApruved
                    isItOnlyOneInProject
                    price
                    quant
                    startDate
                    finnishDate
                    total
                    iGotIt
                    iTransferMoney
                    iGotMoney { iGotMoney users_permissions_user { data { id } } }
                    moneyTransfered
                    productExepted
                    isSiteShareIncome
                    weFinnish {
                      data {
                        id
                        attributes {
                          what
                          order
                          why
                          users_permissions_user {
                            data {
                              id
                            }
                          }
                        }
                      }
                    }
                    iCanGetMonay {
                      data {
                        id
                        attributes {
                          username
                          profilePic {
                            data {
                              attributes {
                                url
                                formats
                              }
                            }
                          }
                        }
                      }
                    }
                    iTransferedTo {
                      data {
                        id
                        attributes {
                          username
                          profilePic {
                            data {
                              attributes {
                                url
                                formats
                              }
                            }
                          }
                        }
                      }
                    }
                    users_permissions_users {
                      data {
                        id
                        attributes {
                          username
                          profilePic {
                            data {
                              attributes {
                                url
                                formats
                              }
                            }
                          }
                        }
                      }
                    }
                    matanot {
                      data {
                        id
                        attributes {
                          name
                          desc
                          price
                          quant
                          kindOf
                          pic {
                            data {
                              attributes {
                                url
                                formats
                              }
                            }
                          }
                        }
                      }
                    }
                    forums {
                      data {
                        id
                        attributes {
                          messages(pagination: { limit: 50 }) {
                            data {
                              id
                              attributes {
                                content
                                createdAt
                                users_permissions_user {
                                  data {
                                    id
                                    attributes {
                                      username
                                      profilePic {
                                        data {
                                          attributes {
                                            url
                                            formats
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                    halukas(filters: { ushar: { eq: true } }) {
                      data {
                        id
                        attributes {
                          senderconf
                          confirmed
                          amount
                          isSiteShare
                          forum { data { id } }
                          usersend {
                            data {
                              id
                              attributes {
                                username
                                profilePic { data { attributes { url formats } } }
                              }
                            }
                          }
                          userrecive {
                            data {
                              id
                              attributes {
                                username
                                profilePic { data { attributes { url formats } } }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`,

  '87levSliceFiapp': `query LevSliceFiapp($idL: ID!, $pids: [ID]) {
  usersPermissionsUser(id: $idL) {
    data {
      id
      attributes {
        projects_1s(filters: { id: { in: $pids } }) {
          data {
            id
            attributes {
              projectName
              restime
              user_1s {
                data {
                  id
                  attributes {
                    username
                    haskamaz
                    haskamac
                    email
                    noMail
                    haskama
                    profilePic {
                      data {
                        attributes {
                          url
                          formats
                        }
                      }
                    }
                  }
                }
              }
              profilePic {
                data {
                  attributes {
                    url
                    formats
                  }
                }
              }
              finiapruvals(filters: { archived: { eq: false } }) {
                data {
                  id
                  attributes {
                    timegrama {
                      data {
                        id
                        attributes {
                          date
                        }
                      }
                    }
                    missname
                    noofhours
                    why
                    what {
                      data {
                        id
                        attributes {
                          url
                          formats
                        }
                      }
                    }
                    mesimabetahalich {
                      data {
                        id
                        attributes {
                          perhour
                          hearotMeyuchadot
                          descrip
                          mission {
                            data {
                              id
                            }
                          }
                        }
                      }
                    }
                    vots {
                      what
                      why
                      id
                      users_permissions_user {
                        data {
                          id
                        }
                      }
                    }
                    project {
                      data {
                        id
                      }
                    }
                    users_permissions_user {
                      data {
                        id
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`,

  '87levSliceDecisions': `query LevSliceDecisions($idL: ID!, $pids: [ID]) {
  usersPermissionsUser(id: $idL) {
    data {
      id
      attributes {
        projects_1s(filters: { id: { in: $pids } }) {
          data {
            id
            attributes {
              projectName
              restime
              user_1s {
                data {
                  id
                  attributes {
                    username
                    haskamaz
                    haskamac
                    email
                    noMail
                    haskama
                    profilePic {
                      data {
                        attributes {
                          url
                          formats
                        }
                      }
                    }
                  }
                }
              }
              profilePic {
                data {
                  attributes {
                    url
                    formats
                  }
                }
              }
              decisions(filters: { archived: { eq: false } }) {
                data {
                  id
                  attributes {
                    kind
                    createdAt
                    timegrama {
                      data {
                        id
                        attributes {
                          date
                        }
                      }
                    }
                    newpic {
                      data {
                        id
                        attributes {
                          url
                          formats
                        }
                      }
                    }
                    vots {
                      what
                      why
                      id
                      order
                      users_permissions_user {
                        data {
                          id
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`,

  '87levSlicePends': `query LevSlicePends($idL: ID!, $pids: [ID]) {
  usersPermissionsUser(id: $idL) {
    data {
      id
      attributes {
        projects_1s(filters: { id: { in: $pids } }) {
          data {
            id
            attributes {
              projectName
              restime
              user_1s {
                data {
                  id
                  attributes {
                    username
                    haskamaz
                    haskamac
                    email
                    noMail
                    haskama
                    profilePic {
                      data {
                        attributes {
                          url
                          formats
                        }
                      }
                    }
                  }
                }
              }
              profilePic {
                data {
                  attributes {
                    url
                    formats
                  }
                }
              }
              pendms(filters: { archived: { eq: false }, matanot_recipe_missions: { id: { null: true } } }) {
                data {
                  id
                  attributes {
                    name
                    createdAt
                    iskvua
                    hearotMeyuchadot
                    descrip
                    noofhours
                    perhour
                    sqadualed
                    privatlinks
                    publicklinks
                    dates
                    location {
                      location_mode
                      lat
                      lng
                      radius
                      location_hint
                    }
                    rishon {
                      data {
                        id
                      }
                    }
                    acts {
                      data {
                        id
                        attributes {
                          shem
                          link
                          des
                          dateF
                          dateS
                        }
                      }
                    }
                    negopendmissions(sort: "ordern:desc") {
                      data {
                        id
                        attributes {
                          name
                          hearotMeyuchadot
                          descrip
                          createdAt
                          ordern
                          proposedBy
                          noofhours
                          perhour
                          isOriginal
                          date
                          dates
                          isMonth
                          location {
                            location_mode
                            lat
                            lng
                            radius
                            location_hint
                          }
                          users_permissions_user {
                            data {
                              id
                              attributes {
                                username
                              }
                            }
                          }
                          skills {
                            data {
                              id
                              attributes {
                                skillName
                                localizations {
                                  data {
                                    attributes {
                                      skillName
                                    }
                                  }
                                }
                              }
                            }
                          }
                          tafkidims {
                            data {
                              id
                              attributes {
                                roleDescription
                                localizations {
                                  data {
                                    attributes {
                                      roleDescription
                                    }
                                  }
                                }
                              }
                            }
                          }
                          work_ways {
                            data {
                              id
                              attributes {
                                workWayName
                                localizations {
                                  data {
                                    attributes {
                                      workWayName
                                    }
                                  }
                                }
                              }
                            }
                          }
                          acts {
                            data {
                              id
                              attributes {
                                shem
                                link
                                des
                                dateF
                                dateS
                              }
                            }
                          }
                        }
                      }
                    }
                    skills {
                      data {
                        id
                        attributes {
                          skillName
                          localizations {
                            data {
                              attributes {
                                skillName
                              }
                            }
                          }
                        }
                      }
                    }
                    tafkidims {
                      data {
                        id
                        attributes {
                          roleDescription
                          localizations {
                            data {
                              attributes {
                                roleDescription
                              }
                            }
                          }
                        }
                      }
                    }
                    work_ways {
                      data {
                        id
                        attributes {
                          workWayName
                          localizations {
                            data {
                              attributes {
                                workWayName
                              }
                            }
                          }
                        }
                      }
                    }
                    mission {
                      data {
                        id
                      }
                    }
                    vallues {
                      data {
                        id
                      }
                    }
                    timegrama {
                      data {
                        id
                        attributes {
                          date
                        }
                      }
                    }
                    diun {
                      what
                      why
                      id
                      zman
                      order
                      users_permissions_user {
                        data {
                          id
                        }
                      }
                    }
                    users {
                      what
                      order
                      why
                      zman
                      id
                      users_permissions_user {
                        data {
                          id
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`,

  '87levSliceWegets': `query LevSliceWegets($idL: ID!, $pids: [ID]) {
  usersPermissionsUser(id: $idL) {
    data {
      id
      attributes {
        projects_1s(filters: { id: { in: $pids } }) {
          data {
            id
            attributes {
              projectName
              restime
              user_1s {
                data {
                  id
                  attributes {
                    username
                    haskamaz
                    haskamac
                    email
                    noMail
                    haskama
                    profilePic {
                      data {
                        attributes {
                          url
                          formats
                        }
                      }
                    }
                  }
                }
              }
              profilePic {
                data {
                  attributes {
                    url
                    formats
                  }
                }
              }
              maaps(filters: { archived: { eq: false } }) {
                data {
                  id
                  attributes {
                    createdAt
                    name
                    quantityDelivered
                    cycleIndex
                    cycleStart
                    cycleEnd
                    mashabetahalich {
                      data {
                        id
                        attributes {
                          name
                          pricePerUnit
                          kindOf
                          start
                          end
                          status_mashab
                          users_permissions_user { data { id } }
                        }
                      }
                    }
                    timegrama { data { id attributes { date done } } }
                    sp {
                      data {
                        id
                        attributes {
                          name
                          myp
                          unit
                          users_permissions_user {
                            data {
                              id
                              attributes {
                                username
                                profilePic {
                                  data {
                                    attributes {
                                      url
                                      formats
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                    open_mashaabim {
                      data {
                        id
                        attributes {
                          name
                          sqadualed
                          sqadualedf
                          kindOf
                          spnot
                          easy
                        }
                      }
                    }
                    vots {
                      what
                      why
                      id
                      order
                      users_permissions_user {
                        data {
                          id
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`,

  '87levSliceAskedResources': `query LevSliceAskedResources($idL: ID!, $pids: [ID]) {
  usersPermissionsUser(id: $idL) {
    data {
      id
      attributes {
        projects_1s(filters: { id: { in: $pids } }) {
          data {
            id
            attributes {
              projectName
              restime
              user_1s {
                data {
                  id
                  attributes {
                    username
                    haskamaz
                    haskamac
                    email
                    noMail
                    haskama
                    profilePic {
                      data {
                        attributes {
                          url
                          formats
                        }
                      }
                    }
                  }
                }
              }
              profilePic {
                data {
                  attributes {
                    url
                    formats
                  }
                }
              }
              askms(filters: { archived: { eq: false } }) {
                data {
                  id
                  attributes {
                    isSelfProposal
                    pendingMainVote
                    vots {
                      what
                      zman
                      why
                      id
                      users_permissions_user {
                        data {
                          id
                        }
                      }
                    }
                    timegrama {
                      data {
                        id
                        attributes {
                          date
                          done
                        }
                      }
                    }
                    nego_mashes(sort: "ordern:desc") {
                      data {
                        id
                        attributes {
                          ordern
                          proposedBy
                          status
                          name
                          descrip
                          spnot
                          easy
                          hm
                          price
                          kindOf
                          sqadualed
                          sqadualedf
                          linkto
                        }
                      }
                    }
                    createdAt
                    chat {
                      why
                      ide
                      what
                      zman
                      id
                      users_permissions_user {
                        data {
                          id
                        }
                      }
                    }
                    users_permissions_user {
                      data {
                        id
                        attributes {
                          username
                          profilePic {
                            data {
                              attributes {
                                url
                                formats
                              }
                            }
                          }
                        }
                      }
                    }
                    open_mashaabim {
                      data {
                        id
                        attributes {
                          price
                          descrip
                          spnot
                          kindOf
                          sqadualedf
                          sqadualed
                          linkto
                          createdAt
                          hm
                          name
                          easy
                          recurring
                          cycleSize
                        }
                      }
                    }
                    pmash {
                      data {
                        id
                        attributes {
                          name
                          descrip
                          spnot
                          price
                          easy
                          hm
                          kindOf
                          sqadualed
                          sqadualedf
                          recurring
                          cycleSize
                        }
                      }
                    }
                    sp {
                      data {
                        id
                        attributes {
                          name
                          descrip
                          price
                          myp
                          spnot
                          users_permissions_user {
                            data {
                              id
                              attributes {
                                username
                                profilePic {
                                  data {
                                    attributes {
                                      url
                                      formats
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`,

  '87levSliceHalukas': `query LevSliceHalukas($idL: ID!, $pids: [ID]) {
  usersPermissionsUser(id: $idL) {
    data {
      id
      attributes {
        projects_1s(filters: { id: { in: $pids } }) {
          data {
            id
            attributes {
              projectName
              restime
              user_1s {
                data {
                  id
                  attributes {
                    username
                    haskamaz
                    haskamac
                    email
                    noMail
                    haskama
                    profilePic {
                      data {
                        attributes {
                          url
                          formats
                        }
                      }
                    }
                  }
                }
              }
              profilePic {
                data {
                  attributes {
                    url
                    formats
                  }
                }
              }
              tosplits(filters: { finished: { eq: false } }) {
                data {
                  id
                  attributes {
                    name
                    halukas {
                      data {
                        id
                        attributes {
                          amount
                          confirmed
                          usersend { data { id } }
                          userrecive { data { id } }
                        }
                      }
                    }
                    vots {
                      what
                      why
                      id
                      users_permissions_user {
                        data {
                          id
                        }
                      }
                    }
                    hervachti {
                      amount
                      noten
                      mekabel
                      users_permissions_user {
                        data {
                          id
                          attributes {
                            hervachti
                          }
                        }
                      }
                    }
                    siteShareHalukas {
                      data {
                        id
                        attributes {
                          amount
                          confirmed
                          senderconf
                          proposedAmount
                          adjustDirection
                          adjustReason
                          usersend { data { id } }
                          userrecive { data { id } }
                          recive_project {
                            data {
                              id
                              attributes {
                                projectName
                                profilePic { data { attributes { url } } }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`,

  '87levSliceMtaha': `query LevSliceMtaha($idL: ID!, $pids: [ID]) {
  usersPermissionsUser(id: $idL) {
    data {
      id
      attributes {
        username
        profilePic {
          data {
            attributes {
              url
              formats
            }
          }
        }
        projects_1s(filters: { id: { in: $pids } }) {
          data {
            id
            attributes {
              projectName
              restime
              user_1s {
                data {
                  id
                  attributes {
                    username
                    haskamaz
                    haskamac
                    email
                    noMail
                    haskama
                    profilePic {
                      data {
                        attributes {
                          url
                          formats
                        }
                      }
                    }
                  }
                }
              }
              profilePic {
                data {
                  attributes {
                    url
                    formats
                  }
                }
              }
            }
          }
        }
        mesimabetahaliches(
          filters: { forappruval: { eq: false }, finnished: { eq: false }, project: { id: { in: $pids } } }
        ) {
          data {
            id
            attributes {
              status
              stname
              timer
              hearotMeyuchadot
              name
              descrip
              hoursassinged
              perhour
              privatlinks
              publicklinks
              iskvua
              howmanyhoursalready
              admaticedai
              dates
              forums{ 
              data { id 
              }
              }
              mission {
                data {
                  id
                }
              }
              project {
                data {
                  id
                  attributes {
                    projectName
                  }
                }
              }
              acts {
                data {
                  id
                  attributes {
                    shem
                    myIshur
                    link
                    vali{data{id attributes{ username profilePic {data{attributes{ url }}}}}}
                    hashivut
                    valiIshur
                    des
                    dateF
                    dateS
                    status
                    naasa
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`,

  '87levSlicePurchases': `query LevSlicePurchases($idL: ID!, $pids: [ID]) {
  usersPermissionsUser(id: $idL) {
    data {
      id
      attributes {
        username
        profilePic {
          data {
            attributes {
              url
              formats
            }
          }
        }
        sheiruts(filters: { project: { id: { in: $pids } } }) {
          data {
            id
            attributes {
              project {
                data {
                  id
                  attributes {
                    projectName
                    user_1s {
                      data {
                        id
                        attributes {
                          username
                          profilePic {
                            data {
                              attributes {
                                url
                                formats
                              }
                            }
                          }
                        }
                      }
                    }
                    profilePic {
                      data {
                        attributes {
                          url
                          formats
                        }
                      }
                    }
                  }
                }
              }
              name
              descrip
              equaliSplited
              oneTime
              archived
              isApruved
              price
              quant
              startDate
              finnishDate
              total
              iGotIt
              iTransferMoney
              iGotMoney { iGotMoney users_permissions_user { data { id } } }
              moneyTransfered
              productExepted
              weFinnish {
                data {
                  id
                  attributes {
                    what
                    order
                    why
                    users_permissions_user {
                      data {
                        id
                      }
                    }
                  }
                }
              }
              iCanGetMonay {
                data {
                  id
                  attributes {
                    username
                    profilePic {
                      data {
                        attributes {
                          url
                          formats
                        }
                      }
                    }
                  }
                }
              }
              iTransferedTo {
                data {
                  id
                  attributes {
                    username
                    profilePic {
                      data {
                        attributes {
                          url
                          formats
                        }
                      }
                    }
                  }
                }
              }
              users_permissions_users {
                data {
                  id
                  attributes {
                    username
                    profilePic {
                      data {
                        attributes {
                          url
                          formats
                        }
                      }
                    }
                  }
                }
              }
              matanot {
                data {
                  id
                  attributes {
                    name
                    desc
                    price
                    quant
                    kindOf
                    pic {
                      data {
                        attributes {
                          url
                          formats
                        }
                      }
                    }
                  }
                }
              }
              forums {
                data {
                  id
                  attributes {
                    messages(pagination: { limit: 50 }) {
                      data {
                        id
                        attributes {
                          content
                          createdAt
                          users_permissions_user {
                            data {
                              id
                              attributes {
                                username
                                profilePic {
                                  data {
                                    attributes {
                                      url
                                      formats
                                    }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
              halukas(filters: { ushar: { eq: true } }) {
                data {
                  id
                  attributes {
                    senderconf
                    confirmed
                    amount
                    forum { data { id } }
                    usersend { data { id } }
                    userrecive {
                      data {
                        id
                        attributes {
                          username
                          profilePic { data { attributes { url formats } } }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`,

  // ── Concierge live enrichment (PLAN_CONCIERGE §6/§7) ──────────────────────
  // Search the mission library by a skill/term — used to surface existing
  // missions that already answer a freshly-typed wish.
  '200findMissionsBySkill': `query FindMissionsBySkill($q: String) {
    missions(
      filters: { or: [ { missionName: { containsi: $q } }, { descrip: { containsi: $q } }, { skills: { skillName: { containsi: $q } } } ] }
      pagination: { limit: 6 }
    ) {
      data {
        id
        attributes {
          missionName
          descrip
          skills { data { id attributes { skillName } } }
        }
      }
    }
  }`,

  // Find real platform members who hold a given skill — the heart of
  // "check if there are people with these skills and suggest them".
  '201findUsersBySkill': `query FindUsersBySkill($q: String) {
    usersPermissionsUsers(
      filters: { skills: { skillName: { containsi: $q } } }
      pagination: { limit: 8 }
    ) {
      data {
        id
        attributes {
          username
          profilePic { data { attributes { url formats } } }
          skills { data { id attributes { skillName } } }
          projects_1s { data { id attributes { projectName } } }
        }
      }
    }
  }`,

  // Find *available* resource instances (Sp = who holds a resource; mashaabim is
  // the template). panui=true means free. Used to suggest real resources +
  // their owners for a wish's extracted resources.
  '202findAvailableSp': `query FindAvailableSp($q: String) {
    sps(
      filters: {
        archived: { eq: false }
        panui: { eq: true }
        or: [
          { name: { containsi: $q } }
          { descrip: { containsi: $q } }
          { mashaabim: { name: { containsi: $q } } }
        ]
      }
      pagination: { limit: 6 }
    ) {
      data {
        id
        attributes {
          name
          descrip
          price
          panui
          kindOf
          mashaabim { data { id attributes { name } } }
          users_permissions_user { data { id attributes { username profilePic { data { attributes { url } } } } } }
          project { data { id attributes { projectName } } }
        }
      }
    }
  }`,

  // Find existing *products* (matanot) a weave (project) already offers, by name.
  // A wish's need may be fulfilled by a ready product — picking one routes into
  // the built-in service-request flow (createSheirutpend). Active, non-archived only.
  '203findMatanotByText': `query FindMatanotByText($q: String) {
    matanots(
      filters: {
        archived: { eq: false }
        status_of_voting: { eq: "active" }
        name: { containsi: $q }
      }
      pagination: { limit: 6 }
    ) {
      data {
        id
        attributes {
          name
          desc
          price
          estimatedPrice
          currency { data { id attributes { name simbol } } }
          projectcreates {
            data { id attributes { projectName profilePic { data { attributes { url } } } } }
          }
        }
      }
    }
  }`,

  '204getAllMashaabims': `query GetAllMashaabims {
    mashaabims(pagination: { limit: 500 }) {
      data { id attributes { name } }
    }
  }`,

  '205getMashaabimsByIds': `query GetMashaabimsByIds($ids: [ID]) {
    mashaabims(filters: { id: { in: $ids } }) {
      data { id attributes { name descrip kindOf price linkto } }
    }
  }`,

  '206getSpForEdit': `query GetSpForEdit($spId: ID!) {
    sp(id: $spId) {
      data { id attributes {
        name descrip kindOf unit spnot price myp linkto
        users_permissions_user { data { id } }
        sdate fdate
      } }
    }
    me { id }
  }`,

  // ── Discovery map (PLAN_DISCOVERY_MAP §5) ────────────────────────────────
  // Public queries feeding /demand. 220–222 run against the live schema;
  // 223mapMaagadim targets the maagad collections (SPEC_SHARED_PURCHASE_MAP in
  // 1.0b) and is called behind a guard until they exist in production.

  '220mapJoinableRatsons': `query MapJoinableRatsons {
    ratsons(
      filters: {
        and: [
          { status_ratson: { in: ["open", "matching"] } }
          { access_mode: { ne: "personal" } }
          { or: [{ allowJoin: { eq: true } }, { joinKind: { notIn: ["solo"] } }] }
        ]
      }
      pagination: { limit: 250 }
      sort: "createdAt:desc"
    ) {
      data { id attributes {
        name status_ratson access_mode isOnline lat lng radius location_hint
        allowJoin joinKind minJoiners maxJoiners joinDeadline frequency
        categories { data { id attributes { name } } }
        ratson_shares { data { id } }
      } }
    }
  }`,

  '221mapOpenMissions': `query MapOpenMissions {
    openMissions(
      filters: { archived: { eq: false } }
      pagination: { limit: 250 }
      sort: "createdAt:desc"
    ) {
      data { id attributes {
        name descrip noofhours perhour isglobal dates source
        location { lat lng radius location_hint location_mode }
        project { data { id attributes { projectName location { lat lng radius location_hint location_mode } } } }
        skills { data { id attributes { skillName } } }
        ratson { data { id attributes { lat lng radius isOnline } } }
      } }
    }
  }`,

  '222mapOpenMashaabims': `query MapOpenMashaabims {
    openMashaabims(
      filters: { archived: { eq: false } }
      pagination: { limit: 250 }
      sort: "createdAt:desc"
    ) {
      data { id attributes {
        name descrip kindOf source
        location { lat lng radius location_hint location_mode }
        project { data { id attributes { projectName location { lat lng radius location_hint location_mode } } } }
        ratson { data { id attributes { lat lng radius isOnline } } }
      } }
    }
  }`,

  '223mapMaagadim': `query MapMaagadim {
    maagads(
      filters: { status_maagad: { in: ["forming", "visible", "offered"] } }
      pagination: { limit: 250 }
    ) {
      data { id attributes {
        name canonical_desc scope lat lng radius frequency status_maagad viability_hint
        members(filters: { status_member: { in: ["interested", "signed", "active"] } }) { data { id } }
        offers(filters: { status_offer: { eq: "open" } }) {
          data { id attributes { title unit_price min_participants max_participants signed_count sign_deadline status_offer } }
        }
      } }
    }
  }`,

  // ── Maagad actions (PLAN_SHARED_PURCHASE Track B/C, PLAN_DISCOVERY_MAP M2) ─

  '224crMaagad': `mutation CrMaagad(
    $name: String, $canonical_desc: String, $scope: ENUM_MAAGAD_SCOPE,
    $lat: Float, $lng: Float, $radius: Long, $frequency: String,
    $status_maagad: ENUM_MAAGAD_STATUS_MAAGAD, $origin: ENUM_MAAGAD_ORIGIN,
    $viability_hint: Int, $ratsons: [ID], $publishedAt: DateTime
  ) {
    createMaagad(data: {
      name: $name, canonical_desc: $canonical_desc, scope: $scope,
      lat: $lat, lng: $lng, radius: $radius, frequency: $frequency,
      status_maagad: $status_maagad, origin: $origin,
      viability_hint: $viability_hint, ratsons: $ratsons, publishedAt: $publishedAt
    }) {
      data { id attributes { name status_maagad origin scope } }
    }
  }`,

  '225crMaagadMember': `mutation CrMaagadMember(
    $maagad: ID!, $user: ID!, $ratson: ID,
    $status_member: ENUM_MAAGADMEMBER_STATUS_MEMBER,
    $visibility: ENUM_MAAGADMEMBER_VISIBILITY,
    $joinedAt: DateTime, $publishedAt: DateTime
  ) {
    createMaagadMember(data: {
      maagad: $maagad, user: $user, ratson: $ratson,
      status_member: $status_member, visibility: $visibility,
      joinedAt: $joinedAt, publishedAt: $publishedAt
    }) {
      data { id attributes { status_member visibility } }
    }
  }`,

  '226updateMaagadMember': `mutation UpdateMaagadMember(
    $id: ID!, $status_member: ENUM_MAAGADMEMBER_STATUS_MEMBER,
    $signed_offer: ID, $options: JSON,
    $visibility: ENUM_MAAGADMEMBER_VISIBILITY,
    $sheirutpend: ID,
    $signedAt: DateTime, $leftAt: DateTime
  ) {
    updateMaagadMember(id: $id, data: {
      status_member: $status_member, signed_offer: $signed_offer,
      options: $options, visibility: $visibility, sheirutpend: $sheirutpend,
      signedAt: $signedAt, leftAt: $leftAt
    }) {
      data { id attributes { status_member } }
    }
  }`,

  // Atomic-activation deal (PLAN_SHARED_PURCHASE §7.2): a per-member Sheirutpend
  // on the supplier's rikma, tagged with the maagad_offer. conditional=false =
  // live deal (created only at activation, so no orphan pends on unsign/expire).
  '235crMaagadSheirutpend': `mutation CrMaagadSheirutpend(
    $project: ID!, $userId: ID!, $maagadOffer: ID!,
    $price: Float, $quant: Float, $total: Float, $publishedAt: DateTime
  ) {
    createSheirutpend(data: {
      project: $project,
      users_permissions_user: $userId,
      maagad_offer: $maagadOffer,
      conditional: false,
      appruved: false,
      price: $price, quant: $quant, total: $total,
      publishedAt: $publishedAt
    }) {
      data { id attributes { price total conditional } }
    }
  }`,

  '227crMaagadOffer': `mutation CrMaagadOffer(
    $maagad: ID!, $proposer_user: ID, $proposer_project: ID,
    $title: String, $description: String,
    $unit_price: Float, $currency: ID, $price_tiers: JSON,
    $min_participants: Int, $max_participants: Int,
    $sign_deadline: DateTime, $options: JSON,
    $recurrence: ENUM_MAAGADOFFER_RECURRENCE, $cycle_terms: JSON,
    $cancellation_terms: String, $publishedAt: DateTime
  ) {
    createMaagadOffer(data: {
      maagad: $maagad, proposer_user: $proposer_user, proposer_project: $proposer_project,
      title: $title, description: $description,
      unit_price: $unit_price, currency: $currency, price_tiers: $price_tiers,
      min_participants: $min_participants, max_participants: $max_participants,
      sign_deadline: $sign_deadline, options: $options,
      recurrence: $recurrence, cycle_terms: $cycle_terms,
      cancellation_terms: $cancellation_terms, status_offer: open,
      signed_count: 0, publishedAt: $publishedAt
    }) {
      data { id attributes { title status_offer min_participants sign_deadline } }
    }
  }`,

  '228updateMaagadOffer': `mutation UpdateMaagadOffer(
    $id: ID!, $signed_count: Int, $status_offer: ENUM_MAAGADOFFER_STATUS_OFFER
  ) {
    updateMaagadOffer(id: $id, data: {
      signed_count: $signed_count, status_offer: $status_offer
    }) {
      data { id attributes { signed_count status_offer } }
    }
  }`,

  '229queryMaagadFull': `query QueryMaagadFull($id: ID!) {
    maagad(id: $id) {
      data { id attributes {
        name canonical_desc scope lat lng radius frequency
        status_maagad origin viability_hint createdAt
        categories { data { id attributes { name } } }
        vallues { data { id attributes { valueName } } }
        members { data { id attributes {
          status_member visibility joinedAt
          signed_offer { data { id } }
          user { data { id attributes { username profilePic { data { attributes { url } } } } } }
        } } }
        offers { data { id attributes {
          title description unit_price price_tiers
          min_participants max_participants sign_deadline options
          recurrence cycle_terms cancellation_terms status_offer signed_count
          currency { data { id attributes { name } } }
          proposer_user { data { id attributes { username } } }
          proposer_project { data { id attributes { projectName profilePic { data { attributes { url } } } } } }
        } } }
      } }
    }
  }`,

  '230updateMaagad': `mutation UpdateMaagad(
    $id: ID!, $status_maagad: ENUM_MAAGAD_STATUS_MAAGAD,
    $lat: Float, $lng: Float, $radius: Long, $viability_hint: Int
  ) {
    updateMaagad(id: $id, data: {
      status_maagad: $status_maagad, lat: $lat, lng: $lng,
      radius: $radius, viability_hint: $viability_hint
    }) {
      data { id attributes { status_maagad } }
    }
  }`,

  '232listExpiredOpenOffers': `query ListExpiredOpenOffers($now: DateTime!) {
    maagadOffers(
      filters: { status_offer: { eq: "open" }, sign_deadline: { lt: $now } }
      pagination: { limit: 100 }
    ) {
      data { id attributes {
        title sign_deadline signed_count min_participants
        maagad { data { id attributes { status_maagad } } }
        proposer_user { data { id } }
        signed_members { data { id attributes { user { data { id } } } } }
      } }
    }
  }`,

  '231queryMyMaagadMember': `query QueryMyMaagadMember($maagadId: ID!, $userId: ID!) {
    maagadMembers(
      filters: { maagad: { id: { eq: $maagadId } }, user: { id: { eq: $userId } } }
      pagination: { limit: 1 }
    ) {
      data { id attributes { status_member visibility options signed_offer { data { id } } } }
    }
  }`,

  // Open, un-pooled wishes eligible for auto-aggregation (clusterRatsons).
  // Uses ratson.maagad / aggregation_opt_out — only available once the 1.0b
  // schema deploys, so the caller guards this query.
  '233listOpenRatsonsForClustering': `query ListOpenRatsonsForClustering {
    ratsons(
      filters: {
        and: [
          { status_ratson: { in: ["open", "matching"] } }
          { aggregation_opt_out: { ne: true } }
          { maagad: { id: { null: true } } }
        ]
      }
      pagination: { limit: 200 }
      sort: "createdAt:desc"
    ) {
      data { id attributes {
        name isOnline lat lng radius frequency language
        categories { data { id } }
        users_permissions_users { data { id } }
      } }
    }
  }`,

  // Project service-area context for /moach/[projectId]/demand (supplier lens).
  '234getProjectLocation': `query GetProjectLocation($pid: ID!) {
    project(id: $pid) {
      data { id attributes {
        projectName
        location { lat lng radius location_hint location_mode }
        vallues { data { id attributes { valueName } } }
      } }
    }
  }`,

  // ── Sale actions ──────────────────────────────────────────────────────────

  'createSaleRecord': `mutation CreateSaleRecord(
    $project: ID!,
    $matanot: ID!,
    $users_permissions_user: ID!,
    $in: Float!,
    $unit: Float!,
    $date: DateTime!,
    $publishedAt: DateTime!,
    $startDate: DateTime,
    $finishDate: DateTime,
    $note: String,
    $reporter: ID,
    $holderStatus: ENUM_SALE_HOLDERSTATUS
  ) {
    createSale(data: {
      project: $project,
      matanot: $matanot,
      users_permissions_user: $users_permissions_user,
      in: $in,
      unit: $unit,
      date: $date,
      publishedAt: $publishedAt,
      startDate: $startDate,
      finishDate: $finishDate,
      note: $note,
      reporter: $reporter,
      holderStatus: $holderStatus
    }) {
      data {
        id
        attributes {
          in
          date
          matanot { data { id attributes { name } } }
          users_permissions_user { data { id attributes { username } } }
        }
      }
    }
  }`,

  'updateMatanotQuant': `mutation UpdateMatanotQuant($id: ID!, $quant: Float!) {
    updateMatanot(id: $id, data: { quant: $quant }) {
      data {
        id
        attributes { quant }
      }
    }
  }`,

  'createMonterForSale': `mutation CreateMonterForSale($saleId: ID!, $start: DateTime!) {
    createMonter(data: {
      sale: $saleId,
      ani: "sale",
      start: $start
    }) {
      data { id }
    }
  }`,

  // ── Sale holder consent (PLAN_sale_holder_consent) ────────────────────────
  // Project restime + member ids, used to validate the claimed holder is a
  // rikma member and to schedule the silence-as-consent timegrama.
  'saleClaimProjectInfo': `query SaleClaimProjectInfo($pid: ID!) {
    project(id: $pid) {
      data {
        id
        attributes {
          projectName
          restime
          user_1s { data { id } }
        }
      }
    }
  }`,

  // A saleClaim Decision — a bilateral (reporter+holder) holder-consent claim
  // riding the existing Decision model. `sale` links it back to the report.
  'createSaleClaimDecision': `mutation CreateSaleClaimDecision(
    $projectIds: [ID],
    $sale: ID,
    $decisionName: String,
    $publishedAt: DateTime,
    $vots: [ComponentProjectsVotsInput]
  ) {
    createDecision(data: {
      projects: $projectIds,
      sale: $sale,
      kind: saleClaim,
      decisionName: $decisionName,
      publishedAt: $publishedAt,
      vots: $vots
    }) {
      data { id }
    }
  }`,

  // Link the created Decision back onto the Sale, and (re)set holderStatus.
  'updateSaleHolderLink': `mutation UpdateSaleHolderLink(
    $id: ID!,
    $decision: ID,
    $holderStatus: ENUM_SALE_HOLDERSTATUS
  ) {
    updateSale(id: $id, data: { decision: $decision, holderStatus: $holderStatus }) {
      data { id attributes { holderStatus } }
    }
  }`,

  // Full saleClaim Decision, with the linked Sale (holder + reporter), the
  // precision rounds (negom) and the standing timegrama — everything the
  // consensus/negotiation logic needs.
  'getSaleClaimDecision': `query GetSaleClaimDecision($eid: ID!) {
    decision(id: $eid) {
      data {
        id
        attributes {
          kind
          archived
          decisionName
          vots { what id order zman users_permissions_user { data { id } } }
          negom { id hm price kindOf sqadualed sqadualedf notes }
          timegrama { data { id attributes { date done } } }
          sale {
            data {
              id
              attributes {
                in
                unit
                date
                startDate
                finishDate
                note
                holderStatus
                reporter { data { id } }
                users_permissions_user { data { id } }
                matanot { data { id attributes { quant name } } }
                project { data { id attributes { restime } } }
              }
            }
          }
        }
      }
    }
  }`,

  // Append a precision round (counter): sets the full negom array + vots.
  'updateSaleClaimNego': `mutation UpdateSaleClaimNego(
    $id: ID!,
    $negom: [ComponentProjectsNegomInput],
    $vots: [ComponentProjectsVotsInput]
  ) {
    updateDecision(id: $id, data: { negom: $negom, vots: $vots }) {
      data { id }
    }
  }`,

  // Apply an agreed/matured version onto the Sale and stamp the holder outcome.
  'applySaleVersion': `mutation ApplySaleVersion(
    $id: ID!,
    $in: Float,
    $unit: Float,
    $date: DateTime,
    $startDate: DateTime,
    $finishDate: DateTime,
    $note: String,
    $holderStatus: ENUM_SALE_HOLDERSTATUS,
    $confirmedBy: ENUM_SALE_CONFIRMEDBY,
    $holderDecidedAt: DateTime
  ) {
    updateSale(id: $id, data: {
      in: $in,
      unit: $unit,
      date: $date,
      startDate: $startDate,
      finishDate: $finishDate,
      note: $note,
      holderStatus: $holderStatus,
      confirmedBy: $confirmedBy,
      holderDecidedAt: $holderDecidedAt
    }) {
      data { id attributes { holderStatus confirmedBy } }
    }
  }`,

  'saleCenterUserProducts': `query SaleCenterUserProducts($uid: ID!) {
    usersPermissionsUser(id: $uid) {
      data {
        id
        attributes {
          projects_1s {
            data {
              id
              attributes {
                projectName
                profilePic {
                  data {
                    attributes {
                      url
                      formats
                    }
                  }
                }
                user_1s {
                  data {
                    id
                    attributes {
                      username
                    }
                  }
                }
                matanotofs(filters: { or: [{ quant: { gt: 0 } }, { quant: { eq: -1 } }] }) {
                  data {
                    id
                    attributes {
                      name
                      price
                      quant
                      kindOf
                      startDate
                      finnishDate
                    }
                  }
                }
                decisions(filters: { kind: { eq: "saleClaim" }, archived: { eq: false } }) {
                  data {
                    id
                    attributes {
                      negom { id }
                      vots { what order users_permissions_user { data { id } } }
                      sale {
                        data {
                          id
                          attributes {
                            reporter { data { id } }
                            users_permissions_user { data { id attributes { username } } }
                            matanot { data { attributes { name } } }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }`,

  'meProfile': `query MeProfile($uid: ID!) {
    usersPermissionsUser(id: $uid) {
      data {
        id
        attributes {
          frd
          fblink
          twiterlink
          discordlink
          githublink
          bio
          preferCards
          lang
          machshirs { data { id attributes { jsoni } } }
          email
          noMail
          username
          hervachti
          profilManualAlready
          profilePic { data { attributes { url formats } } }
          projects_1s { data { id attributes { projectName } } }
          skills { data { id attributes { skillName localizations { data { attributes { skillName } } } } } }
          sps(filters: { archived: { ne: true } }) { data { id attributes { name panui } } }
          tafkidims { data { id attributes { roleDescription localizations { data { attributes { roleDescription } } } } } }
          vallues { data { id attributes { valueName localizations { data { attributes { valueName } } } } } }
          work_ways { data { id attributes { workWayName localizations { data { attributes { workWayName } } } } } }
        }
      }
    }
  }`,

  // ── Match-suggestion engine (src/lib/server/matching/) ────────────────────
  // 200-208: server-side matching queries/mutations, executed with the service
  // token by StrapiClient. 209 is the lev page's clean pull of precomputed
  // suggestions (idL is replaced with the cookie id by /api/send).

  '200matchOpenMissionContext': `query MatchOpenMissionContext($omId: ID!) {
    openMission(id: $omId) {
      data {
        id
        attributes {
          name
          archived
          isglobal
          location { lat lng radius location_mode }
          project { data { id attributes { projectName } } }
          skills { data { id } }
          tafkidims { data { id } }
          work_ways { data { id } }
          usersNotRelevant { data { id } }
          rishon { data { id } }
          match_suggestions(pagination: { limit: 1000 }) {
            data { id attributes { user { data { id } } } }
          }
        }
      }
    }
  }`,

  '201matchCandidateUsers': `query MatchCandidateUsers($skillIds: [ID], $roleIds: [ID], $limit: Int) {
    usersPermissionsUsers(
      filters: { or: [
        { skills: { id: { in: $skillIds } } },
        { tafkidims: { id: { in: $roleIds } } }
      ] }
      pagination: { limit: $limit }
    ) {
      data {
        id
        attributes {
          username
          email
          lang
          noMail
          location { lat lng radius location_mode }
          skills { data { id } }
          tafkidims { data { id } }
          work_ways { data { id } }
          declined { data { id } }
        }
      }
    }
  }`,

  '202matchUserContext': `query MatchUserContext($uid: ID!) {
    usersPermissionsUser(id: $uid) {
      data {
        id
        attributes {
          username
          email
          lang
          noMail
          location { lat lng radius location_mode }
          skills { data { id } }
          tafkidims { data { id } }
          work_ways { data { id } }
          declined { data { id } }
          askeds { data { id } }
          sps(filters: { archived: { ne: true } }) {
            data { id attributes { mashaabim { data { id } } } }
          }
          match_suggestions(pagination: { limit: 1000 }) {
            data {
              id
              attributes {
                kind
                status
                open_mission { data { id } }
                open_mashaabim { data { id } }
              }
            }
          }
        }
      }
    }
  }`,

  '203matchOpenMissionsForUser': `query MatchOpenMissionsForUser($skillIds: [ID], $roleIds: [ID], $limit: Int) {
    openMissions(
      filters: { and: [
        { archived: { eq: false } },
        { or: [
          { skills: { id: { in: $skillIds } } },
          { tafkidims: { id: { in: $roleIds } } }
        ] }
      ] }
      pagination: { limit: $limit }
    ) {
      data {
        id
        attributes {
          name
          location { lat lng radius location_mode }
          skills { data { id } }
          tafkidims { data { id } }
          work_ways { data { id } }
          project { data { id } }
        }
      }
    }
  }`,

  '204matchOpenMashaabimContext': `query MatchOpenMashaabimContext($omId: ID!) {
    openMashaabim(id: $omId) {
      data {
        id
        attributes {
          name
          archived
          location { lat lng radius location_mode }
          project { data { id attributes { projectName } } }
          mashaabim { data { id } }
          declinedsps { data { id } }
          match_suggestions(pagination: { limit: 1000 }) {
            data { id attributes { user { data { id } } } }
          }
        }
      }
    }
  }`,

  '205matchUsersByMashaabim': `query MatchUsersByMashaabim($mashId: ID!, $limit: Int) {
    usersPermissionsUsers(
      filters: { sps: { mashaabim: { id: { eq: $mashId } } } }
      pagination: { limit: $limit }
    ) {
      data {
        id
        attributes {
          username
          email
          lang
          noMail
          location { lat lng radius location_mode }
          sps(filters: { archived: { ne: true } }) {
            data { id attributes { mashaabim { data { id } } } }
          }
        }
      }
    }
  }`,

  '206matchOpenMashaabimsForUser': `query MatchOpenMashaabimsForUser($mashIds: [ID], $limit: Int) {
    openMashaabims(
      filters: { and: [
        { archived: { eq: false } },
        { mashaabim: { id: { in: $mashIds } } }
      ] }
      pagination: { limit: $limit }
    ) {
      data {
        id
        attributes {
          name
          location { lat lng radius location_mode }
          mashaabim { data { id } }
          project { data { id } }
          declinedsps { data { id } }
        }
      }
    }
  }`,

  '207createMatchSuggestion': `mutation CreateMatchSuggestion(
    $userId: ID!, $openMissionId: ID, $openMashaabimId: ID,
    $kind: ENUM_MATCHSUGGESTION_KIND!, $score: Int,
    $status: ENUM_MATCHSUGGESTION_STATUS, $source: ENUM_MATCHSUGGESTION_SOURCE,
    $matchedOn: JSON, $notifiedAt: DateTime
  ) {
    createMatchSuggestion(data: {
      user: $userId,
      open_mission: $openMissionId,
      open_mashaabim: $openMashaabimId,
      kind: $kind,
      score: $score,
      status: $status,
      source: $source,
      matchedOn: $matchedOn,
      notifiedAt: $notifiedAt
    }) {
      data { id }
    }
  }`,

  '208updateMatchSuggestion': `mutation UpdateMatchSuggestion($id: ID!, $status: ENUM_MATCHSUGGESTION_STATUS) {
    updateMatchSuggestion(id: $id, data: { status: $status }) {
      data { id }
    }
  }`,

  '209levMatchSuggestions': `query LevMatchSuggestions($idL: ID!) {
    matchSuggestions(
      filters: { and: [
        { user: { id: { eq: $idL } } },
        { status: { ne: "dismissed" } },
        { kind: { eq: "mission" } },
        { open_mission: { archived: { eq: false } } }
      ] }
      pagination: { limit: 200 }
      sort: "score:desc"
    ) {
      data {
        id
        attributes {
          score
          status
          kind
          matchedOn
          open_mission {
            data {
              id
              attributes {
                name
                descrip
                hearotMeyuchadot
                noofhours
                perhour
                dates
                sqadualed
                source
                project {
                  data {
                    id
                    attributes {
                      projectName
                      restime
                      timeToP
                      user_1s { data { id } }
                      profilePic { data { attributes { url formats } } }
                    }
                  }
                }
                acts { data { id attributes { shem des } } }
                tafkidims { data { id attributes { roleDescription localizations { data { attributes { roleDescription } } } } } }
                skills { data { id attributes { skillName localizations { data { attributes { skillName } } } } } }
                work_ways { data { id attributes { workWayName localizations { data { attributes { workWayName } } } } } }
                ratson {
                  data { id attributes { name logo { data { attributes { url formats } } } } }
                }
              }
            }
          }
        }
      }
    }
  }`,

  '210findMatchSuggestionsByMission': `query FindMatchSuggestionsByMission($uid: ID!, $omId: ID!) {
    matchSuggestions(filters: { and: [
      { user: { id: { eq: $uid } } },
      { open_mission: { id: { eq: $omId } } }
    ] }) {
      data { id }
    }
  }`,

  '211findMatchSuggestionsByMashaabim': `query FindMatchSuggestionsByMashaabim($uid: ID!, $omashId: ID!) {
    matchSuggestions(filters: { and: [
      { user: { id: { eq: $uid } } },
      { open_mashaabim: { id: { eq: $omashId } } }
    ] }) {
      data { id }
    }
  }`,

  '212levResourceMatchSuggestions': `query LevResourceMatchSuggestions($idL: ID!) {
    matchSuggestions(
      filters: { and: [
        { user: { id: { eq: $idL } } },
        { status: { ne: "dismissed" } },
        { kind: { eq: "resource" } },
        { open_mashaabim: { archived: { eq: false } } }
      ] }
      pagination: { limit: 200 }
      sort: "score:desc"
    ) {
      data {
        id
        attributes {
          score
          status
          kind
          matchedOn
          open_mashaabim {
            data {
              id
              attributes {
                name
                descrip
                spnot
                kindOf
                price
                easy
                hm
                linkto
                sqadualed
                sqadualedf
                recurring
                cycleSize
                mashaabim { data { id } }
                declinedsps { data { id } }
                project {
                  data {
                    id
                    attributes {
                      projectName
                      restime
                      user_1s { data { id } }
                      profilePic { data { attributes { url formats } } }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }`,

  ...qids_base,
  ...moachQids
};
