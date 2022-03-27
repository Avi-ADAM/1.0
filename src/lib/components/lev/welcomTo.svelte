<script>
import { onMount } from 'svelte';
    import { scale, fly } from 'svelte/transition';

import {
    idPr
} from './../../stores/idPr.js';
export let id;
export let username;
export let projectName;
import {
    goto,
    invalidate,
    prefetch,
    prefetchRoutes
} from '$app/navigation';

function project(id) {
    idPr.set(id);
    goto("/moach", );
    
    //make it desapire for good
};

</script>
<div transition:fly={{y: 250, opacity: 0.9, duration: 2000}}>

<svg version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"
	 class="a" viewBox="-1 0 59 58" enable-background="new 0 0 57 57" xml:space="preserve">

<g class="group_1">
    <path class="spark_1" d="M25.9,45.8 c-0.6-0.3-1-0.9-0.9-1.6l0.8-5.2 c0.1-0.8,0.9-1.4,1.7-1.2 c0.8,0.1,1.4,0.9,1.2,1.7L28,44.6 c-0.1,0.8-0.9,1.4-1.7,1.2 C26.2,45.9,26.1,45.8,25.9,45.8z"/>
    <path class="spark_2" d="M25.4,51.8 c0.8,0.1,1.6-0.4,1.7-1.2l0-0.2c0.1-0.8-0.4-1.6-1.3-1.7 c-0.8-0.1-1.6,0.4-1.7,1.3l0,0.2 c-0.1,0.7,0.3,1.3,0.8,1.6 C25.1,51.7,25.3,51.8,25.4,51.8z"/>
    <path class="spark_3" d="M26.3,55.5 c0.1-0.8-0.4-1.6-1.2-1.7 c-0.8-0.1-1.6,0.4-1.7,1.2l0,0.2 c-0.1,0.7,0.3,1.3,0.9,1.6c0.1,0.1,0.3,0.1,0.4,0.1 c0.8,0.1,1.6-0.4,1.7-1.2L26.3,55.5z"/>
</g>
<g class="group_2">
    <path class="spark_1" d="M16.9,41.7 c-0.2-0.1-0.3-0.2-0.4-0.3 c-0.6-0.6-0.6-1.5,0-2.1l3.7-3.7 c0.6-0.6,1.5-0.6,2.1,0c0.6,0.6,0.6,1.5,0,2.1l-3.7,3.7 C18.1,41.9,17.5,42,16.9,41.7z"/>
    <path class="spark_2" d="M14.5,43.4 c-0.6-0.6-1.5-0.6-2.1,0l-0.2,0.2c-0.6,0.6-0.6,1.5,0,2.1 c0.1,0.1,0.3,0.2,0.4,0.3c0.6,0.3,1.2,0.2,1.7-0.3l0.2-0.2 C15.1,44.9,15.1,44,14.5,43.4z"/>
    <path class="spark_3" d="M10.8,47.1 c-0.6-0.6-1.5-0.6-2.1,0l-0.2,0.2c-0.6,0.6-0.6,1.5,0,2.1 c0.1,0.1,0.3,0.2,0.4,0.3 c0.6,0.3,1.2,0.2,1.7-0.3l0.2-0.2 C11.4,48.6,11.4,47.7,10.8,47.1z"/>
</g>
<g class="group_3">
    <path class="spark_1" d="M12,33.2 c-0.4-0.2-0.8-0.6-0.8-1.1 c-0.1-0.8,0.4-1.6,1.2-1.7l5.2-0.8 c0.8-0.1,1.6,0.4,1.7,1.2c0.1,0.8-0.4,1.6-1.2,1.7l-5.2,0.8 C12.5,33.4,12.2,33.3,12,33.2z"/>
    <path class="spark_2" d="M6.7,31.3l-0.2,0 c-0.8,0.1-1.4,0.9-1.2,1.7 c0.1,0.5,0.4,0.9,0.9,1.1 c0.3,0.1,0.6,0.2,0.9,0.1l0.2,0 c0.8-0.1,1.4-0.9,1.2-1.7 C8.3,31.7,7.5,31.1,6.7,31.3z"/>
    <path class="spark_3" d="M1.5,32.1l-0.2,0 C0.4,32.3-0.1,33,0,33.8c0.1,0.5,0.4,0.9,0.9,1.1c0.3,0.1,0.6,0.2,0.9,0.1L2,35 c0.8-0.1,1.4-0.9,1.2-1.7 C3.1,32.5,2.3,32,1.5,32.1z"/>
