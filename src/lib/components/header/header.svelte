<script>
    export let second = "/lev"
    export let secondTitle = "ללב המערכת"
</script>
<a  sveltekit:prefetch href="/me" ><img title="לעמוד הפרופיל האישי" class="right translate-x-12 -translate-y-12 hover:translate-x-9 hover:-translate-y-9   hover:scale-150" alt="פרופיל אישי" src="https://res.cloudinary.com/love1/image/upload/v1644446152/PicsArt_01-28-06.01.26_1_a7ky2k.png"/></a>
<a  href="{second}" ><img title="{secondTitle}" class="left -translate-x-12 -translate-y-12 hover:-translate-x-9 hover:-translate-y-9 hover:scale-150" alt="לוגו" src="https://res.cloudinary.com/love1/image/upload/v1640020897/cropped-PicsArt_01-28-07.49.25-1_wvt4qz.png"/></a>

<style>
    .right {
        position: absolute;
        top: 50px;
        right: 50px;
        height: 50px;
        width: 50px;
        z-index: 14;
                aspect-ratio: 1/1;

    }
    .left{
         position: absolute;
        top: 50px;
        left: 50px;
         height: 50px;
                 width: 50px;
                         z-index: 14;

        aspect-ratio: 1/1;
    }
</style>