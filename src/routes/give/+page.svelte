<script>
  function submitForm() {
    fetch("/api/sma");
  }
  async function onSubmiti (){
   
}
</script>

<button on:click={onSubmiti}>tttt</button>
<form on:submit|preventDefault={submitForm}>
  <button type="submit">Submit</button>
</form>