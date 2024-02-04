<script context="module">
   export function isToday(date) {
  const today = new Date();

  // 👇️ Today's date
	if(date != null){ 
		let dater = new Date(date)
  if (
    today.getFullYear() === dater.getFullYear() &&
    today.getMonth() === dater.getMonth() &&
    today.getDate() === dater.getDate()
  ) {
    return true;
  }
	}
  return false;
}
</script>