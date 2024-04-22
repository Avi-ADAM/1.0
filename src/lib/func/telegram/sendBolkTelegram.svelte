<script context="module">
    /***
     * push to devices
     * @param {Array} telegrams   array contains id, and as attributes username lang and telegram chatid
     * @param {number} myid  user id to not notify
     * @param {object} title  {"he","ר","en":"r"}
     * @param {object} body  {"he","ר","en":"r"} 
     * @param {string} mainlang  "he" "en"
    */
    export async function sendBolkTelegram(telegrams = [],myid = 0,title = {"he":"","en":""},body = {"he":"","en":""},mainlang = "he",fetch){
      console.log(telegrams) 
      for (let i = 0; i < telegrams.length; i++) {
            const element = telegrams[i];
            if(element.users_permission_user.data.id !== myid){
                let data = {lang:element.users_permission_user.data.attributes.lang ?? mainlang,chat_id: element.users_permission_user.data.attributes.telegramId,  messege :title[element.users_permission_user.data.attributes.lang ?? mainlang] + "%0A" + body[element.users_permission_user.data.attributes.lang ?? mainlang] }
                fetch('/api/ste', {
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