import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const handler: ActionExecutionHandler = async (params, context) => {
  const { mashaabimId, name, descrip, kindOf, hm, spnot, price, myp, linkto, sdate, fdate } = params;
  const userId = context.userId as string;
  const jwt = context.jwt as string;
  const f = context.fetch as typeof fetch;
  const now = new Date().toISOString();

  const spData: Record<string, unknown> = {
    name,
    descrip:                 descrip || '',
    kindOf:                  kindOf  || 'total',
    unit:                    hm != null ? hm : 1,
    spnot:                   spnot  || '',
    price:                   price  != null ? price : 0,
    myp:                     myp    != null ? myp   : 0,
    linkto:                  linkto || '',
    users_permissions_user:  userId,
    mashaabim:               mashaabimId,
    publishedAt:             now
  };
  if (sdate) spData.sdate = sdate;
  if (fdate) spData.fdate = fdate;

  const res = await f(import.meta.env.VITE_URL + '/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({
      query: `mutation CreateSp($data: SpInput!) {
        createSp(data: $data) {
          data { id attributes { name } }
        }
      }`,
      variables: { data: spData }
    })
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data.createSp.data;
};

export const createResourceRequestConfig: ActionConfig = {
  key: 'createResourceRequest',
  description: 'Create a personal resource offering (Sp)',
  graphqlOperation: handler,
  paramSchema: {
    mashaabimId: { type: 'string',  required: true,  description: 'Mashaabim template ID' },
    name:        { type: 'string',  required: true,  description: 'Resource name' },
    descrip:     { type: 'string',  required: false, description: 'Description' },
    kindOf:      { type: 'string',  required: false, description: 'Type (total/monthly/yearly/perUnit/rent)' },
    hm:          { type: 'number',  required: false, description: 'Quantity/unit' },
    spnot:       { type: 'string',  required: false, description: 'Notes' },
    price:       { type: 'number',  required: false, description: 'Price' },
    myp:         { type: 'number',  required: false, description: 'Investment value' },
    linkto:      { type: 'string',  required: false, description: 'Link to product details' },
    sdate:       { type: 'string',  required: false, description: 'Start date (ISO)' },
    fdate:       { type: 'string',  required: false, description: 'End date (ISO)' }
  },
  authRules: [{ type: 'jwt', errorMessage: 'You must be logged in to create resources' }],
  updateStrategy: { type: 'none' }
};
