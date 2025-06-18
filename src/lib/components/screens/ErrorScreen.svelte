<script>
   import Header from "../header/header.svelte"
   const er = {
    "he": "אם הבעיה נמשכת baruch@1lev1.com שגיאה יש לנסות שנית, ניתן ליצור קשר במייל  ",
    "en": "error: please try again, if the problem continue contact at baruch@1lev1.com"
}
import { lang } from "$lib/stores/lang";
   let { message, status } = $props();
</script>
<Header/>
<div class="grid items-center text-center justify-center aling-center bg-goldGrad" style="min-height: 100vh;">
<h1 class="text-barbi text-xl">{status}</h1>
<h2 class="text-barbi text-sm">{message}</h2>
<h3>{er[$lang]}</h3>
<img style="width:100vw:" alt="error" src="https://res.cloudinary.com/love1/image/upload/v1720630795/error1_t2fvd8-Photoroom_uphvtj.png">
</div>