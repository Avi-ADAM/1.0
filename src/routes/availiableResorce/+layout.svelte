<script>
    import {lang } from '$lib/stores/lang.js'
</script>
<div
                dir="{$lang == "en" ? "ltr": "rtl"}"
                class="d h-screen w-screen"
                style="overflow-y: auto; background: linear-gradient(to right, #25c481, #25b7c4);background: -webkit-linear-gradient(left, #25c481, #25b7c4); "
              >
<slot />
</div>