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
  '4crtask': `mutation CreateAct($pendm:ID ,$open_mission:ID,$dateS:DateTime, $dateF:DateTime,$myIshur:bolean ,$shem: String,$des:String,$link:String, $pid : ID, $askId: ID, $assignedId:ID, $mbId: ID , $da: DateTime, $publishedAt: DateTime)
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
`
};
