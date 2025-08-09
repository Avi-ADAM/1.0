<script>
$: w = 0
$: h = 0
$: center = { x: w / 2, y: h / 2 };


// Call this function whenever you add new circles
//placeCircles();

// Add your infinite scroll mechanism here
let z = Array(50)
let size = 100
let bigsize = 175
function checkLine(i){
    let myLine = 1
    let lineCircels = 8
    let check = false
    let calculated = 0
    while(check == false){
    let thisLineCircles = Number((((bigsize)+(size*myLine*1.1) * Math.PI)/(size/2)).toFixed(0))
    calculated += thisLineCircles
    if(i - calculated < 0){
        lineCircels = thisLineCircles
        check = true
    } else{
        myLine += 1
    }
    }
    console.log(myLine,lineCircels)
    return{myline:myLine,lineCircels:lineCircels}
}
</script>
<div class="screen" bind:clientWidth={w} bind:clientHeight={h}>

{#each z as t,i}
{@const myline = checkLine(i)}
{@const angle = (i / myline.lineCircels) * 2 * Math.PI}
{@const distanceFromCenter = myline.myline*size*1.1+ bigsize/2}
<svg class="normSml" style="width:{size}px; left:{center.x + distanceFromCenter * Math.cos(angle)}px; top:{center.y + distanceFromCenter * Math.sin(angle)}px" viewBox="0 0 100 100" >
  <circle fill="pink" id="d{i}" cx="50" cy="50" r="50"/>
 </svg>
 {/each}
</div>
<style>
    .screen {
    position: relative;
    width: 100vw;
    height: 100vh;
    overflow: auto;
}

.normSml {
    position: absolute;
    transition: transform 500ms ease-in-out;
    border-radius: 50%;
    /* Position your elements based on the center */
}

</style>