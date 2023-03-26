let url = "https://strapi-87gh.onrender.com/api/cuntries/5"
let hook = "https://api.render.com/deploy/srv-cdpv9po2i3mjalodkvog?key=nOoOsyohDfc"
let t = false
export async function GET(req) {
    const res = await fetch(url);
    if (res.status >= 200 && res.status < 300) {
        t = false
        console.log("ok")

      } else{
        if (t == false){
            console.log("problema")
            t = true
            const resi = await fetch(hook);
            console.log(resi)
        }
      }
    return new Response('Hello Cron!');
  }
