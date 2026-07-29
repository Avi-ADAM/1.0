<script>
  import { t } from '$lib/translations';
   import Header from "../header/header.svelte"
;
   let { message, status } = $props();
</script>
<Header/>
<div class="grid items-center text-center justify-center aling-center bg-goldGrad" style="min-height: 100vh;">
<h1 class="text-barbi text-xl">{status}</h1>
<h2 class="text-barbi text-sm">{message}</h2>
<h3>{$t('common.misc.genericError')}</h3>
<img style="width:100vw:" alt="error" src="https://res.cloudinary.com/love1/image/upload/v1720630795/error1_t2fvd8-Photoroom_uphvtj.png">
</div>