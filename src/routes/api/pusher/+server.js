import webPush from "web-push";
import { env } from '$env/dynamic/private';

export async function POST({ request, fetch }) {
  const datam = await request.json();
  console.log('pusher strats');
  const messege = datam.messege;
  const jsoni = JSON.parse(datam.jsoni);
  const machshirId = datam.machshirId;
  console.log(jsoni)
  webPush.setVapidDetails(
    env.URL || import.meta.env.VITE_URL,
    env.publicKey,
    env.privateKey
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
    .catch((err) => {
      if (err.statusCode === 410 || err.statusCode === 404) {
        console.log('Subscription has unsubscribed or expired, deleting...');
        fetch('/api/deletePush', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ machshirId:machshirId }),
        });
      } else {
        console.error(err);
      }
    });
  return new Response();
}
