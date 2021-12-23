<script>
 import axios from 'axios';

    let heading = "יש למלא כתובת מייל אליה ישלח לינק לאיפוס הסיסמה";
    let email;
    function onSubmit () {
       
// Request API.
axios
  .post('https://strapi-k4vr.onrender.com/auth/forgot-password', {
    email: email,
    url:
      'https://strapi-k4vr.onrender.com/admin/plugins/users-permissions/auth/reset-password',
  })
  .then(response => {
    // Handle success.
    console.log('Your user received an email');
  })
  .catch(error => {
    // Handle error.
    console.log('An error occurred:', error.response);
  });
    }
</script>

<h3>{heading}</h3>

<form on:submit|preventDefault={onSubmit}>
  <div>
    <label>
      מייל
      <input placeholder="test@yo.com" type="email" bind:value={email} />
    </label>
  </div>
  <button>Send</button>
</form>