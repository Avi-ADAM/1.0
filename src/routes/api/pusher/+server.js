import webPush from "web-push";
export async function POST({ request }) {
  const datam = await request.json();
  console.log('submitted');
  const messege = datam.messege;
  const jsoni = JSON.parse(datam.jsoni);
  console.log(jsoni)
  webPush.setVapidDetails(
    import.meta.env.VITE_URL,
    import.meta.env.VITE_publicKey,
    import.meta.env.VITE_privateKey
  );
  let data = {
    message: messege,
    type: 'asset',
    metadata: {
      id: 7
    }
  };
  await webPush
    .sendNotification(jsoni, JSON.stringify(data))
    .then(() => console.log('notification sent'))
    .catch(console.error);
  return new Response();
}
