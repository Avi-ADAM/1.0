<script context="module">
import * as Push from 'push.js'; // if using ES6 
export async function nutifi(head,text,link) {
  console.log(head,text,link)//if lev visible not but if other page fire anyay
  if(!document.visibilityState == "visible"){
  Push.create(head, {
    body: text,
    icon: 'https://res.cloudinary.com/love1/image/upload/v1648817031/maskable_icon_x128_tt2kgj.png',
    onClick: function () {
        window.focus();
        this.close();//close all?
      }
});
  }
}
//todo if nutifi and press add nutifi to true and do not notifi again
</script>