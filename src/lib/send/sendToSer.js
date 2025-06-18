const NODE_URL = import.meta.env.VITE_NURL
    export async function sendToSer(arg = {},queId = "", me = 0, project = 0, isSer = false, fetch) {
         
        let datau = {isSer: isSer, data:{arg,queId}}
      let da = []
       await fetch("/api/send", {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(datau),
})
  .then((res) => (res = res.json()))
    .then((data) => {
    console.log('Success:', data);
    da = data
  })
  .catch((error) => {
    console.error('Error:', error);
    throw error
  })
  return da
    }
