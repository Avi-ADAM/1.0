let url = "https://beosher.onrender.com/api/cuntries/5"
let hook = "https://api.render.com/deploy/srv-ch61r85gk4qfhv7ntrfg?key=BULdt4sULMQ"
let t = false
async function awaitapi(){
const res = await fetch(url);
return res
}
export async function GET(req) {
    const res = await awaitapi();
    if (res.status >= 200 && res.status < 300) {
        t = false
        console.log("ok")

      } else{
        if (t == false){
            console.log("problema")
            let sec = false
            setTimeout(async function(){
                  const res = await awaitapi();
              if (res.status >= 200 && res.status < 300) {
        t = false
        sec = false
              }else{
                 t = true
            const resi = await fetch(hook);
                        console.log(resi)

              }
      },2000)
           
        }
      }
    return new Response('Hello Cron!');
  }