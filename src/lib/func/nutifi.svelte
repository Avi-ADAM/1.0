<script context="module">
import * as Push from 'push.js'; // if using ES6 
export function nutifi(head,text,link) {
  console.log(head,text,link)
  Push.create(head, {
    body: text,
    icon: 'https://res.cloudinary.com/love1/image/upload/v1648817031/maskable_icon_x128_tt2kgj.png',
    onClick: function () {
        window.focus();
        this.close();//close all?
    }
});
}
</script>