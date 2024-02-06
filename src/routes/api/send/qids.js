export const qids = {
  '1chatsend': `mutation  CreateMessage($fid : ID, $idL: ID , $da: DateTime, $mes: String)
    {createMessage(
       data: {
        forum: $fid,
        users_permissions_user: $idL,
        when: $da,
        publishedAt: $da,
        content: $mes
        }
        ){data{id
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
      }`
};
