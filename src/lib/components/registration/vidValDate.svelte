<script>
     import { userName } from '../../stores/store.js';
    import { show } from './store-show.js';
 import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();
  let userName_value;
let show_value = 0;

userName.subscribe(value => {
userName_value = value;
});

show.subscribe(newValue => {
show_value = newValue;
});

function increment() {
      show.update(n => n + 1);
      dispatch ('progres',{
		tx: 0,
		txx: 10
	} )
  }
</script>


<h1 class="midscreenText-2">
    {userName_value} 
          <br>
 נא לבחור תאריך ושעה פנויים
 <br>
 לאימות בווידאו מול ת.ז
   </h1>
   <div  class="input-2">
   <input type="date" class="input">
   </div>
   <button class="button-in" on:click="{increment}">
להמשיך      </button>


<style>

 .midscreenText-2 {
      grid-column: 1 /4;
  grid-row: 1/ 2;
  align-self: center;
  justify-self: center;
  font-size: 1.8rem;
  line-height: normal;
  font-weight: 900;
  color: var(--barbi-pink);
  margin-top: 55px;
  background-image: url(https://res.cloudinary.com/love1/image/upload/v1639592274/line1_r0jmn5.png);
  background-size: 400px 150px;
  height: 150px;
  width: 400px;
text-align: center;  
padding-top: 8px;
padding-right: 25px;
padding-left: 25px;
}
    .button-in{
    grid-column: 1/4;
    grid-row: 6 / 7;
    background: var(--barbi-pink);
    border-radius: 50%;
    color: var(--gold)
    }
   
    .input{
   
    background: var(--gold);
    text-align: center;
    }
    .input-2{
    grid-column: 2/3;
    grid-row: 3/4;
     align-self: center;
  justify-self: center;
    }
    </style>