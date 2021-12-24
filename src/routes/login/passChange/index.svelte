<script>
import axios from 'axios';
    import { goto, invalidate, prefetch, prefetchRoutes } from '$app/navigation';
 import { page } from '$app/stores'
    const email = $page.query.get('code')
let passwordx;
let errorl = null;
let before = true;
  

function shaneh () {
  console.log("1")
          passwordx = passwordx.trim();
  console.log("2")

  // Request API.
axios
  .post('https://strapi-k4vr.onrender.com/auth/reset-password', {
    code: email,
    password: passwordx,
    passwordConfirmation: passwordx,
  })
  .then(response => {
    // Handle success.
        console.log('Your user\'s password has been changed.', response);
                    goto("/login", )
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
			password.search(/[$&+,:;=?@#]/) > -1,
		];
		strength = validations.reduce((acc, cur) => acc + cur, 0);
		
	}
	function getV (e){
    passwordx = e.target.value
	}
</script>
{#if before}
<div>
    <form>
        <div>
            {#if errorl}
                        <h1 
                        style="color:var(--barbi-pink); font-size:13px; font-weight:bold background-color: white; opacity: 0.7;"
                        >{errorl} </h1>
       {/if} 
    </div>




<main>
	<form on:submit|preventDefault={shaneh}>
		 

		<div class="field">
			<input
				autocomplete="new-password"
   				type={showPassword ? "text" : "password"}
				name="email"
				class="input"
				placeholder=" יצירת סיסמה חדשה"
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

		<button on:click={shaneh} disabled={strength < 4}>שינוי סיסמה</button>
	</form>
</main>


    </div>
    {:else }
<h1>הסיסמה שונתה בהצלחה</h1>

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