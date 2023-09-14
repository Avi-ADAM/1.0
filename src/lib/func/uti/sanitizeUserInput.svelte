<script context="module">
   export function sanitizeUserInput(input) {
  // Replace potentially harmful characters with their HTML entity equivalents
  if(input != undefined && input !=  null){
  const sanitizedInput = input
    .replace(/&/g, "\\&")
    .replace(/</g, "\\<")
    .replace(/>/g, "\\>")
    .replace(/"/g, '\\"')
    .replace(/'/g, "\\'")
    .replace(/\//g, "\\");

  return sanitizedInput;
  }
  return input
}
</script>