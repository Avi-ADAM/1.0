import type { ActionConfig, ActionExecutionHandler } from '../types.js';

const handler: ActionExecutionHandler = async (params, context) => {
  const { name, price, descrip, kindOf, linkto } = params;
  const jwt = context.jwt as string;
  const f = context.fetch as typeof fetch;
  const now = new Date().toISOString();

  const res = await f(import.meta.env.VITE_URL + '/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jwt}` },
    body: JSON.stringify({
      query: `mutation CreateMashaabim($data: MashaabimInput!) {
        createMashaabim(data: $data) {
          data { id attributes { name } }
        }
      }`,
      variables: {
        data: {
          name,
          price:       price   != null ? price   : 0,
          descrip:     descrip || '',
          kindOf:      kindOf  || 'total',
          linkto:      linkto  || '',
          publishedAt: now
        }
      }
    })
  });
  const json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data.createMashaabim.data;
};

export const createMashaabimConfig: ActionConfig = {
  key: 'createMashaabim',
  description: 'Create a new Mashaabim (resource/need template)',
  graphqlOperation: handler,
  paramSchema: {
    name:    { type: 'string', required: true,  description: 'Resource name' },
    price:   { type: 'number', required: false, description: 'Price/value' },
    descrip: { type: 'string', required: false, description: 'Short description' },
    kindOf:  { type: 'string', required: false, description: 'Type (total/monthly/yearly/perUnit/rent)' },
    linkto:  { type: 'string', required: false, description: 'Link to product details' }
  },
  authRules: [{ type: 'jwt', errorMessage: 'You must be logged in to create resources' }],
  updateStrategy: { type: 'none' }
};
