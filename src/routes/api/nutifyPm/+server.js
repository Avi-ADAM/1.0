// pusherer for push devices, api/nuti for emails, TODO: telegram
// a get all other project users/ chat members email & devises 

import SimpleNuti from '$lib/components/mail/simpleNuti.svelte';
import {sendBolkMail} from '$lib/func/bolkmail/bolkMail.svelte';
import { pusherer } from '$lib/func/pusherer.svelte'
import { sendBolkTelegram } from '$lib/func/telegram/sendBolkTelegram.svelte';
import { sendToSer } from '$lib/send/sendToSer.svelte';
import { render } from 'svelty-email';

//b sendMessages
export async function POST({request, cookies, fetch}){
  const da = await request.json();
  const pid = da.pid || 0;
  const title = da.title || { he: '', en: '' };
  const body = da.body || { he: '', en: '' };
  const lang = cookies.get('lang');
  const idL = cookies.get('id');
  console.log(pid,"nutifyPm 15")
  let datau = { data: { arg:{pid}, queId: '3projectJSONQue' } };
  let jsonim = []
  await fetch('/api/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(datau)
  })
    .then((res) => (res = res.json()))
    .then((data) => {
      console.log('Success:', data);
      jsonim = data;
    })
    .catch((error) => {
      console.error('Error:', error);
      throw error;
    });
 
  console.log(jsonim.data.project.data.attributes.user_1s.data);
  // Assuming 'data' is the result of your GraphQL query
 /* const transformedData = jsonim.data.project.data.attributes.user_1s.data.map(
    (user) => {
       console.log(user.attributes.machshirs.data)
        user.attributes.machshirs.data.map(
       (machshir)=>{
      return {
        jsoni: machshir.attributes.jsoni,
        users_permission_user: {
          data: {
            id: user.id,
            attributes: {
              lang: user.attributes.lang
            }
          }
        }
      };
    }
  )
    }
  );*/
  const transformedData =
    jsonim.data.project.data.attributes.user_1s.data.flatMap((user) => {
      // Filter out machshirs that don't have a value
      const validMachshirs = user.attributes.machshirs.data.filter(
        (machshir) =>
          machshir && machshir.attributes && machshir.attributes.jsoni
      );

      // Map over the valid machshirs to create the new objects
      return validMachshirs.map((machshir) => {
        return {
          jsoni: machshir.attributes.jsoni,
          users_permission_user: {
            data: {
              id: user.id,
              attributes: {
                lang: user.attributes.lang
              }
            }
          }
        };
      });
    });
      //validate that user has telegramId
     const valid = jsonim.data.project.data.attributes.user_1s.data.filter(
       (user) => user.attributes.telegramId
     );
     const transformedDataTel = valid;
    
    const pic =
      'https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png';
    //  jsonim.data.project.data.attributes.profilePic.data?.attributes?.formats
    //    ?.thumbnails.url ??
     // jsonim.data.project.data.attributes.profilePic.data?.attributes?.url
        //jsonim myid messege mainlang pic
     
        pusherer(transformedData, idL,pic,title,body,lang,fetch);
        console.log('after', transformedDataTel);
        sendBolkTelegram(transformedDataTel, idL,title,body,lang,fetch);
        
  const transformedDataMail =
  jsonim.data.project.data.attributes.user_1s.data.flatMap((user) => {
    //filter by if email not null or undefined
    return{
      email: user.attributes.email,
      emailHtml:  render({
        template: SimpleNuti,
        props: {
          head: title,
         body: body,
         username: user.attributes.username,
         previewText: title,
         lang :user.attributes.lang == "he" || "en" ? user.attributes.lang : lang
        }
      }),
      users_permission_user: {
        data: {
          id: user.id,
          attributes: {
            userName: user.attributes.username,
            lang: user.attributes.lang
          }
        }
      }
    }
  })
  sendBolkMail(transformedDataMail,idL,title,body,lang,fetch)
    return new Response    
}