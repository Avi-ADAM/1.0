<script>

    import { fade } from "svelte/transition";
    import { goto} from '$app/navigation';
    import axios from "axios";
    import { JWT } from '../../lib/stores/jwt.js';
    import { idM } from '../../lib/stores/idM.js';    
    import { liUN } from '../../lib/stores/liUN.js';
    import { serialize } from 'cookie';
   
    let active = false;
    let loginError = null;
    let email = "";
    let password = "";
    let username = "";
    let fillFilds ;
    let emailenter = {
        "eng" : "Enter your email",
        "heb": "כתובת מייל"
    };
    let passenter = {
        "eng" : "Enter your password",
        "heb": "סיסמה"
    }
    function login() {
        active = true;
        email = email.trim();
        password = password.trim();

        if (!email || !password) {
            loginError = "יש למלא את כל השדות";
            return;
        }
        loginError = null;

        axios
            .post('https://onelovevone.onrender.com/auth/local', {
                identifier: email,
                password,
            })
            .then(({ data }) => {
                document.cookie = `jwt=${data.jwt}; expires=` + new Date(2023, 0, 1).toUTCString();
                document.cookie = `id=${data.user.id}; expires=` + new Date(2023, 0, 1).toUTCString();
                document.cookie = `when=${Date.now}; expires=` + new Date(2023, 0, 1).toUTCString();
                JWT.set(data.jwt);
                idM.set(data.user.id);
                liUN.set(data.user.username);
                goto("/me", )
               // goto("/oneHomeGr", )
              
            })
            .catch((err) => {
                if (err.response) {
                    loginError = "";
                    for (let message of err.response.data.message[0].messages) {
                        loginError += `${message.message}\n`;
                    }
                } else loginError = err;
            });
    };
function handleclick () {
    goto("/login/passwordReset", )
};    
let buttonForgot = "במקרה של סיסמה שאבדה מהזיכרון יש ללחוץ";

	import { emailValidator, requiredValidator } from '../../lib/celim/validators.js'
  import { createFieldValidator } from '../../lib/celim/validation.js'

  const [ validity, validate ] = createFieldValidator(requiredValidator(), emailValidator())
	
</script>

