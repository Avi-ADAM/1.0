import datai from '$lib/components/main/data.json';
// Server load (not universal): the page is anonymous, so the countries query
// runs as the service through /api/send — never against Strapi directly.
import { sendViaProxy } from '$lib/server/sendViaProxy.js';

export const load = async ({fetch}) => {
    let country, data

    const res = sendViaProxy(fetch, '305loveCountryAgreement', {}, { isSer: true })
      .catch((e) => {
        console.error('[love] country agreement query failed:', e);
        return null;
      });



 return {
   streamed: {
     data: new Promise((resolve) => {
       res
         .then((data) => {
            if (!data?.cuntries?.data) return resolve({ list: datai, total: 0 });
            country = data.cuntries.data;
            let total =0
            data = datai;
            for (let j = 0; j < country.length; j++) {
              for (let i = 0; i < data.length; i++) {
                if (data[i].name === country[j].attributes.name) {
                  data[i].agrees =
                    country[j].attributes.free_people.data.length;
                    total += country[j].attributes.free_people.data.length
                } else if (
                  (data[i].name === 'Palestine' && country[j].id === 167) ||
                  (data[i].name === 'Palestine' && country[j].id === 246)
                ) {
                  if (data[i].agrees > 0) {
                    data[i].agrees +=
                      country[j].attributes.free_people.data.length;
                      total += country[j].attributes.free_people.data.length
                  } else {
                    data[i].agrees =
                      country[j].attributes.free_people.data.length;
                      total += country[j].attributes.free_people.data.length
                  }
                } else if (
                  data[i].name === 'Russia' &&
                  country[j].attributes.name === 'Russian Federation'
                ) {
                  data[i].agrees =
                    country[j].attributes.free_people.data.length;
                    total += country[j].attributes.free_people.data.length
                } else if (
                  data[i].name === 'United States of America' &&
                  country[j].attributes.name === 'United States'
                ) {
                  data[i].agrees =
                    country[j].attributes.free_people.data.length;
                    total += country[j].attributes.free_people.data.length
                }
              }
            }
            // plain object — extra props on an array don't survive devalue
            // serialization from a server load
           return resolve({ list: data, total });
         })
         .catch((error) => {
           console.log(error);
         });
     })
   }
 };
};
