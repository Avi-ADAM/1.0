<script context="module">
export function sendEror(uid,data,errorId) {
  console.log(uid,data,errorId)
    let datar = {"log": `id: ${uid} erId: ${errorId} data: ${data}`}
    fetch("/api/loger", {
  method: 'POST', // or 'PUT'
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(datar),
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