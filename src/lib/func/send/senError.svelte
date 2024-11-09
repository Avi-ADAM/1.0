<script context="module">
    export function sendError(err,location = "",fetch){
        console.error(err)
        
    let data = {"name":"כנראה בעיה", "action": location, "det": err }
   fetch("/api/ste", {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
})
  .then((response) => response)
  .then((data) => {
    console.log('Success:', data);

  })
  .catch((error) => {
    console.error('Error:', error);
  })
    }

</script>