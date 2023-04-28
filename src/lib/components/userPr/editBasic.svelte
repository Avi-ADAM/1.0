<script>
import { goto } from '$app/navigation';
  import { lang } from '$lib/stores/lang.js'
  import { addToast } from 'as-toast';
  import {SendTo} from '$lib/send/sendTo.svelte'
 import { createEventDispatcher } from 'svelte';
export let isGuidMe = false;
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
//import { getAnalytics } from "firebase/analytics";


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAq9ZNUsrrUw-mHmi8jCjkmcDdR6PpLpLc",
  authDomain: "lev1-9ad4a.firebaseapp.com",
  projectId: "lev1-9ad4a",
  storageBucket: "lev1-9ad4a.appspot.com",
  messagingSenderId: "30082803372",
  appId: "1:30082803372:web:685ddb1486f76123b2a109",
  measurementId: "G-G3F3SSVCKL"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
//const analytics = getAnalytics(app);
import { getMessaging, getToken } from "firebase/messaging";

// Get registration token. Initially this makes a network call, once retrieved
// subsequent calls to getToken will return from cache.
const messaging = getMessaging(app);

// Add the public key generated from the console here.
    const dispatch = createEventDispatcher();
    const er = {"he":"כרטה שגיעה","en": "an error just occored"}
const suc ={"he": "נרשמת להתראות במכשיר זה בהצלחה","en":"you sucssesfully registered to nutification on this device"}
 async function askNotificationPermission() {
    getToken(messaging, { vapidKey: 'BJoimg2miGigQrjDQeEUmtYBfea_vQX7fOCcFS33NuhrMeQXqFmKJMlrdhERnOyXnJzkhgTzF70v2J03jHi1py8' }).then((currentToken) => {
  if (currentToken) {
    // Send the token to your server and update the UI if necessary
    // ...
   /* console.log("token",currentToken)
     const cookieValueId = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  .split('=')[1];
  uid = cookieValueId;
    let que = `mutation { 
  createStrapi_plugin_fcm_fcm_topics(
      id: ${uid}
      data: { 
        confirmed: true
 }
  ){data {id}}
 } ` 
    console.log(que)
 try{
 let res =  SendTo(que)
 .then (res => res = res);
  console.log(res)
  if(res.data !=null){
    addToast(suc[$lang])
      localStorage.setItem("nuti", true);
  }else{
    addToast(er[$lang],"warn")
  }
}  catch (e) {
  console.error(e)
  addToast(`${er[$lang]}.${e.status},${e.message}`,"warn")
  }*/
  } else {
    // Show permission request UI
    if (!"Notification" in window) {
      console.log("This browser does not support notifications.");
    } else {
      if(checkNotificationPromise()) {
        Notification.requestPermission()
        .then((permission) => {
          handlePermission(permission);
        })
      } else {
        Notification.requestPermission(function(permission) {
          handlePermission(permission);
        });
      }
    }
    console.log('No registration token available. Request permission to generate one.');
    // ...
  }
}).catch((err) => {
  console.log('An error occurred while retrieving token. ', err);
  // ...
});
    // function to actually ask the permissions
    function handlePermission(permission) {
      // Whatever the user answers, we make sure Chrome stores the information
      if(!('permission' in Notification)) {
        Notification.permission = permission;
      }

      // set the button to shown or hidden, depending on what the user answers
      if(Notification.permission === 'denied' || Notification.permission === 'default') {
        notificationBtn.style.display = 'block';
      } else {
        notificationBtn.style.display = 'none';
      }
    }

    // Let's check if the browser supports notifications
    
  }

  // Function to check whether browser supports the promise version of requestPermission()
  // Safari only supports the old callback-based version
  function checkNotificationPromise() {
    try {
      Notification.requestPermission().then();
    } catch(e) {
      return false;
    }

    return true;
  }
let password;
let shgi;
function logout() {
    localStorage.clear();

    var cookies = document.cookie.split(";");

    for (var i = 0; i < cookies.length; i++) {
        var cookie = cookies[i];
        var eqPos = cookie.indexOf("=");
        var name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT";
    }
    goto("/",)
}

