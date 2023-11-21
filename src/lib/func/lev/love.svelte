<script context="module">
    import tr from '$lib/translations/tr.json'
   export function peace(miData, id,lang,myid) {
        console.log("peace askeds")  /*{data{ id attributes{
            archived
            project{data{id}} 
            vots  {what  zman}
            timegrama {data{id attributes{date}}}
            createdAt
            chat{id why ide what zman users_permissions_user {data{id}}}}}
        }}} ")*/
    let mtaha = []
    let mtahan = miData.data.usersPermissionsUser.data.attributes.askms.data
    for (let i = 0; i < mtahan.length; i++) {
        if(mtahan[i].attributes.archived != true && mtahan[i].attributes.open_mashaabim.data.id == id){
            console.log("peace",mtahan[i])
            mtaha.push({
                 message: `${miData.data.usersPermissionsUser.data.attributes.username} 
                            ${tr?.ask.askedTo[lang]} 
                            ${mtahan[i].attributes.open_mission.data.attributes.name}`,
                    what: true,
                    pic: mtahan[i].attributes.project.data.attributes.profilePic.data.attributes.url,
                    timestamp:new Date(mtahan[i].attributes.createdAt),
                    sentByMe:  false,
                    changed:  false,
            })
            mtaha = mtaha

        if (mtahan[i].attributes.vots.length > 0) {
            for (let x = 0; x < mtahan[i].attributes.vots.length; x++) {
              //  let src22 = getProjectData(dictasked[t]. ,"upic",dictasked[t].users[x].users_permissions_user.data.id)
                mtaha.push({
                    message: `${tr?.ask.onpm[lang]}  
                  ${mtahan[i].attributes.vots[x].what == true ? " " + tr?.vots.inFavor[lang] : " "+ tr?.vots.against[lang]} `,
                    what: mtahan[i].attributes.vots[x].what ?? true,
                    pic: "https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png",
                    timestamp:new Date(mtahan[i].attributes.vots[x].zman ?? Date.now()) ,
                    sentByMe: mtahan[i].attributes.vots[x].users_permissions_user.data.id === myid ? true : false,
                    changed:  false,
                })
            }
        }
              if (mtahan[i].attributes.chat.length > 0) {
            for (let x = 0; x < mtahan[i].attributes.chat.length; x++) {
                let src22 = mtahan[i].attributes.chat[x].users_permissions_user.data.attributes.profilePic?.formats?.thumbnail?.url ? 
                            mtahan[i].attributes.chat[x].users_permissions_user.data.attributes.profilePic.formats.thumbnail.url :
                            mtahan[i].attributes.chat[x].users_permissions_user.data.attributes.profilePic?.url ?
                            mtahan[i].attributes.chat[x].users_permissions_user.data.attributes.profilePic?.url :
                            "https://res.cloudinary.com/love1/image/upload/v1653053361/image_s1syn2.png";
                mtaha.push({
                    message: mtahan[i].attributes.chat[x].why,
                    what:  mtahan[i].attributes.chat[x].what ?? true,
                    pic: src22,
                    timestamp:new Date( mtahan[i].attributes.chat[x].zman),
                    sentByMe:  mtahan[i].attributes.chat[x].users_permissions_user.data.id === myid ? true : false,
                    changed:  false,
                })
            }
        } 
                console.log("peace arrived")

   mtaha = mtaha.sort(function(a,b){
  return b.timestamp - a.timestamp;
}).reverse();
  /*let old = $meAskMisMes
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