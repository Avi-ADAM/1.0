<script context="module">
    import { SendTo } from '$lib/send/sendTo.svelte';
const VITE_ADMINMONTHER = import.meta.env.VITE_ADMINMONTHER;
export async function Ask(id,taid){
  let d = new Date()
    let qu = `{
  ask (id:${id}) {data{ id attributes{
    vots{what users_permissions_user {data {id}}} archived project{data{id attributes{ user_1s{data{id}}}}} users_permissions_user{data{id attributes{username}}}
}}} 
 }`;
    try {
      let res = await SendTo(qu, VITE_ADMINMONTHER).then((res) => (res = res));
      console.log(res);
      if (res.data != null) {
        console.log(res.data, 'pip',res.data.ask.data.attributes.vots);
        if(res.data.ask.data.attributes.archived != true)
//check if one of pm appruve and if the requst user is already pm
        if(res.data.ask.data.attributes.vots.length > 0 || res.data.ask.data.attributes.project.data.attributes.user_1s.data.map(c => c.id).includes(res.data.ask.data.attributes.users_permissions_user.data.id) && res.data.ask.data.attributes.vots.map(c => c.users_permissions_user.data.id).includes(res.data.ask.data.attributes.users_permissions_user.data.id)){
           if(!res.data.ask.data.attributes.vots.map(c => c.what).includes(false))
            console.log("no no and he is project user he voted in favor")
            //TODO: cr mtaha nutify arcive timegrama ask and openm , otherAsks, monter
           
            let qua = `{ask (id:${id}) {data{ id attributes{
    open_mission{data{id attributes{hearotMeyuchadot
       tafkidims{data{id}} name privatlinks sqadualed dates howMeny publicklinks descrip noofhours perhour iskvua mission{data{id}}}}} 
        }}} 
         }`
             try {
         let res2 = await SendTo(qua, VITE_ADMINMONTHER).then((res2) => (res2 = res2));
      console.log(res2,"ask res2");
      if (res2.data != null) {
        console.log(id,res2.data.ask.data.attributes.open_mission.data.attributes.sqadualed)
               console.log([...res.data.ask.data.attributes.project.data.attributes.user_1s.data.map(c => c.id), res.data.ask.data.attributes.users_permissions_user.data.id])

        let welcome = ``
        let adduser = ``      
        if(!res.data.ask.data.attributes.project.data.attributes.user_1s.data.map(c => c.id).includes(res.data.ask.data.attributes.users_permissions_user.data.id)){
          //TODO: test it! 
          welcome = `createWelcomTop(
                    data: {users_permissions_user: "${res.data.ask.data.attributes.users_permissions_user.data.id}",
                          project: "${res.data.ask.data.attributes.project.data.id}"
                          publishedAt: "${d.toISOString()}",
                        }
                ) {data{id}}`;
                adduser = `updateProject(
                  id: "${res.data.ask.data.attributes.project.data.id}"
                 data: {user_1s: [${[...res.data.ask.data.attributes.project.data.attributes.user_1s.data.map(c => c.id), res.data.ask.data.attributes.users_permissions_user.data.id]}]}
                  ){data{attributes {user_1s{data {id attributes{ email lang}}}}}}`;
                        
              }
        let qub = `mutation 
                        { 
                          createMesimabetahalich(
      data: {project: "${res.data.ask.data.attributes.project.data.id}",
             mission:  "${res2.data.ask.data.attributes.open_mission.data.attributes.mission.data.id}",
             hearotMeyuchadot: """${res2.data.ask.data.attributes.open_mission.data.attributes.hearotMeyuchadot}""",
             name: """${res2.data.ask.data.attributes.open_mission.data.attributes.name}""",
             descrip: """${res2.data.ask.data.attributes.open_mission.data.attributes.descrip}""",
             hoursassinged: ${res2.data.ask.data.attributes.open_mission.data.attributes.noofhours},
             perhour: ${res2.data.ask.data.attributes.open_mission.data.attributes.perhour},  
             iskvua:${res2.data.ask.data.attributes.open_mission.data.attributes.iskvua},   
             privatlinks: """${res2.data.ask.data.attributes.open_mission.data.attributes.privatlinks}""",
             publicklinks: """${res2.data.ask.data.attributes.open_mission.data.attributes.publicklinks}""", 
             users_permissions_user: "${res.data.ask.data.attributes.users_permissions_user.data.id}",
             tafkidims: [${res2.data.ask.data.attributes.open_mission.data.attributes.tafkidims.data.map(c => c.id)}],
             publishedAt: "${d.toISOString()}",
             ${res2.data.ask.data.attributes.open_mission.data.attributes.sqadualed != null ? `start: "${res2.data.ask.data.attributes.open_mission.data.attributes.sqadualed}"` : ""}
             ${res2.data.ask.data.attributes.open_mission.data.attributes.dates != null ? `admaticedai: "${res2.data.ask.data.attributes.open_mission.data.attributes.dates}"` : ""}
                  }
  ) {data{id attributes{project{data{attributes{projectName profilePic{data{attributes{url}}}}}}}}}
                  ${welcome}
                  ${adduser}
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
   try {
      let res3 = await SendTo(qub, VITE_ADMINMONTHER).then((res3) => (res3 = res3));
      console.log(res3,"ask res3");
      if (res3.data != null) {
//TODO: archive all other askeds (you getting it back under updateOpenMission)
//TODO: timegrama if finish date
    let chiluzh = res3.data.createMesimabetahalich.data.id
    let monti = ``
        if(res2.data.ask.data.attributes.open_mission.data.attributes.iskvua == true){
          monti = `mutation{
            createMonter(
              data:{
                mesimabetahalich: "${chiluzh}",
                ani: "mesimabetahalich"
                ${res2.data.ask.data.attributes.open_mission.data.attributes.sqedualed != undefined && res2.data.ask.data.attributes.open_mission.data.attributes.sqedualed != null ? `start: "${res2.data.ask.data.attributes.open_mission.data.attributes.sqedualed > d ? res2.data.ask.data.attributes.open_mission.data.attributes.sqedualed : d.toISOString()}"` : `start: "${d.toISOString()}"`}
                ${res2.data.ask.data.attributes.open_mission.data.attributes.dates != null && res2.data.ask.data.attributes.open_mission.data.attributes.dates != undefined ? `finish: "${res2.data.ask.data.attributes.open_mission.data.attributes.dates}"` : ""}
              }
            ){data{id}}
            }
          `
           try {
      let res8 = await SendTo(monti, VITE_ADMINMONTHER).then((res8) => (res8 = res8));
      console.log(res8,"ask res8 ")      
      if (res8.data != null) {
              console.log(res8.data,"ask res4 ")      
               }
 } catch (e) {
      console.error(e);
    }
        }
        console.log(monti)
           if (!res.data.ask.data.attributes.project.data.attributes.user_1s.data.map(c => c.id).includes(res.data.ask.data.attributes.users_permissions_user.data.id)){
              let emailt;
              let ema = res3.data.updateProject.data.attributes.user_1s.data
              let la; 
              for (let i = 0; i <ema.length; i++){
                if (ema[i].id == res.data.ask.data.attributes.users_permissions_user.data.id){
                  emailt = ema[i].attributes.email
                  la = ema[i].attributes.lang
                }
              }
              let langi = "he"
              if (la == "he" || la == "en"){
                langi = la
              }
                            console.log(langi)
            let data = {user: res.data.ask.data.attributes.users_permissions_user.data.attributes.username,
                       projectName :res3.data.createMesimabetahalich.data.attributes.project.data.attributes.projectName, 
                       projectSrc:  res3.data.createMesimabetahalich.data.attributes.project.data.attributes.profilePic.data.attributes.url, 
                       missionName: res2.data.ask.data.attributes.open_mission.data.attributes.name,
                        email: emailt, 
                        lang: langi , 
                        kind: "exeptedMission"}//username email projectname projectsrc lang openmissionName
            fetch('/api/sma', {
            method: 'POST',  
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          })
            .then((response) => response)
            .then((data) => {
              console.log('Success:', data);            
            })
            .catch((error) => {
              console.error('Error:', error);
            });
          }

           const otherasks = res3.data.updateOpenMission.data.attributes.asks.data
            console.log(otherasks);
            if (otherasks.length> 1){
            let nextquery = ``
            for (let i = 0; i < otherasks.length; i++){
              //TODO: otherasks timegrama
                nextquery =  `mutation {
                updateAsk(
                       id: "${otherasks[i].id}" 
                                data: { archived: true
                            }
                        ){data{id}}
                          }`
        try {
      let res6 = await SendTo(nextquery, VITE_ADMINMONTHER).then((res6) => (res6 = res6));
      console.log(res6, "ask res 6");
      if (res6.data != null) {
        console.log(res6.data,"ask res6 data")

      }
    }catch (e) {
      console.error(e);
    }
      }
    }
    let que4 = `mutation { 
             updateTimegrama(
     id: ${taid}
             data:{
              done: true
             }){
              data{id}
             }
            }
              `
               try {
      let res4 = await SendTo(que4, VITE_ADMINMONTHER).then((res4) => (res4 = res4));
      console.log(res4,"ask res4 ")      
      if (res4.data != null) {
              console.log(res4.data,"ask res4 ")      

              return "sucsses" + id
               }
 } catch (e) {
      console.error(e);
    }
  }
} catch (e) {
      console.error(e);
    }
      }
 } catch (e) {
      console.error(e);
    }
        
            //TODO: SEND EMAIL! check vots if no no cr mtaha add to p and nutify arcive timegrama ask and openm , otherAsks
        }
      }
    } catch (e) {
      console.error(e);
    }
}
</script>