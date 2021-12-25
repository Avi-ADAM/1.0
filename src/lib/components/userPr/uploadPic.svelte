<script>
import { JWT } from '../../stores/jwt.js';
    import { idM } from '../../stores/idM.js'; 
    import { liUN } from '../../stores/liUN.js';
    import { uPic } from  '../../stores/uPic.js';

    import axios from 'axios';
    let url1 = "https://strapi-k4vr.onrender.com/upload";

    
    let token; 
 ///   JWT.subscribe(newwork => {
 ///   token = newwork;
 ///   });
    

    let meData;
    let idLi;
///    idM.subscribe(nvalue => {
///    idLi = nvalue;
///});

let files;
function sendP () {
  console.log (document.cookie);
    const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
  const cookieValueId = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  .split('=')[1];
  idLi = cookieValueId;
    token  = cookieValue; 
    console.log(token);
    let bearer1 = 'bearer' + ' ' + token;
    let link ="https://strapi-k4vr.onrender.com/users/" + idLi ;
let fd = new FormData();
    fd.append('files', files[0]);
  axios
 .post( url1, fd  ,{
                headers: {
                    Authorization: bearer1,
                },
            })
            .then(({ data }) => {
                const imageId = data[0].id;  
  axios
  .post(link, {
    profilePic: imageId,
    
              },
  {
  headers: {
    'Authorization': bearer1
            }})
  .then(response => {
    console.log('הצליח', response.data);
    meData = response.data;
    console.log(meData.profilePic);
    uPic.set(meData.profilePic.formats.small.url);

              })
  .catch(error => {
    console.log('צריך לתקן:', error.response);
            });
})};

 export const picLink = "https://strapi-k4vr.onrender.com" + $uPic; 
</script>
    
    <div dir="rtl" class="flex content-center ">
        <label for="avatar">בחירת תמונה</label>
        <input type="file"
               id="avatar" name="avatar"
               accept="image/png, image/jpeg"
               bind:files={files}
               >
               <button on:click={sendP}  class="bg-blue-500 hover:bg-pink-700 text-white font-bold py-2 px-4 rounded">העלאה</button> 
              </div>