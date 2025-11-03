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
  pgishausers(filters: {users_permissions_user: {id: {eq: $id}}}) {data{id attributes{available uid pgishas{data{id 
  attributes{name publishedAt pgishausers {data{id attributes{available users_permissions_user{data{id attributes{username}}}} }}}}}}}}
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
          sheiruts(filters: { isApruved: { eq: true } }) { data { id attributes { name descrip equaliSplited oneTime isApruved } } }
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
          acts { data { attributes { shem } } }
          users { data { id } }
          project { data { id attributes { projectName user_1s { data { id } } restime timeToP profilePic { data { attributes { url } } } } } }
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
  }`
}; 
