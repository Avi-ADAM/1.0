<script>
  import { goto } from '$app/navigation';
    import { lang} from '$lib/stores/lang.js'
  /** @type {{second?: string, secondTitle?: any}} */
  let { second = "/lev", secondTitle = {"he":"ללב 1💗1", "en":"to heart of 1💗1"} } = $props();
    const title = {"he": "לעמוד הפרופיל האישי","en":"to the profile page"}
    let clicked = false
    let acli = $state(false)
    let bcli = $state(false)
    function cl(w){
       if (clicked != true){
        clicked  = true
        if (w == "a"){
            goto("/me")
            acli = true
        }else{
            goto(second)
            bcli = true

        }
    }
}
</script>
<span style="overflow:hidden;">
<img onkeypress={()=>cl("a")} title={title[$lang ?? "he"]}  onclick={()=>cl("a")}
 class:rounda={acli == true}
  class:translate-x-12={acli == false}
  class:-translate-y-12={acli == false}
  class:hover:translate-x-9={acli == false} class:hover:-translate-y-9={acli == false}   class:hover:scale-150={acli == false}
  class="right"  alt="פרופיל אישי" src="https://res.cloudinary.com/love1/image/upload/v1644446152/PicsArt_01-28-06.01.26_1_a7ky2k.png"/>
<img onkeypress={()=>cl("b")} onclick={()=>cl("b")}
    class:roundb={bcli == true} title="{secondTitle[$lang ?? "he"]}"
    class:-translate-x-12={bcli == false} class:-translate-y-12={bcli == false}
     class:hover:-translate-x-9={bcli == false}
    class:hover:-translate-y-9={bcli == false} class:hover:scale-150={bcli == false}
    class="left "
    alt="לוגו" src="https://res.cloudinary.com/love1/image/upload/v1640020897/cropped-PicsArt_01-28-07.49.25-1_wvt4qz.png"/>
</span>
<style>

    .rounda {
   cursor:wait;
     -webkit-animation:spin 3s linear infinite;
    -moz-animation:spin 3s linear infinite;
    animation:spin 3s linear infinite;
    padding: 0px;
  }
  .roundb {
   cursor:wait;
     -webkit-animation:spinb 7s linear infinite;
    -moz-animation:spinb 7s linear infinite;
    animation:spinb 7s linear infinite;
    padding: 0px;

}
  @-moz-keyframes spin {
    0%{
        -moz-transform: translateY(-2.25rem) scaleX(1.5) scaleY(1.5) translateX(2.25rem) rotate(0);
}
    100% {
        -moz-transform: rotate(360deg) translateY(-2.25rem) scaleX(1.5) scaleY(1.5) translateX(2.25rem); } }
@-webkit-keyframes spin {
      0%{
         -webkit-transform: translateY(-2.25rem) scaleX(1.5) scaleY(1.5) translateX(2.25rem) rotate(0);
}
    100% {
        -webkit-transform: rotate(360deg) translateY(-2.25rem) scaleX(1.5) scaleY(1.5) translateX(2.25rem); } }
@keyframes spin {
    from{
        transform: translateY(-2.25rem) translateX(2.25rem) scaleX(1.5) scaleY(1.5)  rotate(0deg);
}
    to {
        transform: translateY(-2.25rem)  translateX(2.25rem) scaleX(1.5) scaleY(1.5) rotate(360deg);
    }
}
  @-moz-keyframes spinb {
    0%{ -moz-transform: translateY(-2.25rem) scaleX(1.5) scaleY(1.5) translateX(-2.25rem) rotate(0);}
    100% { -moz-transform: rotate(360deg) translateY(-2.25rem) scaleX(1.5) scaleY(1.5) translateX(-2.25rem); } }
@-webkit-keyframes spinb {
        0%{ -webkit-transform: translateY(-2.25rem) scaleX(1.5) scaleY(1.5) translateX(-2.25rem) rotate(0);}
    100% { -webkit-transform: rotate(360deg) translateY(-2.25rem) scaleX(1.5) scaleY(1.5) translateX(-2.25rem); } }
@keyframes spinb {
        0%{
            transform:translateY(-2.25rem) translateX(-2.25rem) scaleX(1.5) scaleY(1.5)  rotate(0);}
 100% {
    transform: translateY(-2.25rem)  translateX(-2.25rem) scaleX(1.5) scaleY(1.5) rotate(360deg);
}
}
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
