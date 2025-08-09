<script module>
    /***
     * send to api - return string
     * @param {object} data  {"x":"t","y":"r"}
     * @param {string} api  "pusher" || "timegrama"
    */
    export async function sendApi (data={},api = ""){
        let result = ""
              await fetch('/api/'+api, {
                method: 'POST',  
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
              })
                .then((response) => response)
                .then((data) => {
                  console.log('Success:', data);
                    result = 'Success:' + JSON.stringify(data)
                })
                .catch((error) => {
                  console.error('Error:', error);
                result = 'Error:' + JSON.stringify(error)
                });
        return result        
    }
</script>