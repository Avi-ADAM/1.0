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
                attributes{start totalHours timers{start stop} acts{data{id}} isActive saved}}} project{data{id attributes{projectName profilePic{data{attributes{formats url}}}}}} }}}
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
"32createTimeGrama": `mutation CreateTimegrama($date: DateTime, $finiapruval: ID, $whatami: String, $ask: ID) {
  createTimegrama(data: {date: $date, whatami: $whatami, ask: $ask, finiapruval: $finiapruval}) {
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
}
