export const qids = {
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
  '2forumCrHaluka': `mutation  CreateForumHaluka($pid : ID, $halukId: ID , $da: DateTime, $participants: [ID])
   { createForum(
       data: {
        project:$pid,
        haluka:$halukId,
        publishedAt:$da,
        users_permissions_users:$participants
       }
        ){data{id}}
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
                                       $publishedAt: DateTime)
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
             mashaabims:$mashaabims
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
`,'14changeOnline': `mutation ChangeOnline($id: ID!, $online: Boolean) {
   UpdatePgishauser(id: $id, data: {online: $online}) {data{id attributes{ online}}}
}`,
"15createPgishauser": `mutation CreatePgishauser($id: ID!) {
  createPgishauser(data: {users_permissions_user: $id}) {data{id}}
}`,'16createPgisha': `mutation CreatePgisha($ids: [ID],$name: String, $desc: String,pendIds:[ID]) {
  createPgisha(data: {pgishausers: $ids,pgishauserspend:$pendIds, name: $name, desc: $desc}) {data{id}}
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
`, "18createNewMeeting": `mutation CreateNewMeeting( $outpot: String, $name: String,$publishedAt:DateTime) {
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
"31updateTask": `mutation UpdateTask($id: ID!,$myIshur: Boolean,$valiIshur: Boolean, $isAssigned: Boolean, $uid: [ID], $mesimabetahaliches: [ID]) {
     updateAct(id: $id,
      data: {
             isAssigned: $isAssigned,
             myIshur: $myIshur,
             valiIshur: $valiIshur,
              my:$uid,
              mesimabetahaliches: $mesimabetahaliches
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
'33CreateTimer':`
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
'37getUserTimers':  `query GetUserTimers($id: ID!) {
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
'38getProjectTimers':  `query GetProjectTimers($id: ID!) {
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
         attributes{name  howmanyhoursalready hoursassinged
         
}}}
          }
          }
       }        
      }
    }
  }
 }
`,
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
                    author{
                    data{
                      attributes{
                        username
                        email
                      }
                    }
                  }
                    authorEmail
                    votes
                    voters{
                    data{
                      attributes{
                        username
                        email
                      }
                    }
                  }
                    location
                    intensity
                    tags{
                    data{
                      attributes{
                        name
                      }
                    }
                  }
                    order
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
  '40CreateNegotiation': `
      mutation CreateNegotiation($data: NegotiationInput!) {
        createNegotiation(data: $data) {
          data {
            id
            attributes {
              topic
              description
            }
          }
        }
      }
    `,
  '41CreatePosition': `
      mutation CreatePosition($data: PositionInput!) {
        createPosition(data: $data) {
          data {
            id
            attributes {
              heading
              description
              author{
              data{
                attributes{
                  username
                  email
                }
              }
            }
              votes
              voters{
              data{
                attributes{
                  username
                  email
                }
              }
            }
              location
              order
            }
          }
        }
      }
    `,
  '42UpdatePosition': `
      mutation UpdatePosition($id: ID!, $data: PositionInput!) {
        updatePosition(id: $id, data: $data) {
          data {
            id
            attributes {
              votes
              voters{
              data{
                attributes{
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
    "43updateProfilePic":  `
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
          projectcreates {
            data {
              id
              attributes {
                projectName
                user_1s { data { id } }
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
  
  "66getProjectsCount": `query GetProjectsCount {
    projects {
      meta {
        pagination {
          total
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
  
  "68updateTosplit": `mutation UpdateTosplit($id: ID!, $halukas: [ID], $hervachti: [ComponentProjectsHervachtiInput], $sales: [ID]) {
    updateTosplit(
      id: $id,
      data: {
        halukas: $halukas,
        hervachti: $hervachti,
        sales: $sales
      }
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
  
  "72createMesimabetahalich": `mutation CreateMesimabetahalich(
    $projectId: ID!,
    $missId: ID!,
    $userId: ID!,
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
      start: $sqedualed
    }) {
      data {
        id
        attributes {
          project { data { id } }
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
  '81updateAskedsAndCreateAsk': `mutation UpdateAskedsAndCreateAsk(
      $userId: ID!,
      $askeds: [ID],
      $openMissionId: ID,
      $projectId: ID!,
      $publishedAt: DateTime,
      $vote: [ComponentProjectsVotsInput]
    ) {
      updateUsersPermissionsUser(
        id: $userId
        data: { askeds: $askeds }
      ) {
        data {
          attributes {
            askeds {
              data {
                id
              }
            }
          }
        }
      }
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
  '83levMainUserQuery': `query LevMainUserQuery($idL: ID!) {
  usersPermissionsUser(id: $idL) {
    data {
      id
      attributes {
        haskama
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
                    open_mashaabims(filters: { archived: { eq: false } }) {
                      data {
                        id
                        attributes {
                          declinedsps {
                            data {
                              id
                            }
                          }
                          price
                          hm
                          descrip
                          spnot
                          kindOf
                          users {
                            data {
                              id
                            }
                          }
                          sqadualedf
                          sqadualed
                          linkto
                          createdAt
                          hm
                          name
                          easy
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
                        }
                      }
                    }
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
              mission {
                data {
                  id
                }
              }
              project {
                data {
                  id
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
            attributes {
              open_missions(filters: { archived: { eq: false } }) {
                data {
                  id
                  attributes {
                    project {
                      data {
                        id
                      }
                    }
                    skills {
                      data {
                        id
                      }
                    }
                    tafkidims {
                      data {
                        id
                      }
                    }
                    work_ways {
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
            attributes {
              open_missions(filters: { archived: { eq: false } }) {
                data {
                  id
                  attributes {
                    project {
                      data {
                        id
                      }
                    }
                    skills {
                      data {
                        id
                      }
                    }
                    tafkidims {
                      data {
                        id
                      }
                    }
                    work_ways {
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
                    createdAt
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
                      users_permissions_user {
                        data {
                          id
                        }
                      }
                    }
                  }
                }
              }
              pmashes(filters: { archived: { eq: false } }) {
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
                        }
                      }
                    }
                    sp {
                      data {
                        id
                        attributes {
                          price
                          myp
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
                          negopendmissions {
                            data {
                              id
                              attributes {
                                name
                                hearotMeyuchadot
                                descrip
                                createdAt
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
              pendms(filters: { archived: { eq: false } }) {
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
                    negopendmissions {
                      data {
                        id
                        attributes {
                          name
                          hearotMeyuchadot
                          descrip
                          createdAt
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
      }
    }
  }
}
`,
};
