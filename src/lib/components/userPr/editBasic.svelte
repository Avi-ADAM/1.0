<script>
let freeday;
let username;
let password;
let email;
let bio;

</script>

<h1> עריכת הפרטים שלי</h1>
<input type="text" bind:value={username}>
<input type="email" bind:value={email}>
<input type="text-area" bind:value={bio} >
<input type="password" bind:value={password}>
<select>
<option  value=""  >היום החופשי שלי</option>
<option  value="1">ראשון</option>
<option value="2">שני</option>
<option value="3">שלישי</option>
<option value="4">רביעי</option>
<option value="5">חמישי</option>
<option value="6">שישי</option>
<option value="7">שבת</option>




</select>
