<script context="module">
    /***
     * @param jsonim Array of all machshirs with user feild that contains id and username
     * @param myid user id to not notify
     * @param messege object: {"he","ר","en":"r"}
     * @param minlang string: "he" "en"
    */
    export async function pusherer(jsonim = [],myid = 0,messege = {"he":"","en":""},mainlang = "he"){
        for (let i = 0; i < jsonim.length; i++) {
            const element = jsonim[i];
            if(element.users_permission_user.data.id != myid){
                let data = {jsoni: element.jsoni, messege :messege[element.users_permission_user.data.attributes.lang ?? mainlang]}
                fetch('/api/pusher', {
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
        }
    }
</script>