function save (){
  localStorage.setItem("cards", checked);
    dispatch('message', {
     fblink: fblink,
      twiterlink: twiterlink,
      discordlink: discordlink,
      githublink: githublink,
    frd: frd,
	  bi : bi,
	  un: un,
	  em: mail,
	  lango: lango,
    cards: checked
    })
  };

 export let checked = false

import axios from 'axios';
let passwordx;
let errorl = null;
let before = true;
export let fblink, twiterlink,discordlink,githublink;
export let mail;
export let un;
export let bi;
export let frd;
export let lango;
export let uid
let passi;

function shaneh () {
          passwordx = passwordx.trim();
          const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];

    let token  = cookieValue;
    let bearer1 = 'bearer' + ' ' + token;
   axios
  .post('https://beosher.onrender.com/api/auth/change-password', {
    currentPassword: passi,
    password: passwordx,
    passwordConfirmation: passwordx
  },
  {
    headers: {
      Authorization: bearer1,
    },
  })
  .then(response => {
        console.log('Your password has been changed.', response);
        addToast(`${passchanged[$lang]}`, 'info');

    before = false;
  })
  .catch(error => {
    // Handle error.
    console.log('An error occurred:', error.response);
  errorl = error.response.data ;
  })};

	let strength = 0;
	let validations = [];
	let showPassword = false;
	function validatePassword(e) {
        passwordx = e.target.value
		const password = e.target.value;
		validations = [
			password.length > 5,
			password.search(/[A-Z]/) > -1,
			password.search(/[0-9]/) > -1,
		//	password.search(/[$&+,:;=?@#]/) > -1,
		];
		strength = validations.reduce((acc, cur) => acc + cur, 0);

	}
	let chan = false;
	function ch (){
		chan = true
    console.log(checked)
	}
	function getV (e){
    passwordx = e.target.value
	}
    let change = false;
    let pressed = false
	async function endGuid(){
    pressed = true
  console.log("guid סיום")
  isGuidMe = false;
  document.cookie = `guidMe=done; expires=` + new Date(2026, 0, 1).toUTCString();
  const cookieValueId = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  .split('=')[1];
  let uid = cookieValueId;
  let q = `
  mutation { updateUsersPermissionsUser(
    id:${uid}
      data: { profilManualAlready: true }
  ){
      data {id}
    }
  }
  `
  await SendTo(q)
  addToast(`${guidend[$lang]}`, 'info');
  pressed = false
}
 async function startGuid(){
  pressed = true
  console.log("guid")
    isGuidMe = true;
 document.cookie = `guidMe=again; expires=` + new Date(2026, 0, 1).toUTCString();
 const cookieValueId = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  .split('=')[1];
  let uid = cookieValueId;
  let q = `
  mutation { updateUsersPermissionsUser(
    id:${uid}
      data: { profilManualAlready: false }
  ){
      data {id}
    }
  }
  `
  await SendTo(q)
   addToast(`${guidback[$lang]}`, 'info');
   dispatch("guid")
   pressed = false
}
const svbt = {"he": "שמירת שינויים","en": "save changes"}
const guidend = {"he": "המדריך לא יוצג שוב, ניתן להחזירו בכל עת בתפריט זה","en": "the guid will not show up again, you can return it back from here"}
const guidback = {"he": "המדריך חזר! יש לרענן את העמוד כדי לראותו","en": "the guid ia back! refreach the page to see it"}
 const pr = {"he":"שפה מועדפת", "en": "prefferd Language"}
 const myfd = {"he":"היום החופשי שלי", "en": "My free day"}
 const sun = {"he":"ראשון", "en": "Sunday"}
 const mon = {"he": "שני", "en": "Monday"}
 const the = {"he": "שלישי", "en": "Tuesday"}
 const fo = {"he": "רביעי", "en": "Wednesday"}
 const to = {"he": "חמישי", "en": "Thursday"}
 const fri = {"he": "שישי", "en": "Friday"}
 const shabat = {"he": "שבת", "en": "Saturday"}
 const head = {"he": "עריכת הפרטים שלי", "en": "Edit My Profile"}
 const nm = {"he": "שם","en": "name"}
  const githublinkde = {"he":"לינק לגיטהב שלי","en":"link to my GitHub"}
   const fblinkde = {"he":"לינק לפייסבוק שלי","en":"link to my Facebook"}
   const discordlinkde = {"he":"לינק לדיסקורד שלי","en":"link to my Discord"}
   const twiterlinkde = {"he":"לינק לטוויטר שלי","en":"link to my twitter"}
  const nameal = {"he":"השם כבר קיים נא לבחור שם אחר","en": "name already exists please choose another name"}
  const biot = {"he": "ביוגרפיה", "en": "biography"}
  const addn = {"he":" יצירת סיסמה חדשה","en": "Create new password"}
  const changti = {"he": " שנה סיסמה","en": "change password"}
    const val1 = {"he":"על הססמה להכיל לפחות 8 אותיות","en": "be at least 8 characters"}
  const val2 = {"he":"ולפחות אות אחת גדולה באנגלית","en": "must contain a capital letter"}
  const val3 = {"he":"ולפחות מספר אחד","en": "must contain a number"}
  const oldps = {"he": "הסיסמה הקודמת", "en":"old password" }
  const passchanged = {"he": "הסיסמה השתנתה בהצלחה!", "en": "the password has changed sucssefully!"}
  const co = {"he": "מטבעות", "en":"coins"}
  const car = {"he": "קלפים", "en": "cards"}
  const level = {"he":"תצוגה מועדפת במסך הלב:","en":"preferred Lev page display:"}
