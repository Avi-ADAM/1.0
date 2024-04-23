
// routes/+server.ts
import bot from './bot';

export async function POST({ request }) {
  try {
    await bot.handleUpdate(request.body);
    return new Response('', { status: 200 });
  } catch (error) {
    console.error('Error handling Telegram update:', error);
    return new Response('', { status: 500 });
  }
}
