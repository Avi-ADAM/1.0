<script context="module">
    /***
     * nutify user by email phone and push
     * @param {number} id  user id to notify
     * @param {object} title  {"he","ר","en":"r"}
     * @param {object} body  {"he","ר","en":"r"} 
     * @param {string} mainlang  "he" "en"
    */
    export async function nutifyUser(id = 0,title = {"he":"","en":""},body = {"he":"","en":""},mainlang = "he",fetch){     
                let data = {id,title,body,mainlang}
                fetch('/api/nutiUser', {
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
                });
            }
</script>