</g>
<g class="group_4">
    <path class="spark_1" d="M17.7,25.7 C17.6,25.7,17.6,25.7,17.7,25.7l-4.7-2.4c-0.7-0.4-1-1.3-0.7-2 c0.4-0.7,1.3-1,2-0.7L19,23 c0.7,0.4,1,1.3,0.7,2 C19.3,25.8,18.4,26.1,17.7,25.7z"/>
    <path class="spark_2" d="M9.2,18.1L9,17.9 c-0.7-0.4-1.6-0.1-2,0.7c-0.4,0.7-0.1,1.6,0.7,2l0.2,0.1 c0,0,0,0,0,0 c0.7,0.3,1.6,0,2-0.7C10.2,19.3,9.9,18.4,9.2,18.1z"/>
    <path class="spark_3" d="M4.5,15.7l-0.2-0.1c-0.7-0.4-1.6-0.1-2,0.7c-0.4,0.7-0.1,1.6,0.7,2l0.2,0.1 c0,0,0,0,0.1,0c0.7,0.3,1.6,0,2-0.7 C5.5,17,5.2,16.1,4.5,15.7z"/>
</g>
<g class="group_5">
    <path class="spark_1" d="M22,20.7 c-0.3-0.1-0.5-0.4-0.7-0.7l-2.4-4.7 c-0.4-0.7-0.1-1.6,0.6-2c0.7-0.4,1.6-0.1,2,0.7 l2.4,4.7 c0.4,0.7,0.1,1.6-0.7,2 C22.9,20.9,22.4,20.9,22,20.7z"/>
    <path class="spark_2" d="M16.2,10l0.1,0.2 c0.2,0.3,0.4,0.5,0.7,0.7 c0.4,0.2,0.9,0.2,1.3,0c0.7-0.4,1-1.3,0.7-2l-0.1-0.2c-0.4-0.7-1.3-1-2-0.6 C16.1,8.4,15.8,9.3,16.2,10z"/>
    <path class="spark_3" d="M16.6,4.2L16.5,4 c-0.4-0.7-1.3-1-2-0.7c-0.7,0.4-1,1.3-0.7,2l0.1,0.2 c0.2,0.3,0.4,0.5,0.7,0.7c0.4,0.2,0.9,0.2,1.3,0 C16.7,5.8,16.9,4.9,16.6,4.2z"/>
</g>
<g class="group_6">
    <path class="spark_1" d="M28.5,19.1 c-0.6-0.3-1-0.9-0.9-1.6 l0.8-5.2 c0.1-0.8,0.9-1.4,1.7-1.2 c0.8,0.1,1.4,0.9,1.3,1.7L30.6,18 c-0.1,0.8-0.9,1.4-1.7,1.3 C28.7,19.2,28.6,19.2,28.5,19.1z"/>
    <path class="spark_2" d="M31.1,5.2 c-0.8-0.1-1.6,0.4-1.7,1.2l0,0.2c-0.1,0.7,0.3,1.3,0.8,1.6c0.1,0.1,0.3,0.1,0.4,0.1c0.8,0.1,1.6-0.4,1.7-1.2l0-0.2 C32.4,6.1,31.9,5.3,31.1,5.2z"/>
    <path class="spark_3" d="M30.1,1.5C30,2.2,30.4,2.8,31,3.1c0.1,0.1,0.3,0.1,0.4,0.1 C32.2,3.4,33,2.8,33.1,2l0-0.2 c0.1-0.8-0.4-1.6-1.2-1.7c-0.8-0.1-1.6,0.4-1.7,1.2L30.1,1.5z"/>
