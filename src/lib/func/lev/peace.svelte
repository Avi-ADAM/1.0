 <script context="module">
    import tr from '$lib/translations/tr.json'
   export function peace(miData, id,lang) {
    console.log("peace askeds")  /*{data{ id attributes{
            archived
            project{data{id}} 
            vots  {what  zman}
            timegrama {data{id attributes{date}}}
            createdAt
            chat{data{id attributes{why ide what zman users_permissions_user {data{id}}}}}
        }}} ")*/
    let mtaha = []
    let mtahan = miData.data.usersPermissionsUser.data.attributes.asks.data
    for (let i = 0; i < mtahan.length; i++) {
            console.log("peace",mtahan[i])
        if(mtahan[i].attributes.archived != true && mtahan[i].attributes.open_mission.data.id == id){
            console.log("peace",mtahan[i],"secc")
           /* mtaha[i] = {...mtahan[i].attributes};
            mtaha[i].id = mtahan[i].id
            mtaha[i].ani = "peaceMi" 
            mtaha[i].azmi = "requests"      
            mtaha[i].pl = 0 + i
            mtaha[i].messeges = []*/
            
            mtaha.push({
                 message: `${miData.data.usersPermissionsUser.data.attributes.username} ${tr?.ask.askedTo[lang]} ${mtahan[i].attributes.project.data.attributes.projectName}`,
                    what: true,
                    pic: mtahan[i].attributes.project.data.attributes.profilePic.data.attributes.url,
                    timestamp:new Date(mtahan[i].attributes.createdAt),
                    sentByMe:  false,
                    changed:  false,
            })
            mtaha = mtaha
            /*
        if (dictasked[t].users.length > 0) {
            for (let x = 0; x < dictasked[t].users.length; x++) {
                let src22 = getProjectData(dictasked[t].projectId,"upic",dictasked[t].users[x].users_permissions_user.data.id)
                dictasked[t].messege.push({
                    message: `${getProjectData(dictasked[t].projectId,"un",dictasked[t].users[x].users_permissions_user.data.id)}  
                  ${pmashes[t].users[x].what == true ? tr?.vots.inFavor[$lang] : tr?.vots.against[$lang]} `,
                    what: dictasked[t].users[x].what,
                    pic: src22,
                    timestamp:new Date(dictasked[t].users[x].zman),
                    sentByMe: dictasked[t].users[x].users_permissions_user.data.id === myid ? true : false,
                    changed:  false,
                })
            }
        }
        if (dictasked[t].chat.length > 0) {
            for (let x = 0; x < dictasked[t].chat.length; x++) {
                let src22 = dictasked[t].pid.includes(dictasked[t].chat[x].users_permissions_user.data.id) ?
                             getProjectData(dictasked[t].projectId,"upic",dictasked[t].users[x].users_permissions_user.data.id) :
                             dictasked[t].src
                dictasked[t].messege.push({
                    message: why,
                    what: true,
                    pic: src22,
                    timestamp:new Date(dictasked[t].chat[x].zman),
                    sentByMe: dictasked[t].chat[x].users_permissions_user.data.id === myid ? true : false,
                    changed:  false,
                })
            }
        } 
   dictasked[t].messege = dictasked[t].messege.sort(function(a,b){
  return b.timestamp - a.timestamp;
}).reverse();
  let old = $meAskMisMes
    old[mtahan[i].attributes.open_mission.data.id] =  mtaha[mtahan[i].attributes.open_mission.data.id]
    meAskMisMes.set(old)
    localStorage.setItem("meAskMisMes", JSON.stringify($meAskMisMes));
    console.log("peace",mtaha,"sec")

*/
    
            }
        }
    return mtaha
   }
   </script>