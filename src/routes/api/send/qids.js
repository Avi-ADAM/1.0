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
              machshirs{data{id attributes{jsoni}}}
            }
          }
        }
       }
    }
  }
}
`,
  '4crtask': `mutation CreateAct($pendm:ID ,$open_mission:ID,$dateS:DateTime, $dateF:DateTime,$myIshur:Boolean ,$shem: String,$des:String,$link:String, $pid : ID, $askId: ID, $assignedId:ID, $mbId: ID , $publishedAt: DateTime)
                        { createAct(
      data: {project:$pid,
             des: $des,
             my: $assignedId,
             shem: $shem,
             vali: $askId,
             mesimabetahalich: $mbId,
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
}`
};