</g>
<g class="group_7">
    <path class="spark_1" d="M34.6,21.7 c-0.2-0.1-0.3-0.2-0.4-0.3 c-0.6-0.6-0.6-1.5,0-2.1l3.7-3.7 c0.6-0.6,1.5-0.6,2.1,0c0.6,0.6,0.6,1.5,0,2.1l-3.7,3.7 C35.8,21.8,35.2,21.9,34.6,21.7z"/>
    <path class="spark_2" d="M41.9,13.6c0.1,0.1,0.3,0.2,0.4,0.3c0.6,0.3,1.2,0.2,1.7-0.3l0.2-0.2 c0.6-0.6,0.6-1.5,0-2.1c-0.6-0.6-1.5-0.6-2.1,0l-0.2,0.2 C41.3,12.1,41.3,13,41.9,13.6z"/>
    <path class="spark_3" d="M47.9,7.6c-0.6-0.6-1.5-0.6-2.1,0l-0.2,0.2 c-0.6,0.6-0.6,1.5,0,2.1c0.1,0.1,0.3,0.2,0.4,0.3c0.6,0.3,1.2,0.2,1.7-0.3l0.2-0.2 C48.5,9.1,48.5,8.2,47.9,7.6z"/>
</g>
<g class="group_8">
    <path class="spark_1" d="M38.1,27.4 c-0.4-0.2-0.8-0.6-0.9-1.1c-0.1-0.8,0.4-1.6,1.2-1.7l5.2-0.8 c0.8-0.1,1.6,0.4,1.7,1.2s-0.4,1.6-1.2,1.7l-5.2,0.8 C38.6,27.5,38.3,27.5,38.1,27.4z"/>
    <path class="spark_2" d="M49.6,22.7l-0.2,0c-0.8,0.1-1.4,0.9-1.2,1.7c0.1,0.5,0.4,0.9,0.9,1.1c0.3,0.1,0.6,0.2,0.9,0.1 l0.2,0c0.8-0.1,1.4-0.9,1.2-1.7 C51.1,23.2,50.4,22.6,49.6,22.7z"/>
    <path class="spark_3" d="M54.7,21.9l-0.2,0 c-0.8,0.1-1.4,0.9-1.2,1.7c0.1,0.5,0.4,0.9,0.9,1.1c0.3,0.1,0.6,0.2,0.9,0.1l0.2,0c0.8-0.1,1.4-0.9,1.2-1.7 C56.3,22.3,55.5,21.8,54.7,21.9z"/>
</g>
<g class="group_9">
    <path class="spark_1" d="M42.2,36.4 C42.2,36.4,42.2,36.4,42.2,36.4L37.5,34c-0.7-0.4-1-1.3-0.7-2 c0.4-0.7,1.3-1,2-0.7 l4.7,2.4 c0.7,0.4,1,1.3,0.7,2 C43.8,36.4,42.9,36.7,42.2,36.4z"/>
    <path class="spark_2" d="M48.9,36.4l-0.2-0.1 c-0.7-0.4-1.6-0.1-2,0.7c-0.4,0.7-0.1,1.6,0.7,2l0.2,0.1c0,0,0,0,0.1,0c0.7,0.3,1.6,0,2-0.7C49.9,37.7,49.6,36.8,48.9,36.4z"/>
    <path class="spark_3" d="M53.5,38.8l-0.2-0.1c-0.7-0.4-1.6-0.1-2,0.7 c-0.4,0.7-0.1,1.6,0.7,2l0.2,0.1c0,0,0,0,0.1,0c0.7,0.3,1.6,0,2-0.7C54.6,40,54.3,39.1,53.5,38.8z"/>
