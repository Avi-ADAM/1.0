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
  const uid = da.uid || 0;
  const title = da.title || { he: '', en: '' };
  const body = da.body || { he: '', en: '' };
  const lang = cookies.get('lang');
  const idL = cookies.get('id');
  console.log(uid,"nutifyUser 15")
  let datau = { data: { arg:{uid}, queId: '24userJSONQue' } };
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
 
  console.log(jsonim.data);

  const transformedData = jsonim.data.usersPermissionsUser.data.attributes.machshirs.data.filter(
        (machshir) =>
          machshir && machshir.attributes && machshir.attributes.jsoni
      );

      // Map over the valid machshirs to create the new objects
      const transformedDataMaCH = transformedData.map((machshir) => {
        return {
          jsoni: machshir.attributes.jsoni,
          users_permission_user: {
            data: {
              id: uid,
              attributes: {
                lang: jsonim.data.usersPermissionsUser.data.attributes.lang
              }
            }
          }
        };
      });
    ;
      //validate that user has telegramId
     const transformedDataTel = jsonim.data.usersPermissionsUser.data.attributes?.telegramId || null;
    
    const pic =
      'https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png';
  
     console.log('before', transformedDataMaCH, transformedDataTel);
      pusherer(transformedDataMaCH, idL,pic,title,body,lang,fetch);
        console.log('after', transformedDataTel);
        if(transformedDataTel && transformedDataTel !== null && transformedDataTel !== undefined){
        sendBolkTelegram([{id:uid,attributes:{telegramId:transformedDataTel,lang:jsonim.data.usersPermissionsUser.data.attributes?.lang}}], idL,title,body,jsonim.data.usersPermissionsUser.data.attributes?.lang == "he"	 || "en" ? jsonim.data.usersPermissionsUser.data.attributes?.lang : lang,fetch);
            }
        //link to mail, to push, callback button to terlegram
        const user = jsonim.data.usersPermissionsUser.data
  const transformedDataMail = [{
      email: user.attributes.email,
      emailHtml:  render({
        template: SimpleNuti,
        props: {
          head: title,
         body: body,
         username: user.attributes.username,
         previewText: title,
         lang :user.attributes.lang == "he" || user.attributes.lang == "en" ? user.attributes.lang : lang
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
    }]
  
  sendBolkMail(transformedDataMail,idL,title,body,lang,fetch)
    return new Response    
}