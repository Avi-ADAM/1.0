<script>
import { userName } from '../../stores/store.js';
import { show } from './store-show.js';
import { email } from './email.js';  
import { contriesi } from './contries.js';
import axios from 'axios';
 import { createEventDispatcher } from 'svelte';
 import { skills1 } from './skills1.js';
import { roles2 } from './roles2.js';
import { workways1 } from './workways1.js';
import { valluss } from './valluss.js';
import {fpval} from './fpval.js';
import {newp}from './newp.js';
let skills1_value;
let roles2_val;
let work_ways1;
let vallues;
let contriesis = [];
let fpvall
valluss.subscribe(newwork => {
  vallues = newwork;
})
let newpp
newp.subscribe(newwork => {
  newpp = newwork;
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
/*
*/
email.subscribe(new1Value => {
  emailL = new1Value;
});
const baseUrl = import.meta.env.VITE_URL

let linkg = baseUrl+'/graphql'
let miDatan;
let errr = {k: false, m: "", p: false}
async function increment() {    
errr.p = true;
 const cookieValue = document.cookie
  .split('; ')
  .find(row => row.startsWith('jwt='))
  .split('=')[1];
  const cookieValueId = document.cookie
  .split('; ')
  .find(row => row.startsWith('id='))
  .split('=')[1];
 let uid = cookieValueId;
   let token  = cookieValue; 
    let bearer1 = 'bearer' + ' ' + token;
    let link =baseUrl+"/graphql" ;
     axios
  .post(baseUrl+'/password', {
     identifier: emailL,
    password: newpp,
    newPassword: passwordx,
    confirmPassword: passwordx
  })
  .then(response => {})
	try {
             await fetch(link, {
              method: 'POST',
       
        headers: {
            'Authorization': bearer1,
            'Content-Type': 'application/json'
                  },
        body: 
        JSON.stringify({query: 
           `mutation { updateUser(
    input: {
      where: { id: "${uid}" }
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
           			show.update(n => n + 1);

   dispatch ('progres',{
		tx: 0,
		txx: 0
	} );
    document.cookie = `jwt=${miDatan.data.jwt}; expires=` + new Date(2026, 0, 1).toUTCString();
    document.cookie = `id=${miDatan.data.user.id}; expires=` + new Date(2026, 0, 1).toUTCString();
} catch (e) {
            error1 = e
            console.log(error1);
				errr.m = error1.response.data.message
				errr.k = true
        }

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
			password.length > 5,
			password.search(/[A-Z]/) > -1,
			password.search(/[0-9]/) > -1,
			password.search(/[$&+,:;=?@#]/) > -1,
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

</script>

<main >
	<form on:submit|preventDefault>
		 <h1 title="מהי הסיסמה שלך" class="midscreenText-2">
        {userName_value}
      <br>
    מה היא מילת הקסם שלך
       </h1>
    <div style="display: none;"><input type="text" style="display: none;" autocomplete="username" name="userName" bind:value={userName_value}></div>
		<div class="field">
			<input
				autocomplete="new-password"
   				type={showPassword ? "text" : "password"}
				name="email"
				class="input"
				placeholder="יצירת סיסמה"
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
				{validations[0] ? "🏆" : "❌"} על הססמה להכיל לפחות חמש אותיות <!-- be at least 5 characters-->
			</li>
			<li>
				{validations[1] ? "🏆" : "❌"} ולפחות אות אחת גדולה באנגלית<!-- must contain a capital letter -->
			</li>
			<li>{validations[2] ? "🏆" : "❌"} ולפחות מספר אחד<!--must contain a number --></li>
			<li>
				{validations[3] ? "🏆" : "❌"} ולפחות סמל אחד ($&+,:;=?@#) <!--must contain one symbol ($&+,:;=?@#)-->
			</li>
		</ul>
	{#if errr.p === false}
<div class="but">
		  <button  class="button-in-1-2" class:non={strength < 4} on:click="{increment}"  disabled={strength < 4}>
    <img alt="go" class="img-4"  src="https://res.cloudinary.com/love1/image/upload/v1641155352/kad_njjz2a.svg"/>
    </button>
  <button class="button-2" on:click="{back}">
    <img alt="go" class="img-4"  src="https://res.cloudinary.com/love1/image/upload/v1641155352/bac_aqagcn.svg"/>
    </button>
</div>
{:else if errr.k === true}
<h2 class=" bg-white text-red">{errr.m}
קרתה בעיה,<br>
 יש לבדוק את המייל,<br>
 אם לא התקבל מייל הרשמה נא לפנות ל-baruch@1lev1.com
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
		background-color: var(--barbi-pink);
		color: var(--gold);
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
padding-top: 8px;
padding-right: 25px;
padding-left: 25px;
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
  font-size: 1rem;
    margin-top: 26vh;
	 }
.img-4{
	height: 10vh;
}
}
   
</style>
