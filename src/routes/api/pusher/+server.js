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
  // A caller whose message goes stale (a device co-sign request) caps how long
  // the push service may hold it; everyone else keeps the library default.
  const ttl = Number.isInteger(datam.ttl) && datam.ttl > 0 ? { TTL: datam.ttl } : undefined;
  await webPush
    .sendNotification(jsoni, JSON.stringify(data), ttl)
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
