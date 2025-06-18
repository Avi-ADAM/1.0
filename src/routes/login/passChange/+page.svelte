<script>
	import { preventDefault } from 'svelte/legacy';

	import axios from 'axios';
    import { goto} from '$app/navigation';
 	import { page } from '$app/state'
    const email = page.url.searchParams.get('code')
	import { lang } from '$lib/stores/lang.js'
	const baseUrl = import.meta.env.VITE_URL

let passwordx;
let errorl = $state(null);
let before = $state(true);
  

function shaneh () {
  console.log("1")
          passwordx = passwordx.trim();
  console.log("2")

  // Request API.
axios
  .post(baseUrl+'/api/auth/reset-password', {
    code: email,
    password: passwordx,
    passwordConfirmation: passwordx,
  })
  .then(response => {
    // Handle success.
                    goto("/login", )
    before = false;
  })
  .catch(error => {
    // Handle error.
    console.log('An error occurred:', error.response);
  errorl = error.response.data ;
  })};
 
	let strength = $state(0);
	let validations = $state([]);
	let showPassword = $state(false);
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
		
	}
	function getV (e){
    passwordx = e.target.value
	}
	const crnp = {"he":"יצירת סיסמה חדשה","en":"create new password"}
	    const val1 = {"he":"על הססמה להכיל לפחות 8 אותיות","en": "be at least 8 characters"}
  const val2 = {"he":"ולפחות אות אחת גדולה באנגלית","en": "must contain a capital letter"}
  const val3 = {"he":"ולפחות מספר אחד","en": "must contain a number"}
  const arr2 = {"he":"הסיסמה שונתה בהצלחה","en": "the password has been changed"}
 
</script>
{#if before}
<div>
        <div>
            {#if errorl}
                        <h1 
                        style="color:var(--barbi-pink); font-size:13px; font-weight:bold background-color: white; opacity: 0.7;"
                        >{errorl} </h1>
       {/if} 
    </div>




<main>
	<form onsubmit={preventDefault(shaneh)}>
		 

		<div class="field">
			<input
				autocomplete="new-password"
   				type={showPassword ? "text" : "password"}
				name="password"
				class="input"
				placeholder={crnp[$lang]}
				oninput={validatePassword}
				onblur={getV}
			/>
			<span
				class="toggle-password"
				onmouseenter={() => (showPassword = true)}
				onmouseleave={() => (showPassword = false)}
			>
				{showPassword ? "🔒" : "👁"}
			</span>
		</div>
				

		<div class="strength">
			<span class="bar bar-1" class:bar-show={strength > 0}></span>
			<span class="bar bar-2" class:bar-show={strength > 1}></span>
			<span class="bar bar-3" class:bar-show={strength > 2}></span>
			<span class="bar bar-4" class:bar-show={strength > 3}></span>
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

		<button onclick={shaneh} disabled={strength < 4}>{crnp[$lang]}</button>
	</form>
</main>


    </div>
    {:else }
<h1 class="text-center text-barbi">{arr2[$lang]}</h1>

    {/if}
<style>

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
		width: 50%;
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
	}
	button:disabled {
		border-color: var(--gold);
		color: var(--gold);
	}
	.toggle-password {
		position: absolute;
		cursor: help;
		font-size: 0.8rem;
		right: 0.25rem;
		bottom: 0.5rem;
	}
</style>