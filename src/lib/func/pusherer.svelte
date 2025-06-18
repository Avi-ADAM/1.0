<script module>
    /***
     * push to devices
     * @param {Array} jsonim  of all machshirs with user feild that contains id, and as attributes username and lang
     * @param {number} myid  user id to not notify
     * @param {object} title  {"he","ר","en":"r"}
     * @param {object} body  {"he","ר","en":"r"} 
     * @param {string} pic  'https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png'
     * @param {string} mainlang  "he" "en"
    */
    export async function pusherer(url = 'https://www.1lev1.com/lev',jsonim = [],myid = 0,pic = 'https://res.cloudinary.com/love1/image/upload/v1645647192/apple-touch-icon_irclue.png',title = {"he":"","en":""},body = {"he":"","en":""},mainlang = "he",fetch){
      console.log(jsonim) 
      for (let i = 0; i < jsonim.length; i++) {
            const element = jsonim[i];
                  const lango = element.users_permission_user.data.attributes.lang == "he" || element.users_permission_user.data.attributes.lang == "en" ? element.users_permission_user.data.attributes.lang : mainlang == "he" || mainlang == "en" ? mainlang : "he" 

            console.log(element)
            if(element.users_permission_user.data.id !== myid){
                let data = {jsoni: element.jsoni, messege :{url, body: body[lango], pic, title: title[lango]}}
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