import { sendToSer } from '$lib/send/sendToSer.js';

export async function POST({ request, fetch }) {
  const datam = await request.json();

  const  machshirId  = datam.machshirId


    await sendToSer({ id: machshirId }, '45deleteMachshir', 0, 0, true, fetch);

  return new Response(null, { status: 204 });
}