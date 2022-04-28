<script>
  export let pmiData = [];
  export let user_1s = 1;
   import { onMount } from 'svelte';
   onMount(async () => {
 for (var k = 0; k < pmiData.length; k++) {
     const x = pmiData[k].users
     for (var z = 0; z < x.length; z++){
        pmiData[k].uids = [];
      pmiData[k].uids.push(x[z].users_permissions_user.id);
              pmiData[k].what = [];

           pmiData[k].what.push(x[z].what);
 }
}    

for (var t = 0; t <pmiData.length; t++){
    const allid = pmiData[t].uids;
    const myid = pmiData[t].myid;
    pmiData[t].already = false;
 pmiData[t].noofusersOk = 0;
 pmiData[t].noofusersNo = 0;

    if(allid.includes(myid)){
      pmiData[t].already = true;
    }
        for (var r=0; r< pmiData[t].users.length; r++){
            if (pmiData[t].users[r].what === true) {
                
                 pmiData[t].noofusersOk += 1;
               
            }else if (pmiData[t].users[r].what === false) {
              
                 pmiData[t].noofusersNo += 1;
               
            }
        }
        console.log(pmiData[t].users);
     pmiData[t].noofusersWaiting = 0
    const noofusersWaiting = user_1s - pmiData[t].users.length;
    pmiData[t].noofusersWaiting = noofusersWaiting;
        
    }
  console.log(pmiData );
}
    
    )
function remove (id) {
  console.log(id)
};
function edit (id) {
  console.log(id)
}
function confirm (id) {
      console.log(id)

}
    </script>

