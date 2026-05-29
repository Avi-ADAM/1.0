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
                                       $status_ratson: Enum_Ratson_Status_Ratson,
                                       $access_mode: Enum_Ratson_Access_Mode,
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
                    aiMeta
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
              aiMeta
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
                      pendm { data { id attributes { name descrip noofhours perhour mission { data { id } } } } }
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
          name descrip spnot kindOf hm price easy linkto sqadualed sqadualedf
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
          vots {
            id
            what
            why
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
  '159getDecisionForVote': `query GetDecisionForVote($id: ID!) {
    decision(id: $id) {
      data {
        id
        attributes {
          kind
          archived
          newpic { data { id } }
          timegrama { data { id } }
          newname
          newpubdes
          newprides
          newFlink
          newWlink
          timtoM
          valluesadd { data { id } }
          valluesles { data { id } }
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
  '125createAskm': `mutation CreateAskm($publishedAt: DateTime!, $openMashaabimId: ID!, $projectId: ID!, $spId: ID!, $userId: ID!) {
    createAskm(data: {
      publishedAt: $publishedAt,
      open_mashaabim: $openMashaabimId,
      project: $projectId,
      sp: $spId,
      users_permissions_user: $userId
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
  '130updateOpenMissionDeclined': `mutation UpdateOpenMissionDeclined($id: ID!, $declinedIds: [ID]) {
    updateOpenMission(id: $id, data: { declined: $declinedIds }) {
      data { id }
    }
  }`,
  '131archiveOpenMashaabim': `mutation ArchiveOpenMashaabim($id: ID!) {
    updateOpenMashaabim(id: $id, data: { archived: true }) {
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
    $status: ENUM_SHEIRUTFULFILLMENT_STATUS,
    $publishedAt: DateTime
  ) {
    createSheirutFulfillment(data: {
      sheirut: $sheirut,
      matanot: $matanot,
      quantity: $quantity,
      process: $process,
      agreedPrice: $agreedPrice,
      status: $status,
      publishedAt: $publishedAt
    }) {
      data {
        id
        attributes { quantity agreedPrice status }
      }
    }
  }`,

  '132updateSheirutFulfillment': `mutation UpdateSheirutFulfillment(
    $id: ID!,
    $agreedPrice: Float,
    $status: ENUM_SHEIRUTFULFILLMENT_STATUS,
    $createdMissions: [ID],
    $createdMaaps: [ID],
    $createdPmashes: [ID]
  ) {
    updateSheirutFulfillment(id: $id, data: {
      agreedPrice: $agreedPrice,
      status: $status,
      createdMissions: $createdMissions,
      createdMaaps: $createdMaaps,
      createdPmashes: $createdPmashes
    }) {
      data { id attributes { agreedPrice status } }
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
    $status_ratson: Enum_Ratson_Status_Ratson,
    $access_mode: Enum_Ratson_Access_Mode,
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
    $kind: Enum_Ratsonproposal_Kind,
    $status_proposal: Enum_Ratsonproposal_Status_Proposal,
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
        publishedAt: $publishedAt
      }
    ) {
      data { id attributes { status_proposal kind match_score } }
    }
  }`,

  '102updateRatsonProposal': `mutation UpdateRatsonProposal(
    $id: ID!,
    $kind: Enum_Ratsonproposal_Kind,
    $status_proposal: Enum_Ratsonproposal_Status_Proposal,
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
    $mode: Enum_Ratsonmatchjob_Mode,
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
        status_of_voting: { eq: active }
      }
      pagination: { limit: $limit }
    ) {
      data {
        id
        attributes {
          name
          sub_category
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
        status_ratson: { in: [open, matching, negotiating] }
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
  }`
};

export const moachQids = {
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
              }
            }
          }
          sales {
            data {
              id
              attributes {
                in date pending splited note tosplits { data { id } }
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
              # Mission applications – members vote via pendms.users (ordered)
              pendms(filters: { archived: { eq: false } }) {
                data {
                  id
                  attributes {
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

  ...qids_base,
  ...moachQids
};
