

import { sendToSer } from "$lib/send/sendToSer.js";

export async function load({ locals, url, fetch }) {
  const lang = locals.lang;
  const tok = locals.tok;
  const uid = locals.uid;

  // For initial load, fetch only the first batch
  const start = 0;
  const limit = 10;

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
      console.error("Error fetching initial missions on server:", error);
  }

  return {
    uid,
    lang,
    tok: tok == false ? false : true,
    missions,
    total,
    hasMoreData
  };
}