<div class="dd md:items-center border-2 border-gold rounded">
  <div class="body items-center">
  
  <table dir="rtl" >
    <caption class="sm:text-right md:text-center text-right ">  
      <h1 class="md:text-center text-2xl md:text-2xl font-bold"
      >פעולות בתהליך אישור</h1>
    </caption>
        <tr class="gg">
          <th class="gg">אפשרויות</th>
          {#each pmiData as data, i}
          <td class="gg" style="font-size: 3rem">
            {i + 1}
        </td>
          {/each}
    </tr> <tr class="ggr">
      <th class="ggr">שם</th>
      {#each pmiData as data, i}
            <td class="ggr">{data.name}</td>
            {/each}
          </tr> <tr>
            <th>תיאור</th>
            {#each pmiData as data, i}
            <td>
              {data.descrip != undefined && data.descrip != "undefined" ? data.descrip : ""}</td>
              {/each}
            </tr> <tr>
              <th>כישורים נדרשים</th>
              {#each pmiData as data, i}
            <td>
              {#each data.skills as da}
                 {` ${da.skillName} `}
              {/each}
              </td>
            {/each}
          </tr>  <tr>
              <th>הגדרת תפקיד</th>
              {#each pmiData as data, i}
            <td>
              {#each data.tafkidims as ta, i}
                 {` ${ta.roleDescription} `}
            {/each}
            </td>
            {/each}
          </tr>
          <tr>
              <th>סוג משימה</th>
              {#each pmiData as data, i}
            <td>
              {#each data.work_ways as dm, i}
                  {` ${dm.workWayName} `}  
              {/each}
              </td>
            {/each}
          </tr>
         <tr>
              <th>תאריך ביצוע</th>
              {#each pmiData as data, i}
            <td>              {#if data.Sqadualed != undefined}
              {data.Sqadualed}
            {/if}
            </td>
            {/each}
          </tr> <tr>
            <th>קישורים ציבוריים</th>
            {#each pmiData as data, i}
            <td>
              {#if data.publicklinks != undefined && data.publicklinks != "undefined" }
              {data.publicklinks}
              {/if}
             </td>
             {/each}
        </tr><tr>
          <th>הערות יחודיות לריקמה שלי</th>
          {#each pmiData as data, i}
          <td>
            {#if data.hearotMeyuchadot != undefined && data.hearotMeyuchadot != "undefined"}
            {data.hearotMeyuchadot}
            {/if}
           </td>
           {/each}
      </tr><tr>
        <th>קישורים יחודיים לריקמה שלי</th>
        {#each pmiData as data, i}
        <td>          {#if data.privatlinks != undefined && data.privatlinks != "undefined"} 

          {data.privatlinks} 
          {/if}
         </td>
         {/each}
    </tr><tr style="display:''" id="hoursD">
          <th >כמה שעות זה אמור לקחת? </th>
          {#each pmiData as data, i}
          <td>
            {#if data.noofhours > 0}

           {data.noofhours}
           {/if}
          </td>
          {/each}
        </tr><tr style="display:''" id="vallueperhourN" >
          <th>כמה שווה שעה ?</th>
          {#each pmiData as data, i}
          <td>
            {#if data.perhour > 0}

            {data.perhour}
            {/if}
          </td>
          {/each}
        </tr><tr >
      <th>שווי סך הכל למשימה </th>
      {#each pmiData as data, i}
      <td>
      {#if data.perhour > 0 & data.noofhours > 0}
      {data.perhour * data.noofhours}
      {:else} 
      <p>0</p>
      {/if}
      </td>
      {/each}
    </tr>
    <tr class="ggd">
          <th class="ggd"><span style="color:green;"> בעד </span><span style="color:yellow;"> בהמתנה </span><span style="color:red;"> נגד </span></th>
          {#each pmiData as data, i}
          <td class="ggd" style="font-size: 3rem ">
            
<svg style="margin: 0 auto;" height="189.605px" width="60.88px" version="1.1" viewBox="60 -35.561 295.207 956.131" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient gradientUnits="userSpaceOnUse" x1="221.872" y1="3.8" x2="221.872" y2="926.161" id="111gradient0" spreadMethod="reflect">
      <stop offset="0" style="stop-color: rgb(254, 149, 225);"/>
      <stop offset="1" style="stop-color: rgb(255, 13, 82);"/>
    </linearGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="221.87" cy="526.03" r="70.162" id="111gradient3">
      <stop offset="0" style="stop-color: rgb(232, 244, 232);"/>
      <stop offset="1" style="stop-color: rgb(0, 153, 117);"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="221.87" cy="358.03" r="70.162" id="111gradient2">
      <stop offset="0" style="stop-color: rgb(233, 229, 214);"/>
      <stop offset="1" style="stop-color: rgb(236, 244, 0);"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="221.532" cy="188.962" r="70.162" id="111gradient1">
      <stop offset="0" style="stop-color: rgb(230, 240, 240);"/>
      <stop offset="1" style="stop-color: rgba(153, 0, 0, 1)"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="7.789" cy="-9.581" r="7.789" id="111gradient6" spreadMethod="repeat" gradientTransform="matrix(0.911398, 0.118136, -0.128545, 0.991704, -0.541478, -0.99965)">
      <stop offset="0" style="stop-color: rgb(226, 30, 30);"/>
      <stop offset="1" style="stop-color: rgb(138, 57, 57);"/>
    </radialGradient>
    <linearGradient gradientUnits="userSpaceOnUse" x1="0" y1="-25.305" x2="0" y2="5.981" id="111gradient7">
      <stop offset="0" style="stop-color: #bada55"/>
      <stop offset="1" style="stop-color: rgb(11, 169, 255);"/>
    </linearGradient>
    <linearGradient gradientUnits="userSpaceOnUse" x1="0" y1="-25.305" x2="0" y2="5.981" id="111gradient8">
      <stop offset="0" style="stop-color: rgb(236, 146, 146);"/>
      <stop offset="1" style="stop-color: rgb(9, 254, 169);"/>
    </linearGradient>
    <linearGradient gradientUnits="userSpaceOnUse" x1="0" y1="-25.305" x2="0" y2="5.981" id="111gradient10">
      <stop offset="0" style="stop-color: rgb(42, 56, 253);"/>
      <stop offset="1" style="stop-color: rgb(210, 28, 55);"/>
    </linearGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="0" cy="-9.662" r="7.787" id="111gradient9">
      <stop offset="0" style="stop-color: rgb(130, 50, 0);"/>
      <stop offset="1" style="stop-color: rgb(255, 13, 13);"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="0" cy="-9.662" r="7.787" id="111gradient5">
      <stop offset="0" style="stop-color: rgb(255, 255, 255);"/>
      <stop offset="1" style="stop-color: rgb(34, 255, 0);"/>
    </radialGradient>
    <linearGradient gradientUnits="userSpaceOnUse" x1="221.872" y1="3.8" x2="221.872" y2="926.161" id="111gradient4">
      <stop offset="0" style="stop-color: rgb(129, 204, 181);"/>
      <stop offset="1" style="stop-color: rgb(142, 210, 233);"/>
    </linearGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="221.87" cy="190.03" r="70.162" id="111gradient11">
      <stop offset="0" style="stop-color: #bada55"/>
      <stop offset="1" style="stop-color: #758d29"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="221.87" cy="358.03" r="70.162" id="111gradient12">
      <stop offset="0" style="stop-color: #bada55"/>
      <stop offset="1" style="stop-color: #758d29"/>
    </radialGradient>
    <radialGradient gradientUnits="userSpaceOnUse" cx="221.87" cy="526.03" r="70.162" id="111gradient13">
      <stop offset="0" style="stop-color: #bada55"/>
      <stop offset="1" style="stop-color: #758d29"/>
    </radialGradient>
  </defs>
  <g transform="matrix(1, 0, 0, 0.950425, -44.268497, 0.575181)" style="">
    <path d="M 221.872 3.8 C 221.872 3.8 215.676 13.632 217.617 19.523 C 213.168 22.224 208.09 23.231 203.086 24.183 C 176.825 30.582 156.79 55.578 153.747 82.866 C 153.193 85.776 152.721 89.874 148.512 89.494 C 133.452 89.397 130.037 89.412 108.924 89.758 C 119.492 98.964 116.118 113.564 116.091 126.055 C 99.392 126.238 90.787 126.357 76.352 127.052 C 101.909 163.013 118.056 209.15 115.314 254.177 C 114.952 268.891 115.794 283.609 114.744 298.299 C 98.441 298.578 88.15 297.982 72.472 297.893 C 87.673 320.688 99.076 345.991 107.686 372.126 C 112.068 384.927 114.283 398.513 113.808 412.098 C 113.35 431.35 113.554 450.616 112.896 469.859 C 99.147 470.016 91.096 470.181 77.441 470.459 C 91.749 492.14 100.588 518.856 108.633 543.547 C 111.097 551.119 112.925 559.015 112.7 567.046 C 112.333 596.031 111.806 625 111.591 653.987 C 111.978 659.599 106.638 662.696 103.618 666.56 C 119.448 668.133 135.427 666.767 151.298 667.387 C 153.075 667.377 154.497 668.496 155.818 669.561 C 154.056 672.335 151.949 675.221 151.938 678.682 C 153.595 681.701 157.093 682.462 160.065 683.372 C 161.404 687.255 161.406 922.09 161.483 926.161 C 181.91 926.514 204.756 629.364 224.713 629.155 C 244.671 629.364 261.834 926.514 282.261 926.161 C 282.338 922.085 282.34 687.253 283.68 683.372 C 286.651 682.462 290.149 681.701 291.806 678.682 C 291.795 675.221 289.688 672.335 287.926 669.561 C 289.247 668.496 290.669 667.377 292.447 667.387 C 308.316 666.767 324.295 668.133 340.127 666.56 C 337.106 662.696 331.766 659.6 332.153 653.987 C 331.938 625.003 331.411 596.036 331.044 567.046 C 330.819 559.015 332.647 551.119 335.111 543.547 C 343.157 518.856 351.995 492.14 366.303 470.459 C 352.647 470.181 344.597 470.016 330.849 469.859 C 330.19 450.617 330.394 431.35 329.936 412.098 C 329.461 398.513 331.676 384.927 336.058 372.126 C 344.668 345.991 356.07 320.689 371.272 297.893 C 355.594 297.981 345.304 298.578 329 298.299 C 327.95 283.609 328.792 268.891 328.43 254.177 C 325.689 209.154 341.835 163.017 367.393 127.052 C 352.957 126.357 344.353 126.238 327.653 126.055 C 327.627 113.564 324.251 98.964 334.821 89.758 C 313.707 89.412 310.293 89.397 295.232 89.494 C 291.023 89.874 290.552 85.776 289.997 82.866 C 286.965 55.62 266.925 30.624 240.669 24.224 C 235.661 23.274 230.589 22.267 226.133 19.565 C 228.077 13.674 224.445 8.675 221.885 3.842 L 221.872 3.8 Z" 
    fill="url(#111gradient0)" style=" stroke-width: 8.20334px; stroke-linecap: square; stroke-miterlimit: 35; stroke-dashoffset: 4px; paint-order: stroke markers; " stroke="url(#111gradient4)"   />
    <g>
      <circle on:click={confirm(data.id)} cy="526.03" cx="221.87" r="70.162" fill="url(#111gradient3)" stroke="url(#111gradient13)"><title>בעד</title></circle>
      <circle 
          on:click={edit(data.id)}  cx="221.87" cy="358.03" r="70.162" fill="url(#111gradient2)" stroke="url(#111gradient12);"><title>בהמתנה</title></circle>
      <circle 
             on:click={remove(data.id)} cy="190.03" cx="221.87" r="70.162" fill="url(#111gradient1)" style=" stroke-width: 1.02542px; " stroke="url(#111gradient11)"><title>נגד</title></circle>
    </g>
  </g>
  <text stroke="url(#111gradient7)" fill="url(#111gradient6)" style=" font-family: Arial, sans-serif; font-size: 28px;  text-anchor: middle; white-space: pre;" transform="matrix(2.003436, 0, 0, 2.003446, 177.6035, 200.825073)"><title>נגד</title>{data.noofusersNo}</text>
  <text fill="url(#111gradient9)" style=" font-family: Arial, sans-serif; font-size: 28px; paint-order: fill;  stroke-width: 1.49742px; text-anchor: middle; white-space: pre;" stroke="url(#111gradient8)" transform="matrix(2.003436, 0, 0, 2.003446, 177.6035, 359.699219)"><title>בהמתנה</title>{data.noofusersWaiting}</text>
  <text  fill="url(#111gradient5)" stroke="url(#111gradient10)" style=" font-family: Arial, sans-serif; font-size: 28px;  text-anchor: middle; white-space: pre;" transform="matrix(2.003436, 0, 0, 2.003446, 177.6035, 518.699219)"><title>בעד</title>{data.noofusersOk}</text>

</svg>
        <!--    <button
             title='דחיה'
             on:click={remove(data.id)}><svg style="width:24px;height:24px" viewBox="0 0 24 24">
              <path fill="currentColor" d="M4,2H11A2,2 0 0,1 13,4V20A2,2 0 0,1 11,22H4A2,2 0 0,1 2,20V4A2,2 0 0,1 4,2M4,10V14H11V10H4M4,16V20H11V16H4M4,4V8H11V4H4M17.59,12L15,9.41L16.41,8L19,10.59L21.59,8L23,9.41L20.41,12L23,14.59L21.59,16L19,13.41L16.41,16L15,14.59L17.59,12Z" />
          </svg></button> 
          <button
          class="bg-pink-200 hover:bg-barbi text-mturk rounded-full"
          title="עריכה"
          on:click={edit(data.id)} 
          ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
           <path fill="currentColor" d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12H20A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4V2M18.78,3C18.61,3 18.43,3.07 18.3,3.2L17.08,4.41L19.58,6.91L20.8,5.7C21.06,5.44 21.06,5 20.8,4.75L19.25,3.2C19.12,3.07 18.95,3 18.78,3M16.37,5.12L9,12.5V15H11.5L18.87,7.62L16.37,5.12Z" />
          </svg>
          </button> 
          <button on:click={confirm(data.id)}> אישור</button>-->
        </td>
          {/each}
    </tr> 
    </table>
  </div>
  </div>

  
   
  <style>
  .gg{ 
     position: sticky;
     top: 1px; 
background-color: #6b0f1a;
background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);

     border-width: 4px;
  border-color: rgb(103, 232, 249);
     border-radius: 4%;
      opacity: 1;
      color: rgb(132, 241, 223);
  }
   .ggd{ 
     position: sticky;
     bottom: 1px; 
background-color: #6b0f1a;
background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);

     border-width: 4px;
  border-color: rgb(103, 232, 249);
     border-radius: 4%;
      opacity: 1;
                  color: rgb(132, 241, 223);


  }
  .ggr{ 
     position: sticky;
     top: 77px; 
background-color: #6b0f1a;
background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);

     opacity: 1;
            color: rgb(132, 241, 223);

  }
  .ggr:hover, .gg:hover, .ggd:hover {
    background:var(--barbi-pink);
  } 
    .dd{
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column;
    }
    .body {
      overflow-x: auto;
      overflow-y: auto;
     height: 100vh;
     width: 100vw;
     padding-left: 0.5em;
     padding-right: 0.5em;
    }
  
  table, th, td {
  border-collapse: collapse;
  border-width: 4px;
  border-color: rgb(103, 232, 249);
border-radius: 4%;
  }
  table {
  text-align: center;
  color: var(--barbi-pink);
  margin: 0 auto;
 
  }
 
 th{
     background-color: #6b0f1a;
     background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);
     color: rgb(132, 241, 223);
   }
  td{
     background-color: #5efaf2;
     background-image: linear-gradient(8deg, #5efaf2 0%, #eee 74%);
  }
 th:hover{
       background:var(--barbi-pink);

 }
  td:hover {
    background:rgb(132, 241, 223);
  } 
  </style>
      
        
   