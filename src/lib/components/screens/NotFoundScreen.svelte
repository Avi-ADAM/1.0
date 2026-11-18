<script>
    import Header from "../header/header.svelte"
    import { t } from "$lib/translations"
</script>
<Header/>
<div class="grid items-center text-center justify-center aling-center bg-black" style="min-height: 100vh;">
<h1 class="text-barbi text-xl">404</h1>
<h2 class="text-barbi text-sm">{$t("common.pageNotFound")}</h2>
<img style="width:100vw:" alt="error" src="https://res.cloudinary.com/love1/image/upload/v1645703329/error1_t2fvd8.jpg">
</div>