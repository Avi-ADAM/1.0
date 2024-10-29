

export async function load({ locals, params }) {
  const lang = locals.lang;
  const tok = locals.tok;
  const uid = locals.uid
   
  return {
    uid,
    lang,
    tok: tok == false ? false : true,
  };
}
