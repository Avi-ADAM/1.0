//TODO: get token, decryp it with our imported env salt, get query, return data ,,,,גם אם ישלח רק שם משתמש וסיסמה עדיין הקוורי יכולה להיות מעוותת. הפתרון ה יחיד וולידציה צד שרת, או וולידציה מלאה או מעין קי ווליו בשלב ראשון של סוג הקוורי ואימות עליה
const HTTP_ST_ENDPOINT = import.meta.env.VITE_URL
	const ep = HTTP_ST_ENDPOINT + "/graphql"
	import {qids} from './qids.js'
    import {json, error} from '@sveltejs/kit'
const VITE_ADMINMONTHER = import.meta.env.VITE_ADMINMONTHER;

export async function POST({ request, cookies }) {
  const data = await request.json();
  let isSer = data.isSer ?? false;
    let idL = cookies.get('id');
    let variablesObject = {};
    let keyValueObject = data.data.arg
    for (let key in keyValueObject) {
      if (key === 'idL') {
        variablesObject[key] = idL; // Use the local uid for 'idL'
      } else {
        variablesObject[key] = keyValueObject[key];
      }
    }     
    let newd = [],e
    const dat = qids[data.data.queId]
    console.log(dat, variablesObject);
  let jw = isSer ? VITE_ADMINMONTHER : cookies.get('jwt');
  let bearer1 = 'bearer' + ' ' + jw;
  const res = await fetch(ep, {
    method: 'POST',
    credentials: 'include',
    body: JSON.stringify({ query: dat, variables: variablesObject || {} }),
    headers: {
      'Content-Type': 'application/json',
      Authorization: bearer1
    }
  })
    .then((res) => (res = res.json()))
    .then((data) => {
        newd = data
      console.log('server:', newd);
      if(newd.data != null){
        console.log("here")
        
      }else{
      throw error(500, newd.errors[0].message);
      }
    })
    .catch((e) => {
      console.error('Error:', e);
      throw error(500,e);
    });
    return json(newd);
}
/*
ללוגין
export async function post({ request, cookies }) {
    // ... your code

    return {
        headers: {
            'set-cookie': `yourCookieName=${yourCookieValue}; path=/; HttpOnly; max-age=31536000`,
        },
        // ... your code
    };
}
*/ 