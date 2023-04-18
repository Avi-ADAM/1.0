let url = "https://meaim.onrender.com/api/cuntries/5"
let hook = "https://api.render.com/deploy/srv-cgvck6odh87i4q2a938g?key=ZOpdbN-Msoo"
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