</g>
<g class="group_10">
    <path class="spark_1" d="M35.6,43.7c-0.3-0.1-0.5-0.4-0.7-0.7l-2.4-4.7c-0.4-0.7-0.1-1.6,0.7-2 c0.7-0.4,1.6-0.1,2,0.7l2.4,4.7c0.4,0.7,0.1,1.6-0.6,2 C36.5,43.9,36,43.9,35.6,43.7z"/>
    <path class="spark_2" d="M40.3,47l-0.1-0.2c-0.4-0.7-1.3-1-2-0.7c-0.7,0.4-1,1.3-0.7,2l0.1,0.2c0.2,0.3,0.4,0.5,0.7,0.7 c0.4,0.2,0.9,0.2,1.3,0 C40.4,48.6,40.7,47.7,40.3,47z"/>
    <path class="spark_3" d="M42.7,51.7l-0.1-0.2c-0.4-0.7-1.3-1-2-0.7c-0.7,0.4-1,1.3-0.7,2L40,53c0.2,0.3,0.4,0.5,0.7,0.7c0.4,0.2,0.9,0.2,1.3,0 C42.8,53.3,43.1,52.4,42.7,51.7z"/>
</g>

<circle cx="28.5" cy="28.5" r="10.5" class="rou">
   
    </circle>
     <text text-anchor="middle"  x="28.5" y="22.5" fill="#FF0092" style="font-size:3px;" >{username}</text>
 <text text-anchor="middle"  x="28.5" y="28.5" fill="#FF0092" style="font-size:3px;" >הצטרפת לרקמת</text>
        <text text-anchor="middle"  x="28.5" y="33.5" fill="#FF0092" style="font-size:3px;" >{projectName}</text>
      <foreignObject x="28.5" y="37.5" width="10">  <button class="bg-lturk p-0.5 te" on:click={project(id)}>למוח הריקמה</button>
</foreignObject></svg>
<!--
    <button class="bg-lturk p-0.5 te" on:click={project(id)}>למוח הריקמה</button>-->
</div>
<style>
    .rou{
        fill:#FFF5A5;
          -webkit-animation-duration: 3s;
    -webkit-animation-name: pulse;
    -webkit-animation-iteration-count: infinite;
    animation-duration: 3s;
    animation-name: pulse;
    animation-iteration-count: infinite;
    }
@-webkit-keyframes pulse {
    0% {  
        stroke: #FFF5A5;
        fill: #5efaf2; 
    }
    25% { 
        stroke: #FFD4DA;
        fill: #FFF5A5; 
    }
    50% { 
        stroke: #99D2E4;
        fill: #FFD4DA; 
    }
    75% { 
        stroke: #5bf875;
        fill: #99D2E4; }
    100% {
        stroke: #5efaf2;
        fill: #5bf875; 
    }
}
@keyframes pulse {
    0% {  
        stroke: #FFF5A5;
        fill: #5efaf2; 
    }
    25% { 
        stroke: #FFD4DA;
        fill: #FFF5A5; 
    }
    50% { 
        stroke: #99D2E4;
        fill: #FFD4DA; 
    }
    75% { 
        stroke: #5bf875;
        fill: #99D2E4; }
    100% {
        stroke: #5efaf2;
        fill: #5bf875; 
    }
}
.spark_1,
.spark_2,
.spark_3 {
    fill: #5efaf2;
    stroke: #FFF5A5;
    -webkit-animation-duration: 3s;
    -webkit-animation-name: pulse;
    -webkit-animation-iteration-count: infinite;
    animation-duration: 3s;
    animation-name: pulse;
    animation-iteration-count: infinite;
}
.spark_1 {
    -webkit-animation-delay: 0.11s;
    animation-delay: 0.11s;
}
.spark_2 {
    -webkit-animation-delay: 0.21s;
    animation-delay: 0.21s;
}
.spark_3 {
    -webkit-animation-delay: 0.31s;
    animation-delay: 0.31s;
}
.te{
    font-size: 10px;
    position: relative;
    top: -50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 45%;
    height: 45%;
    overflow-y: auto;
}
.a {

    text-align: center;
    align-items: center;
    justify-content:  center;
    color: var(--barbi-pink);
  min-height: 75px;
    min-width: 75px;
    max-width: 137.5px;
    max-height: 137.5px;
    aspect-ratio: 1 /1;


}
@media  (min-width: 550px) {
  
	.a{
        min-height: 125px;
        min-width: 125px;
        max-width: 125px;
        max-height: 125px;
  }
 .te{
    font-size: 7px;
}
    }
</style>
