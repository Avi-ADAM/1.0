import { sendToSer } from '$lib/send/sendToSer.js';

export async function POST({ request, fetch }) {
  const { endpoint } = await request.json();

  await sendToSer({ endpoint }, '45deleteMachshir', 0, 0, true, fetch);

  return new Response(null, { status: 204 });
}