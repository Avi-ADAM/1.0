<script>
import { userName } from '../../stores/store.js';
import { show } from './store-show.js';
import { email } from './email.js';  
import { contriesi } from './contries.js';
          import { lang } from '$lib/stores/lang.js'
 import { RingLoader
} from 'svelte-loading-spinners';
 import { createEventDispatcher } from 'svelte';
 import { skills1 } from './skills1.js';
import { roles2 } from './roles2.js';
import { workways1 } from './workways1.js';
import { valluss } from './valluss.js';
import {fpval} from './fpval.js';
import axios from 'axios';
let skills1_value;
let roles2_val;
let work_ways1;
let vallues;
let contriesis = [];
let fpvall
valluss.subscribe(newwork => {
  vallues = newwork;
})
contriesi.subscribe(newwork => {
  contriesis = newwork;
})
workways1.subscribe(newwork => {
  work_ways1 = newwork;
})
fpval.subscribe(newwork => {
	fpvall = newwork;
})
skills1.subscribe(newskills => {
  skills1_value = newskills;
})

roles2.subscribe(newRole => {
  roles2_val = newRole;
})
 const dispatch = createEventDispatcher();
let userName_value;

let emailL;
let passwordx;

let error1;
userName.subscribe(value => {
  userName_value = value;
});
/*skills: [${skills1_value}],
	 tafkidims: [${roles2_val}],
    work_ways: [${work_ways1}],
    vallues: [${vallues}],
	cuntries: [${contriesis}],
	free_person: "${fpvall}"
*/
email.subscribe(new1Value => {
  emailL = new1Value;
});
let linkg = 'https://i18.onrender.com/graphql'
let miDatan;
let already = false;
let errr = {k: false, m: "", p: false}
async function increment() {    
errr.p = true;
already = true;
	axios
  .post('https://i18.onrender.com/auth/local/register', {
    username: userName_value, 
    email: emailL,
    password: passwordx,
	 skills: skills1_value,
    tafkidims: roles2_val,
    work_ways: work_ways1,
    vallues: vallues,
	cuntries: contriesis,
	free_person: fpvall
  }, {
  headers: {
	         'Content-Type': 'application/json'
            }})
  .then(response => {
			show.update(n => n + 1);
	const data = response.data;
          /*  await fetch(linkg, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        query: `mutation {
  register(input: { 
	  username: "${userName_value}",
   email: "${emailL}",
    password: "${passwordx}",
	 skills: [${skills1_value}],
	 tafkidims: [${roles2_val}],
    work_ways: [${work_ways1}],
    vallues: [${vallues}],
	cuntries: [${contriesis}],
	free_person: "${fpvall}"
 }) {
	 jwt
    user {
      username
      email
	  id
    }
  }
}
`})
                })
                .then(r => r.json())
                .then(data => miDatan = data);
            console.log(miDatan);*/

 dispatch ('progres',{
		tx: 0,
		txx: 0
	} );
/*	const id = miDatan.data.register.user.id;
	let token  = miDatan.data.register.jwt;
	document.cookie = `await=${Date.now}; expires=` + new Date(2023, 0, 1).toUTCString();
    document.cookie = `when=${Date.now}; expires=` + new Date(2023, 0, 1).toUTCString();
    document.cookie = `jwt=${miDatan.data.register.jwt}; expires=` + new Date(2023, 0, 1).toUTCString();
    document.cookie = `id=${miDatan.data.register.user.id}; expires=` + new Date(2023, 0, 1).toUTCString();
	document.cookie = `guidMe=again; expires=` + new Date(2023, 0, 1).toUTCString();			
	let bearer1 = 'bearer' + ' ' + token;      
	await fetch(linkg, {
              method: 'POST',
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query: 
           `mutation { updateUser(
    input: {
      where: { id: "${id}" }
      data: { 
    skills: [${skills1_value}],
	 tafkidims: [${roles2_val}],
    work_ways: [${work_ways1}],
    vallues: [${vallues}],
	cuntries: [${contriesis}],
	free_person: "${fpvall}"
	   }
    }
  ){
      user {
          skills{
              id 
          }
      }
  }
}`  
        })
})
  .then(r => r.json())
  .then(data => miDatan = data);
            console.log(miDatan);
    */       	
})	
.catch(error => {
            error1 = error
            console.log(error1);
				errr.m = error1.error.message
				errr.k = true
        });
	}



  
