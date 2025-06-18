<script module>
  import { sendToSer } from '$lib/send/sendToSer.js';
  export async function crRatson(
    logo,
    startDate,
    finnishDate,
    fulfilled,
    name,
    des,
    allowJoin,
    vallues,
    longDes,
    bounti,
    totalbounti,
    users_permissions_users,
    link,
    missions,
    mashaabims
  ) {
    const da = new Date();
    const dai = da.toISOString();
    let d = await sendToSer(
      {
        logo,
        startDate,
        finnishDate,
        fulfilled,
        name,
        des,
        allowJoin,
        vallues,
        longDes,
        bounti,
        totalbounti,
        users_permissions_users,
        link,
        missions,
        mashaabims,
        publishedAt: dai
      },
      '5crratson', null, null, false, fetch
    ).then((d) => (d = d));
    if (d.data != null) {
      return d;
    } else {
      console.error(d);
      return 'error';
    }
  }
</script>