</script>
<h1 class="text-barbi text-center text-m">{head[$lang]}</h1>
 <div dir={$lang == "he" ? "rtl" :"ltr"}  class='textinputi'>
  <input name="des" on:change={ch} bind:value={un}
 type='text' class='inputi' required >
  <label for="des" class='labeli'>{nm[$lang]}</label>
  <span class='line'></span>
</div>
{#if shgi == true}<small class="text-red-600">{nameal[$lang]}</small>{/if}
<!--
    <div dir="rtl" class='textinputi'>
  <input name="es" on:change={ch}  bind:value={mail}
 type='text' class='inputi' required >
  <label for="es" class='labeli'>מייל</label>
  <span class='line'></span>
</div>-->

   <div dir={$lang == "he" ? "rtl" :"ltr"}  class='textinputi'>
  <textarea name="s" on:change={ch}  bind:value={bi}
 type='textarea' class='inputi d' required></textarea>
  <label for="s" class='labeli'>{biot[$lang]}</label>
  <span class='line'></span>
</div>
<div dir={$lang == "he" ? "rtl" :"ltr"} class='textinput'>
  <input name="de" on:change={ch}    bind:value={githublink}
 type='text' class='inputi' required>
  <label for="de" class='labeli'>{githublinkde[$lang]}</label>
  <span class='line'></span>
</div>
<div dir={$lang == "he" ? "rtl" :"ltr"} class='textinput'>
  <input name="de"  on:change={ch}   bind:value={twiterlink}
 type='text' class='inputi' required>
  <label for="de" class='labeli'>{twiterlinkde[$lang]}</label>
  <span class='line'></span>
</div>
<div dir={$lang == "he" ? "rtl" :"ltr"} class='textinput'>
  <input name="de"  on:change={ch}   bind:value={discordlink}
 type='text' class='inputi' required>
  <label for="de" class='labeli'>{discordlinkde[$lang]}</label>
  <span class='line'></span>
</div>
<div dir={$lang == "he" ? "rtl" :"ltr"} class='textinput'>
  <input name="de"  on:change={ch}   bind:value={fblink}
 type='text' class='inputi' required>
  <label for="de" class='labeli'>{fblinkde[$lang]}</label>
  <span class='line'></span>
</div>
<div class="grid items-center justify-center">

   <div dir="rtl" class="mb-3 xl:w-96 m-2">
      <h2 class="text-center text-barbi">{myfd[$lang]}</h2>
    <select class:round={$lang == "he"} class:rounden={$lang == "en"} on:change={ch} bind:value={frd}
	 class=" form-select appearance-none
      block
      w-full
      px-8
      py-1.5
      text-barbi
      font-normal
      bg-white bg-clip-padding bg-no-repeat
      border border-solid border-gold
      rounded
      transition
      ease-in-out
      m-0
      focus:text-barbi focus:bg-lturk focus:border-barbi focus:outline-none">
<option  value="na" selected>{myfd[$lang]}</option>
<option value="sun">{sun[$lang]}</option>
<option value="mon">{mon[$lang]}</option>
<option value="thu">{the[$lang]}</option>
<option value="wen">{fo[$lang]}</option>
<option value="teh">{to[$lang]}</option>
<option value="fri">{fri[$lang]}</option>
<option value="shabat">{shabat[$lang]}</option>
</select>
</div>

   <div dir="rtl" class="mb-3 xl:w-96 m-2">
      <h2 class="text-center text-barbi">{pr[$lang]}</h2>
    <select class:round={$lang == "he"} class:rounden={$lang == "en"} on:change={ch} bind:value={lango}
	 class=" form-select appearance-none
      block
      w-full
      px-8
      py-1.5
      text-barbi
      font-normal
      bg-white bg-clip-padding bg-no-repeat
      border border-solid border-gold
      rounded
      transition
      ease-in-out
      m-0
      focus:text-barbi focus:bg-lturk focus:border-barbi focus:outline-none">
<option  value="na" selected></option>
<option value="he">עברית</option>
<option value="en">English</option>
</select>
</div>
<h3  class="text-barbi">{level[$lang]}</h3>

<div class="flex items-center justify-center" dir="ltr">
  <label for="Toggle3" class="inline-flex items-center  p-2 rounded-md cursor-pointer text-gray-800">
    <input id="Toggle3" type="checkbox" class="hidden peer" bind:checked on:change="{ch}">
    <span class="px-4 py-2 rounded-l-md text-barbi peer-checked:text-gray-900 bg-mturk peer-checked:bg-gold">{co[$lang]}</span>
    <span class="px-4 py-2 rounded-r-md  peer-checked:text-barbi  bg-gold peer-checked:bg-mturk">{car[$lang]}</span>
  </label>
  </div>
<div class="grid items-center justify-center">

{#if chan == true}
<div>
<button type="button" on:click={save}  class="m-4 border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold p-2  rounded-full">{svbt[$lang]}</button>
</div>
{/if}
{#if change}
{#if before}
<div>
        <div>
            {#if errorl}
                        <h1
                        style="color:var(--barbi-pink); font-size:13px; font-weight:bold background-color: white; opacity: 0.7; max-width: 40vw;"
                        >{errorl} </h1>
       {/if}
    </div>
<main>
	<form on:submit|preventDefault={shaneh}>
		 <div class="field">
			<input
				autocomplete="old-password"
				name="email"
				class="input"
				placeholder="{oldps[$lang]}"
                bind:value={passi}
				/>
		</div>

		<div class="field">
			<input
				autocomplete="new-password"
   				type={showPassword ? "text" : "password"}
				name="email"
				class="input"
				placeholder="{addn[$lang]}"
				on:input={validatePassword}
				on:blur={getV}
			/>
			<span
				class="toggle-password"
				on:mouseenter={() => (showPassword = true)}
				on:mouseleave={() => (showPassword = false)}
			>
				{showPassword ? "🔒" : "👁"}
			</span>
		</div>


		<div class="strength">
			<span class="bar bar-1" class:bar-show={strength > 0} />
			<span class="bar bar-2" class:bar-show={strength > 1} />
			<span class="bar bar-3" class:bar-show={strength > 2} />
			<span class="bar bar-4" class:bar-show={strength > 3} />
		</div>

	<ul dir="rtl">
			<li>
				{validations[0] ? "🏆" : "❌"} {val1[$lang]}
			</li>
			<li>
				{validations[1] ? "🏆" : "❌"} {val2[$lang]}
			</li>
			<li>{validations[2] ? "🏆" : "❌"} {val3[$lang]}</li>
			<!--<li>
				{validations[3] ? "🏆" : "❌"}  ולפחות סמל אחד מאלו($&+,:;=?@#) must contain one symbol ($&+,:;=?@#)
			</li>-->
		</ul>

		<button  class="m-4 border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold p-2  rounded-full" on:click={shaneh} disabled={strength < 4}>{changti[$lang]}</button>
	</form>
</main>


    </div>
    {:else }
<h1>{passchanged[$lang]}</h1>

    {/if}
    {:else}
    <button type="button" on:click={()=> change = true}  class="m-4 border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold p-2  rounded-full">שינוי סיסמה</button>

    {/if}
	<button type="button" on:click={askNotificationPermission} class="m-4 border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold p-2  rounded-full">הרשמה לקבלת התראות</button>
{#if isGuidMe != false && pressed == false}
	<button type="button" on:click={endGuid} class="m-4 border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold p-2  rounded-full">ביטול הצגת המדריך</button>
{:else if isGuidMe == false && pressed == false}
	<button type="button" on:click={startGuid} class="m-4 border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold p-2  rounded-full"> החזרת הצגת המדריך</button>
{/if}
	<button type="button" on:click={logout} class="m-2 bg-gold text-red-800 border border-red-800 hover:text-gold hover:bg-red-800 p-2 rounded-full">יציאה מהחשבון במכשיר זה</button>
</div>
</div>
<style>
	 textarea::-webkit-resizer {
  border-width: 8px;
  border-style: solid;
  border-color: transparent  transparent var(--gold)  var(--gold);
}
.inputi {
  font-size: 8px;

}
select.rounden {
  background-image:
    linear-gradient(45deg, transparent 50%, gray 50%),
    linear-gradient(135deg, gray 50%, transparent 50%),
    radial-gradient(#ddd 70%, transparent 72%);
  background-position:
    calc(100% - 20px) calc(1em + 2px),
    calc(100% - 15px) calc(1em + 2px),
    calc(100% - .5em) .5em;
  background-size:
    5px 5px,
    5px 5px,
    1.5em 1.5em;
  background-repeat: no-repeat;
}

select.rounden:focus {
  background-image:
    linear-gradient(45deg, white 50%, transparent 50%),
    linear-gradient(135deg, transparent 50%, white 50%),
    radial-gradient(gray 70%, transparent 72%);
  background-position:
    calc(100% - 15px) 1em,
    calc(100% - 20px) 1em,
    calc(100% - .5em) .5em;
  background-size:
    5px 5px,
    5px 5px,
    1.5em 1.5em;
  background-repeat: no-repeat;
  border-color: green;
  outline: 0;
}
select{
	font-size: 100%;
}
select.round {
  background-image:
    linear-gradient(315deg, transparent 50%, rgb(0, 174, 255) 50%),
    linear-gradient(225deg, rgb(0, 174, 255) 50%, transparent 50%),
    radial-gradient(#ddd 70%, transparent 72%);
  background-position:
    calc(0% + 20px) calc(1em + 2px),
    calc(0% + 15px) calc(1em + 2px),
    calc(0% + .5em) .5em;
  background-size:
    5px 5px,
    5px 5px,
    1.5em 1.5em;
  background-repeat: no-repeat;
}

select.round:focus {
  background-image:
    linear-gradient(315deg, white 50%, transparent 50%),
    linear-gradient(225deg, transparent 50%, white 50%),
    radial-gradient(gray 70%, transparent 72%);
  background-position:
    calc(0% + 15px) 1em,
    calc(0% + 20px) 1em,
    calc(0% + .5em) .5em;
  background-size:
    5px 5px,
    5px 5px,
    1.5em 1.5em;
  background-repeat: no-repeat;
  border-color: green;
  outline: 0;
}

@media (min-width: 528px) {
.inputi {
  font-size: 15px;

}
select{
	font-size: 100%;
}

}

 .textinputi {
  position: relative;
  width: 100%;
  display: block;
}

.inputi {

  border: none;
  margin: 0;
  padding: 10px 0;
  outline: none;
  border-bottom: solid 1px var(--gold);
  margin-top: 12px;
  width: 100%;
 color:  var(--barbi-pink);
  -webkit-tap-highlight-color: transparent;
  background: transparent;
}


.labeli {

  font-size: 15px;
  position: absolute;
  right: 0;
  top: 22px;
  transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
  pointer-events: none;
  color:var(--barbi-pink);
  user-select: none;
}

.line {
  height: 2px;
  background-color: #2196F3;
  position: absolute;
  transform: translateX(-50%);
  left: 50%;
  bottom: 0;
  width: 0;
  transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
}

.inputi:focus ~ .line, .inputi:valid ~ .line {
  width: 100%;
}

.inputi:focus ~ .labeli, .inputi:valid ~ .labeli {
  font-size: 11px;
  color: var(--gold);
  top: 0;
}
	.field {
		width: 80%;
		position: relative;
		border-bottom: 2px dashed var(--text-color);
		margin: 1rem auto ;
	}
	.label {
		color: var(--text-color);
		font-size: 1.2rem;
	}
	.input {
		outline: none;
		border: none;
		overflow: hidden;
		margin: 0;
		width: 100%;
		margin: 0 auto;
		padding: 0.25rem 0;
		background-color: white;
		color: white;
		font-size: 1.2em;
		font-weight: bold;
		transition: border 500ms;
	}
	.input:valid {
		color: yellowgreen;
	}
	.input:invalid {
		color: orangered;
	}
	/*border animation*/
	.field::after {
		content: "";
		position: relative;
		display: block;
		height: 4px;
		width: 100%;
		background: yellowgreen;
		transform: scaleX(0);
		transform-origin: 0%;
		transition: transform 500ms ease;
		top: 2px;
	}
	.field:focus-within {
		border-color: transparent;
	}
	.field:focus-within::after {
		transform: scaleX(1);
		opacity: 1;
	}
	/*label animation*/
	.label {
		z-index: -1;
		position: absolute;
		transform: translateY(-2rem);
		transform-origin: 0%;
		transition: transform 400ms;
	}
	.field:focus-within .label,
	.input:not(:placeholder-shown) + .label {
		transform: scale(0.8) translateY(-5rem);
		opacity: 1;
	}
	/*strength meter*/
	.strength {
		display: flex;
		height: 20px;
		width: 80%;
		margin: 0 auto;
	}
	.bar {
		margin-right: 5px;
		height: 100%;
		width: 25%;
		transition: box-shadow 500ms;
		box-shadow: inset 0px 20px #1f1f1f;
	}
	.bar-show {
		box-shadow: none;
	}
	.bar-1 {
		background: linear-gradient(to right, red, orangered);
	}
	.bar-2 {
		background: linear-gradient(to right, orangered, yellow);
	}
	.bar-3 {
		background: linear-gradient(to right, yellow, yellowgreen);
	}
	.bar-4 {
		background: linear-gradient(to right, yellowgreen, green);
	}
	.bar:last-child {
		margin-right: 0;
	}
	ul {
		list-style: none;
		margin: 10px 26%;
		padding: 0;
		font-size: 0.7rem;
		text-align: center;
		background-color: var(--barbi-pink);
		color: var(--gold);
		opacity: 0.8;
	}
	/* Buttons
	button {
		margin-top: 2rem;
		padding: 5px 20px 10px 20px;
		font-weight: bold;
		border: 2px solid rgb(250, 0, 187);
		color: rgb(153, 255, 0);
		background: transparent;
		transition: all 1000ms;
    margin-left: 1rem;
    margin-right: auto;
	}*/
	button:disabled {
		border-color: rgb(153, 255, 0);
	}
	.toggle-password {
		position: absolute;
		cursor: help;
		font-size: 0.8rem;
		right: 0.25rem;
		bottom: 0.5rem;
	}
</style>