function back() {
		show.update(n => n - 1);
    dispatch ('progres',{
		tx: 0,
		txx: 11
	} )
    
	}
	let strength = 0;
	let validations = [];
	let showPassword = false;
	function validatePassword(e) {
		        passwordx = e.target.value
		const password = e.target.value;
		validations = [
			password.length > 1,
			password.length > 8,
			password.search(/[A-Z]/) > -1,
			password.search(/[0-9]/) > -1,
		//	password.search(/[$&+,:;=?@#]/) > -1,
		];
		strength = validations.reduce((acc, cur) => acc + cur, 0);
		if (validations[0] == true){dispatch ('progres',{
		tx: 0,
		txx: 6
	} ) } 
	if (validations[1] == true ){dispatch ('progres',{
		tx: 0,
		txx: 5
	} ) }
	if (validations[2] == true ){dispatch ('progres',{
		tx: 0,
		txx: 4
	} ) }
	if (validations[3] == true ){dispatch ('progres',{
		tx: 0,
		txx: 2
	} ) }
	}
	function getV (e){
    passwordx = e.target.value
	}
	    const srca = {"he": "https://res.cloudinary.com/love1/image/upload/v1641155352/bac_aqagcn.svg","en": "https://res.cloudinary.com/love1/image/upload/v1657761493/Untitled_sarlsc.svg"}
    const srcb = {"he":"https://res.cloudinary.com/love1/image/upload/v1641155352/kad_njjz2a.svg", "en": "https://res.cloudinary.com/love1/image/upload/v1657760996/%D7%A0%D7%A7%D7%A1%D7%98_uxzkv3.svg"}
  const addn = {"he":"יצירת סיסמה","en": "Create new password"}
  const what = {"he": "מה היא מילת הקסם שלך?","en": "what is Your magic word?"}
    const val1 = {"he":"על הססמה להכיל לפחות 8 תווים","en": "be at least 8 characters"}
  const val2 = {"he":"ולפחות אות אחת גדולה באנגלית","en": "must contain a capital letter"}
  const val3 = {"he":"ולפחות מספר אחד","en": "must contain a number"}
  const arr1 = {"he":"אם לא התקבל מייל הרשמה נא לפנות ל-","en": "if you didn't recive email, reach us at-"}
  const arr2 = {"he":"יש לבדוק את המייל,","en": "please check your email,"}
  const arr3 = {"he":"משהו השתבש,","en": "something is wrong,"}
const om = {"he":"רק רגע בבקשה", "en": "one moment please"}
</script>

<main >
	<form on:submit|preventDefault>
		 <h1 title="{addn[$lang]}" class="midscreenText-2">
        {userName_value}
      <br>
	  {what[$lang]}
       </h1>
    <div style="display: none;"><input type="text" style="display: none;" autocomplete="username" name="userName" bind:value={userName_value}></div>
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
				{validations[1] ? "🏆" : "❌"} {val1[$lang]}
			</li>
			<li>
				{validations[2] ? "🏆" : "❌"} {val2[$lang]}
			</li>
			<li>{validations[3] ? "🏆" : "❌"} {val3[$lang]}</li>
			<!--<li>
				{validations[3] ? "🏆" : "❌"}  ולפחות סמל אחד מאלו($&+,:;=?@#) must contain one symbol ($&+,:;=?@#)
			</li>-->
		</ul>
	{#if already === false}
<div dir="{$lang == "en" ? "ltr" : "rtl"}" class="but">
		  <button class="button-2"   on:click="{back}"  >
    <img alt="go"  class="img-4"  src="{srca[$lang]}"/>
    </button>
  <button disabled={strength < 4} class="button-in-1-2" class:non={strength < 4 }  on:click="{increment}">
    <img alt="go" class="img-4"  src="{srcb[$lang]}"/>
    </button>
</div>
{:else if already == true }
          <div style="margin: 0 auto;" class="flex flex-col text-center items-center justify-center">
            <h3 class="text-barbi">{om[$lang]}</h3>
          <br>
         <RingLoader size="140" color="#ff00ae" unit="px" duration="2s"></RingLoader>
         </div> 
{:else if errr.k === true}
<h2 class=" bg-white text-red">{errr.m}
{arr3[$lang]}<br>
 {arr2[$lang]}<br>
 {arr1[$lang]}ehad1one@gmail.com
</h2>
{/if}
	</form>
</main>

<style>
.non:hover{
border: 1px solid red;
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
		background-color: var(--mturk);
		color: var(--barbi-pink);
		opacity: 0.8;
	}
	/* Buttons */
	
	
	.toggle-password {
		position: absolute;
		cursor: help;
		font-size: 0.8rem;
		right: 0.25rem;
		bottom: 0.5rem;
	}

.midscreenText-2 {
     margin: 18vh auto 0 auto;
      align-self: center;
      justify-self: center;
	  max-width: 100vw;
      font-size: 1.8rem;
      line-height: normal;
text-shadow: 1px 1px purple;
      color: var(--barbi-pink);
      background-image: url(https://res.cloudinary.com/love1/image/upload/v1639592274/line1_r0jmn5.png);
      background-size: 29.5rem 9.75rem;
      height: 9.75rem;
      width: 29.5rem;
text-align: center; 
  padding: 1rem ; 

}
 
.button-in{
    grid-column: 1/6;
    grid-row: 6 / 7;
    margin-top: 25px;
    background-color: var(--barbi-pink);
    padding: 15px;
    border-radius: 50%;
    color: var(--gold);
	align-self: center;
	justify-self: center;
	    text-align: center;
margin: 2rem auto 0 auto;
    }
	.but{
		display:flex;
		flex-direction: row;
justify-content: space-between;	
}
	.button-in-1-2{
   
    align-self: center;
    justify-self: center;
  }
    .button-2{
      
       align-self: center;
    justify-self: center;
  }
   
    .input{
   
    background: var(--gold);
    text-align: center;
    }
    .input-2{
    grid-column: 2/3;
    grid-row: 3/4;
    align-self: center;
 	justify-self: center;
    background: var(--gold);
    text-align: center;
}
.img-4{
	height: 15vh;
}
@media (max-width:500px){
	 .midscreenText-2 {
		   background-size: 16.5rem 5rem;
  height: 5rem;
  width: 16.5rem;
  font-size: 0.8rem;
    margin-top: 26vh;
	 }
.img-4{
	height: 10vh;
}
}
   
</style>
