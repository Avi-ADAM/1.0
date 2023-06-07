<script context="module">
    import { SendTo } from '$lib/send/sendTo.svelte';
const VITE_ADMINMONTHER = import.meta.env.VITE_ADMINMONTHER;
export async function Ask(id){
    let qu = `{
  ask (id:${id}) {data{ id attributes{
    vots{what} archived project{data{id attributes{user_1s{data{id}}}}} users_permissions_user{data{id}}
}}} 
 }`;
    try {
      let res = await SendTo(qu, VITE_ADMINMONTHER).then((res) => (res = res));
      console.log(res);
      if (res.data != null) {
        console.log(res.data, 'pip',res.data.ask.data.attributes.vots);

//check if one of pm appruve and if the requst user is already pm
        if(res.data.ask.data.attributes.vots.length > 0 || res.data.ask.data.attributes.project.data.attributes.user_1s.data.map(c => c.id).includes(res.data.ask.data.attributes.users_permissions_user.data.id)){
            if(res.data.ask.data.attributes.project.data.attributes.user_1s.data.map(c => c.id).includes(res.data.ask.data.attributes.users_permissions_user.data.id)){
            console.log("is project user")
            //TODO: cr mtaha nutify arcive timegrama ask and openm , otherAsks
            let qua = `
            
            `
                let qub = `mutation 
                        { createMesimabetahalich(
      data: {project: "${projectId}",
             mission:  "${missId}",
             hearotMeyuchadot: "${hearotMeyuchadot}",
             name: "${openmissionName}",
             descrip: "${missionDetails}",
             hoursassinged: ${nhours},
             perhour: ${valph},  
              iskvua:${iskvua},   
             privatlinks: "${privatlinks}",
             publicklinks: "${publicklinks}", 
             users_permissions_user: "${userId}",
             tafkidims: [${tafkidimsa}],
                     publishedAt: "${d.toISOString()}",
            ${date}
                  }
  ) {data{attributes{project{data{id }}}}}

updateOpenMission(
  id: "${openMid}"
  data: {archived: true}
) {data{id attributes{ archived asks{data{id}}}}}

 updateAsk(
            id: "${askId}"
                                data: { archived: true,
                                    vots: [${userss}, 
                                       {
                                        what: true
                                        users_permissions_user: "${idL}"
                                      }
                                    ]}
                        ){data{id}}
}
`
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