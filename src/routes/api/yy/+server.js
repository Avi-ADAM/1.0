export const POST = async ({ request }) => {
    console.log("tryng", request.body)
    const data = await request.json()
    console.log("gg", data)

  //  const name = data.name;
  //  const job = data.job;
  //  console.log("ryng", name, job)

    return new Response()
}