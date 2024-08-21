<script context="module">
    /***
     * push to telegram
     * @param {Array} telegrams   array contains objects with id, and as attributes username lang and telegram chatid
     * @param {number} myid  user id to not notify
     * @param {object} title  {"he","ר","en":"r"}
     * @param {object} body  {"he","ר","en":"r"} 
     * @param {string} mainlang  "he" "en"
    */
    export async function sendBolkTelegram(telegrams = [],myid = 0,title = {"he":"","en":""},body = {"he":"","en":""},mainlang = "he",fetch){
      console.log(mainlang,telegrams) 
      for (let i = 0; i < telegrams.length; i++) {
            const element = telegrams[i];
            if(element.id !== myid){
              
                let data = {isNew: true, lang:element.attributes.lang ?? mainlang,chat_id: element.attributes.telegramId,  det :title[element.attributes.lang ?? mainlang] + "%0A" + body[element.attributes.lang ?? mainlang] }
              console.log(data)
                fetch('https://www.1lev1.com/api/ste', {
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