<div class="body">
 <div class="login">            
                <form on:submit|preventDefault={login} in:fade >
                    <div>
                    {#if loginError}
                        <h1 style="background-color: white; color:var(--barbi-pink); font-size:13px; font-weight:bold background-color: white; opacity: 0.7;">{loginError} </h1>
                        <button
                         on:click={handleclick} 
                         title={buttonForgot}  
                         in:fade  
                                style=" position: fixed;
                                top: 80%;
                                left: 50%;
                                transform: translate(-50%, -50%);
                                ">
                            <svg style="width:48px; height:48px" viewBox="0 0 24 24">
                            <path
                             fill="var(--barbi-pink)" 
                             d="M12,1A5,5 0 0,0 7,6V8H6A2,2 0 0,0 4,10V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V10A2,2 0 0,0 18,8H17V6A5,5 0 0,0 12,1M12,2.9C13.71,2.9 15.1,4.29 15.1,6V8H8.9V6C8.9,4.29 10.29,2.9 12,2.9M12.19,10.5C13.13,10.5 13.88,10.71 14.42,11.12C14.96,11.54 15.23,12.1 15.23,12.8C15.23,13.24 15.08,13.63 14.79,14C14.5,14.36 14.12,14.64 13.66,14.85C13.4,15 13.23,15.15 13.14,15.32C13.05,15.5 13,15.72 13,16H11C11,15.5 11.1,15.16 11.29,14.92C11.5,14.68 11.84,14.4 12.36,14.08C12.62,13.94 12.83,13.76 13,13.54C13.14,13.33 13.22,13.08 13.22,12.8C13.22,12.5 13.13,12.28 12.95,12.11C12.77,11.93 12.5,11.85 12.19,11.85C11.92,11.85 11.7,11.92 11.5,12.06C11.34,12.2 11.24,12.41 11.24,12.69H9.27C9.22,12 9.5,11.4 10.05,11.04C10.59,10.68 11.3,10.5 12.19,10.5M11,17H13V19H11V17Z" />
                        </svg></button>
                    {/if}
        </div>
         
<div dir="rtl"> 
                        <input
                            type="text"
                          bind:value={email}
                		class:field-danger={!$validity.valid}
	            		class:field-success={$validity.valid}
                        use:validate={email}
                            placeholder={emailenter.heb}
                            id="email"
                            autocomplete="username"
                             />
</div>                 
<div dir="rtl">                      
                        <input
                            type="password"
                            bind:value={password}
                            placeholder={passenter.heb}
                            id="password"
                            autocomplete="current-password"
                           />
</div>                  
                 <div>
                        <button class:active={active} disabled={!$validity.valid}
                        class="center hover:scale-150 bt "    
                     ></button>
                     </div>
                  
                </form>
            
        </div>
 <!-- כפתור זכור אותי בפעם הבאה כדי לשמור קוקיות 
ולוגאאוט שיהיה שמוחק קוקיות-->
</div>
<style>



    @media (max-width: 600px) {
        .login {
            width: 126%;
        }
           
input{
    
}
    .center{
        margin: 0 auto;
    }
    }
  .active{
   cursor:wait;
     -webkit-animation:spin 17s linear infinite;
    -moz-animation:spin 17s linear infinite;
    animation:spin 17s linear infinite;
  }
  @-moz-keyframes spin { 100% { -moz-transform: rotate(360deg); } }
@-webkit-keyframes spin { 100% { -webkit-transform: rotate(360deg); } }
@keyframes spin { 100% { -webkit-transform: rotate(360deg); transform:rotate(360deg); } }
 input:focus {
color: var(--barbi-pink);
border: 1px solid var(--barbi-pink);
}
.body {
min-height: 100vh;

    width: 100vw;
    height: 100vh;
      background: url(https://res.cloudinary.com/love1/image/upload/v1640287148/nicelove_o5pzyv.svg) !important;
      background-position: center; 
      background-size: cover;
      background-repeat: no-repeat; 
	margin: 0;
/*	background-color: var(--primary-color);
	background: linear-gradient(
		180deg,
		skyblue 28.45%,
		var(--tertiary-color) 40.35%
	);*/
}
   
input{
        
        background-image: url(https://res.cloudinary.com/love1/image/upload/v1639592274/line1_r0jmn5.png) !important;
        border: 1px solid var(--gold);
        background-position: center;
        background-repeat: no-repeat;
        margin: 10px auto;
        background-size:282px ;
        min-height: 45px;
        padding:0 20px ;
        border-radius: 50px;
        color: var(--barbi-pink);
    }
    .center{
        background-image: url(https://res.cloudinary.com/love1/image/upload/v1640287183/coin512_ux4m6e.png);
 background-repeat: no-repeat;
margin:  0.5em 4em;
 background-size: 100px;
 align-self: center;
 min-height: 100px;
 min-width: 100px;
 border-radius: 50%;
        cursor: url(https://res.cloudinary.com/love1/image/upload/v1639255090/Fingerprint-Heart-II_wqvlih.svg), auto;

    }
   
.login {
       cursor: url(https://res.cloudinary.com/love1/image/upload/v1639255090/Fingerprint-Heart-II_wqvlih.svg), auto;

position: fixed;
top: 50%;
left: 50%;
display: grid;
grid-template-columns: auto;
grid-template-rows: auto   ;
align-items: center;
justify-content: center;

transform: translate(-50%, -50%);
min-height: 100%;
min-width: 100%;
border-radius: 50%;
 background-image: url(https://res.cloudinary.com/love1/image/upload/v1640287109/diamond_uapr5j.png);
 background-position: center;
 background-repeat: no-repeat;
 
 background-size: contain;
margin: 0 auto;
 align-self: center;

}

</style>