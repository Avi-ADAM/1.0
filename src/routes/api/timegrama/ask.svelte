<script context="module">
    import { SendTo } from '$lib/send/sendTo.svelte';
const VITE_ADMINMONTHER = import.meta.env.VITE_ADMINMONTHER;
export async function Ask(id){
    let qu = `{
  ask (id:${id}) {data{ id attributes{
    vots{what users_permissions_user {data {id}}} archived project{data{id attributes{user_1s{data{id}}}}} users_permissions_user{data{id}}
}}} 
 }`;
    try {
      let res = await SendTo(qu, VITE_ADMINMONTHER).then((res) => (res = res));
      console.log(res);
      if (res.data != null) {
        console.log(res.data, 'pip',res.data.ask.data.attributes.vots);
        if(res.data.ask.data.attributes.archived != true)
//check if one of pm appruve and if the requst user is already pm
        if(res.data.ask.data.attributes.vots.length > 0 || res.data.ask.data.attributes.project.data.attributes.user_1s.data.map(c => c.id).includes(res.data.ask.data.attributes.users_permissions_user.data.id)){
           if(!res.data.ask.data.attributes.vots.map(c => c.what).includes(false))
            if(res.data.ask.data.attributes.project.data.attributes.user_1s.data.map(c => c.id).includes(res.data.ask.data.attributes.users_permissions_user.data.id) && res.data.ask.data.attributes.vots.map(c => c.users_permissions_user.data.id).includes(res.data.ask.data.attributes.users_permissions_user.data.id)){
            console.log("is project user  and no no and he voted in favor")
            //TODO: cr mtaha nutify arcive timegrama ask and openm , otherAsks
            let qua = `{ask (id:${id}) {data{ id attributes{
    open_mission{data{id attributes{hearotMeyuchadot tafkidims{data{id}} name privatlinks publicklinks descrip noofhours perhour iskvua mission{data{id}}}}} 
        }}} 
         }`
             try {
         let res2 = await SendTo(qua, VITE_ADMINMONTHER).then((res2) => (res2 = res2));
      console.log(res2);
      if (res2.data != null) {
                let qub = `mutation 
                        { createMesimabetahalich(
      data: {project: "${res.data.ask.data.attributes.project.data.id}",
             mission:  "${res2.data.ask.data.attributes.open_mission.data.attributes.mission.data.id}",
             hearotMeyuchadot: "${res2.data.ask.data.attributes.open_mission.data.attributes.hearotMeyuchadot}",
             name: "${res2.data.ask.data.attributes.open_mission.data.attributes.name}",
             descrip: "${res2.data.ask.data.attributes.open_mission.data.attributes.descrip}",
             hoursassinged: ${res2.data.ask.data.attributes.open_mission.data.attributes.noofhours},
             perhour: ${res2.data.ask.data.attributes.open_mission.data.attributes.perhour},  
             iskvua:${res2.data.ask.data.attributes.open_mission.data.attributes.iskvua},   
             privatlinks: "${res2.data.ask.data.attributes.open_mission.data.attributes.privatlinks}",
             publicklinks: "${res2.data.ask.data.attributes.open_mission.data.attributes.publicklinks}", 
             users_permissions_user: "${res.data.ask.data.attributes.users_permissions_user.data.id}",
             tafkidims: [${res2.data.ask.data.attributes.open_mission.data.attributes.tafkidims.map(c => c.data.id)}],
             publishedAt: "${d.toISOString()}",
            ${date}
                  }
  ) {data{attributes{project{data{id }}}}}

updateOpenMission(
  id: "${res2.data.ask.data.attributes.open_mission.data.id}"
  data: {archived: true}
) {data{id attributes{ archived asks{data{id}}}}}

 updateAsk(
            id: "${res2.data.ask.data.id}"
                                data: { archived: true}
                        ){data{id}}
}
`
//TODO: archive all other askeds (you getting it back under updateOpenMission)
}
 } catch (e) {
      console.error(e);
    }
        } else{
            //TODO: check vots if no no cr mtaha add to p and nutify arcive timegrama ask and openm , otherAsks
        }
        }
      }
    } catch (e) {
      console.error(e);
    }
}
</script>