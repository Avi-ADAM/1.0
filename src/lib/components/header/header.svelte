<script>
    export let second = "/lev"
    export let secondTitle = "ללב המערכת"
</script>
<a   data-sveltekit-prefetch href="/me" class="ac"><img title="לעמוד הפרופיל האישי" class="right translate-x-12 -translate-y-12 hover:translate-x-9 hover:-translate-y-9   hover:scale-150 "  alt="פרופיל אישי" src="https://res.cloudinary.com/love1/image/upload/v1644446152/PicsArt_01-28-06.01.26_1_a7ky2k.png"/></a>
<a data-sveltekit-prefetch href="{second}" class="bc"><img title="{secondTitle}" class="left -translate-x-12 -translate-y-12 hover:-translate-x-9 hover:-translate-y-9 hover:scale-150 " alt="לוגו" src="https://res.cloudinary.com/love1/image/upload/v1640020897/cropped-PicsArt_01-28-07.49.25-1_wvt4qz.png"/></a>

<style>
    .ac:active > img{
   cursor:wait;
     -webkit-animation:spin 3s linear infinite;
    -moz-animation:spin 3s linear infinite;
    animation:spin 3s linear infinite;
  }
  .bc:active > img{
   cursor:wait;
     -webkit-animation:spinb 7s linear infinite;
    -moz-animation:spinb 7s linear infinite;
    animation:spinb 7s linear infinite;
  }
  @-moz-keyframes spin {
    0%{        -moz-transform: translateY(-2.25rem) scaleX(1.5) scaleY(1.5) translateX(2.25rem) rotate(0);
}
    100% { -moz-transform: rotate(360deg) translateY(-2.25rem) scaleX(1.5) scaleY(1.5) translateX(2.25rem); } }
@-webkit-keyframes spin { 
      0%{        -webkit-transform: translateY(-2.25rem) scaleX(1.5) scaleY(1.5) translateX(2.25rem) rotate(0);
}
    100% { -webkit-transform: rotate(360deg) translateY(-2.25rem) scaleX(1.5) scaleY(1.5) translateX(2.25rem); } }
@keyframes spin {
      0%{transform: translateY(-2.25rem) scaleX(1.5) scaleY(1.5) translateX(2.25rem) rotate(0);
}
    100% { -webkit-transform: rotate(360deg); transform:rotate(360deg) translateY(-2.25rem) scaleX(1.5) scaleY(1.5) translateX(2.25rem); } }
  @-moz-keyframes spinb {
    0%{ -moz-transform: translateY(-2.25rem) scaleX(1.5) scaleY(1.5) translateX(-2.25rem) rotate(0);}
    100% { -moz-transform: rotate(360deg) translateY(-2.25rem) scaleX(1.5) scaleY(1.5) translateX(-2.25rem); } }
@-webkit-keyframes spinb {
        0%{ -webkit-transform: translateY(-2.25rem) scaleX(1.5) scaleY(1.5) translateX(-2.25rem) rotate(0);}
    100% { -webkit-transform: rotate(360deg) translateY(-2.25rem) scaleX(1.5) scaleY(1.5) translateX(-2.25rem); } }
@keyframes spinb {
        0%{ transform: translateY(-2.25rem) scaleX(1.5) scaleY(1.5) translateX(-2.25rem) rotate(0);}
 100% { -webkit-transform: rotate(360deg); transform:rotate(360deg) translateY(-2.25rem) scaleX(1.5) scaleY(1.5) translateX(-2.25rem); } }
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