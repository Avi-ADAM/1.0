// pusherer for push devices, api/nuti for emails, TODO: telegram
// a get all other project users/ chat members email & devises 

import SimpleNuti from '$lib/components/mail/simpleNuti.svelte';
import {sendBolkMail} from '$lib/func/bolkmail/bolkMail.svelte';
import { pusherer } from '$lib/func/pusherer.svelte'
import { sendBolkTelegram } from '$lib/func/telegram/sendBolkTelegram.svelte';
import { sendToSer } from '$lib/send/sendToSer.js';
import { render } from 'svelty-email';

//b sendMessages
export async function POST({request, cookies, fetch}){
  const da = await request.json();
  const pid = da.pid || 0;
  const title = da.title || { he: '', en: '' };
  const body = da.body || { he: '', en: '' };
  const userIds = da.userIds || null; // רשימת IDs ספציפית (אופציונלי)
  const lang = cookies.get('lang') || "he";
  const idL = cookies.get('id');
  console.log(pid,idL,"nutifyPm 19", userIds ? "specific users" : "all project users")
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
  
  // אם יש userIds, נסנן רק את המשתמשים האלה
  let projectUsers = jsonim.data.project.data.attributes.user_1s.data;
  if (userIds && Array.isArray(userIds) && userIds.length > 0) {
    projectUsers = projectUsers.filter(user => 
      userIds.includes(String(user.id)) || userIds.includes(Number(user.id))
    );
    console.log(`Filtered to ${projectUsers.length} specific users:`, userIds);
  }
  // Assuming 'data' is the result of your GraphQL query
 /* const transformedData = projectUsers.map(
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
    projectUsers.flatMap((user) => {
      // Filter out machshirs that don't have a value
      const validMachshirs = user.attributes.machshirs.data.filter(
        (machshir) =>
          machshir && machshir.attributes && machshir.attributes.jsoni
      );

      // Map over the valid machshirs to create the new objects
      return validMachshirs.map((machshir) => {
        return {
          jsoni: machshir.attributes.jsoni,
          machshirId: machshir.id,
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
     const valid = projectUsers.filter(
       (user) => user.attributes.telegramId
     );
     const transformedDataTel = valid;
    
    const pic =
      'https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png';
    //  jsonim.data.project.data.attributes.profilePic.data?.attributes?.formats
    //    ?.thumbnails.url ??
     // jsonim.data.project.data.attributes.profilePic.data?.attributes?.url
        //jsonim myid messege mainlang pic
       // console.log('before',title,body, transformedData);

        pusherer('https://www.1lev1.com/lev', transformedData, idL,pic,title,body,lang,fetch);
     //   console.log('after', transformedDataTel);
        sendBolkTelegram(transformedDataTel, idL,title,body,lang,fetch);
        
  const transformedDataMailPromises = projectUsers
    .filter(user => user.attributes.noMail !== true)
    .map(async (user) => {
      const emailHtml = await render(SimpleNuti, {
        head: title,
        body: body,
        username: user.attributes.username,
        previewText: title,
        lang: user.attributes.lang === "he" || user.attributes.lang === "en" ? user.attributes.lang : lang
      });

      return {
        email: user.attributes.email,
        id: user.id,
        emailHtml: emailHtml,
        users_permission_user: {
          data: {
            id: user.id,
            attributes: {
              userName: user.attributes.username,
              lang: user.attributes.lang
            }
          }
        }
      };
    });

  const transformedDataMail = await Promise.all(transformedDataMailPromises);
  sendBolkMail(transformedDataMail, idL, title, body, lang, fetch);
    return new Response    
}
