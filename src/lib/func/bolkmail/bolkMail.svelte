<script context="module">

    /***
     * push to telegram
     * @param {Array} emails   array contains id, and as attributes username lang and telegram chatid
     * @param {number} myid  user id to not notify
     * @param {object} title  {"he","ר","en":"r"}
     * @param {object} body  {"he","ר","en":"r"} 
     * @param {string} mainlang  "he" "en"
    */
    export async function sendBolkMail(emails = [],myid = 0,title = {"he":"","en":""},body = {"he":"","en":""},mainlang = "he",fetch){
      console.log(emails) 
      for (let i = 0; i < emails.length; i++) {
            const element = emails[i];
            if(element.id !== myid){
                let data = {emailHtml: element.emailHtml,
    email: element.email,
    previewText: title[element.users_permission_user.data.attributes.lang ?? mainlang],
    emailText:title[element.users_permission_user.data.attributes.lang ?? mainlang] + ":" + body[element.users_permission_user.data.attributes.lang ?? mainlang] }
    console.log(data,"before fetch bolk")          
    fetch('/api/sendMail', {
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