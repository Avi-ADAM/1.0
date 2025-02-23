<script module>

   export function preventSwiperScroll(event) {
   if(event == true)
      event.stopPropagation(); // מונע מ-Swiper לתפוס את הגלילה
  }
</script>