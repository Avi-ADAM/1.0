<script context="module">
const HTTP_ST_ENDPOINT = import.meta.env.VITE_URL
export async function SendTo(dat,toc) {
	const ep = HTTP_ST_ENDPOINT + "/graphql"
	 let token;
	if (toc == null){
    const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
  
   token  = cookieValue; 
	}else {
		token = toc
	}
  let bearer1 = 'bearer' + ' ' + token;
	const response = await fetch(ep, {
		method: 'POST',
		credentials: 'include',
		body: 
        JSON.stringify({query: dat || {}}),
		headers: {
			'Content-Type': 'application/json',
            'Authorization': bearer1
		}
	})

	const isJson = response.headers.get('content-type')?.includes('application/json')

	const res = isJson ? await response.json() : await response.text()

         return res

}
</script>