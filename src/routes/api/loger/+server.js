
export const POST = async ({ request }) => {
    const data = await request.json()

    const log = data.log;
    console.error("loger: ",log)
  return new Response(`Hello log! ${data.log}`);
}
