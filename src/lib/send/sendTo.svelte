<script module>
  import { page } from '$app/state';
  const HTTP_ST_ENDPOINT = import.meta.env.VITE_URL;
  export async function SendTo(dat, toc) {
    if (toc == null || toc == undefined || toc == true || toc == false) {
      // Use proxy endpoint to handle httpOnly cookies securely
      const response = await fetch('/api/send', {
        method: 'POST',
        body: JSON.stringify({
          data: {
            query: dat
          }
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });
      const res = await response.json();
      return res;
    } else {
      const ep = HTTP_ST_ENDPOINT + '/graphql';
      let token = toc;
      let bearer1 = 'bearer' + ' ' + token;
      const response = await fetch(ep, {
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({ query: dat || {} }),
        headers: {
          'Content-Type': 'application/json',
          Authorization: bearer1
        }
      });
      const isJson = response.headers
        .get('content-type')
        ?.includes('application/json');
      const res = isJson ? await response.json() : await response.text();
      return res;
    }
  }
</script>
