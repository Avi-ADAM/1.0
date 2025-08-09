import { sendToSer } from "$lib/send/sendToSer.js";
import { json } from "@sveltejs/kit";

export async function GET({ locals, url, fetch }) {
  const lang = locals.lang;
  const tok = locals.tok;
  const uid = locals.uid;

  const start = parseInt(url.searchParams.get('start') || '0');
  const limit = parseInt(url.searchParams.get('limit') || '10');

  let userLang = lang;
  let isReg = tok == false ? false : true;
  const qid = userLang != "en"
      ? isReg ? "27GetOpenMissionsRegTr" : "29GetOpenMissionsNonregTr"
      : isReg ? "28GetOpenMissionsReg" : "30GetOpenMissionsNonreg";
  
  const variables = {
      start: start,
      limit: limit
  };
  
  let missions = [];
  let total = 0;
  let hasMoreData = false;

  try {
      const response = await sendToSer(variables, qid, null, null, !isReg, fetch);
      
      if (response.data.openMissions.data) {
          const newData = response.data.openMissions.data;
          const pagination = response.data.openMissions.meta.pagination;
          
          const reformatArray = arr => arr.map(({id, attributes}) => ({id, ...attributes}));
          missions = reformatArray(newData);
          total = pagination.total;
          hasMoreData = start + limit < pagination.total;
      }
  } catch (error) {
      console.error("Error fetching missions on server (API endpoint):", error);
  }

  return json({
    missions,
    total,
    hasMoreData
  });
}