<script>
  import { Swiper, SwiperSlide } from "swiper/svelte";

  // Import Swiper styles
  import "swiper/css";

  import "swiper/css/effect-cards";
  import "./style.css";

  // import required modules
  import { EffectCards, Navigation } from "swiper";
 
</script>
<div >
<Swiper dir="rtl"
  effect={"cards"}
    loop={true}
  loopFillGroupWithBlank={true}
  grabCursor={true}
  modules={[EffectCards, Navigation]}
  class="mySwiper"
  navigation={{
    nextEl: ".norm",
    prevEl: `.nor`,
  }}
>
  <SwiperSlide
    ><div
	 id="normSml" 
>
<img src="https://res.cloudinary.com/love1/image/upload/v1647203723/%D7%9C%D7%91_1_%EF%B8%8F1_-_Google_Chrome_21_02_2022_12_07_43_yioobi.png" style="height:100%; width: 100%" alt="gr"/>
</div> </SwiperSlide
  ><SwiperSlide
    ><div  id="normSmll"
><img src="https://res.cloudinary.com/love1/image/upload/v1647203724/%D7%9C%D7%91_1_%EF%B8%8F1_-_Google_Chrome_01_03_2022_14_37_30_aytir0.png" style="height:100%; width: 100%" alt="gr"/>

</div>
 </SwiperSlide
  >
</Swiper>
 <button  class="norm" >
    <img alt="go" class="img-4"  src="https://res.cloudinary.com/love1/image/upload/v1641155352/kad_njjz2a.svg"/>
    </button>
  <button class="nor" >
    <img alt="goback" class="img-4"  src="https://res.cloudinary.com/love1/image/upload/v1641155352/bac_aqagcn.svg"/>
    </button>
</div>
<style>
    .norm{
        position: absolute;
        top: 50%;
        left: -95px;
    }
     .nor{
        position: absolute;
        top: 50%;
        right: -95px;
    }
    .img-4{
        width:40px;
    }
</style>

