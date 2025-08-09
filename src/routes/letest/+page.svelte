<script>
      import Tile from '$lib/celim/tile.svelte';
import { animate, signal, all } from '$lib/func/animation.ts'
  import { afterUpdate, onMount } from 'svelte';
      let colors = ["pink" ,"blue", "purple","wow","indigo",  "green", "yellow", "red", "gray"];


    const line = signal({ x: 2.5, y: 2.5, x2: 1.5, y2: 1.5, fill: 'blue' })
$: oldH = 0
$: oldW = 0
      afterUpdate(async() => {
        if(oldH == 0 && oldW== 0){
          oldH = h
          oldW = w
          console.log(oldH,"if")
        }else {
                                console.log(oldH,"else if")

          if(oldH != h || oldW != w){
                      console.log(oldH,"else if if")
    all(

     svg.to({ x: 0, y: 0, w: w, h: h },{duration:10}),//.sfx(sfx.transition)
      line.to({ x: 0, y: 0,  x2: w, y2: h, fill: '#ffff00' },{duration:10})//.sfx(sfx.transition)
    )
    //  svg.to({ x: 0, y: 5 })

  oldH = h
  oldW = w
          }
        }
        // content here
        // line = signal({ x: 2.5, y: 2.5, x2: 1.5, y2: 1.5, fill: '#00ffff' })
        // animate()
        console.log("updated",h,w)
      });
   $: h = 0;
  $: w = 0;
      const svg = signal({ x: -2, y: -2, w: 2, h: 2 })
  const text = signal({ count: 0, opacity: 0 })

 animate(async () => {
    console.log(w,h)
    await svg.to({ x: 0, y: 0, w: w, h: h })//.sfx(sfx.transition)
    all(
      line.to({ x: 0, y: 0,  x2: w, y2: h, fill: 'pink' }),//.sfx(sfx.transition)
    //  svg.to({ x: 0, y: 5 })
    )

    await text
      .to({ opacity: 1 }, { duration: 300 })
      //.sfx(sfx.tally)
      .to({ count: 10_000 }, { duration: 600 })
  })
  let lang = 'he';
    $: coinr = 75

  $: ww = 0;
  $: www = 0;
  $: portrate = h <= w ? false : true;
  $: points = [
    {
      locationx: 50-((coinr*1.5)/(w/100)),
      locationy: 50-((coinr*1.5)/(h/100)),
      hover: false,
      heading: { he: 'נקודת ההתחלה' },
      more: { he: 'תמונות של המסכימים כמות שלהם או כל דבר' },
      distance: {sum:0}, 
      order:1,
      color:"yellow"
    },
    {
      locationx: 50-((coinr*1.5)/(w/100)),
      locationy: 50-((coinr*1.5)/(h/100)),
      hover: false,
      heading: { he: 'נקודת ההתחלה' },
      more: { he: 'תמונות של המסכימים כמות שלהם או כל דבר' },
      distance: {sum:0},
      order:1,
      color:"red"
    }/*,
     {
      hover: false,
      heading: { he: 'נקודת ההתחלה' },
      more: { he: 'תמונות של המסכימים כמות שלהם או כל דבר' },
      distance: {sum:0},
      order:2
    },
     {
      hover: false,
      heading: { he: 'נקודת ההתחלה' },
      more: { he: 'תמונות של המסכימים כמות שלהם או כל דבר' },
      distance: {sum:0},
      order:3
    },
    {
      hover: false,
      heading: { he: 'נקודת האמצע' },
      more: { he: 'עוד ועוד' },
      distance: {sum:0},
      order:4
    },
    {
      hover: false,
      heading: { he: 'נקודת סוף' },
      more: { he: 'עוד מידע' },
      distance: {sum:0},
      order:5
    },
    {
      hover: false,
      heading: { he: 'נקודת סוף' },
      more: { he: 'עוד מידע' },
      distance: {sum:0},
      order:6
    }*/
  ];
  console.log(points)
 

</script>

<div style="height:100dvh;width:100vw;">
  <div
    style="height:100%;width:100%;display:flex;align-items:center;justify-content:center;"
    bind:clientHeight={h}
    bind:clientWidth={w}
  >
  {#key w,points,h}
  
  <svg  style="height:100%;width:100%;"
         viewBox="{$svg.x} {$svg.y} {$svg.w} {$svg.h}">
     <circle
        role="contentinfo"        
        r="{coinr}"
        fill="purple"
        cx={(w/100)*50}
        cy={(h/100)*50}
      />
     {#each points as point, i}
      <circle
        on:mouseenter={() => (point.hover = true)}
        on:mouseleave={() => (point.hover = false)}
        role="contentinfo"
        class:fill-yellow-200={point.color == "yellow"}
        class:fill-pink-200={point.color == "pink"}
        class:fill-red-200={point.color == "red"}
        class:fill-green-200={point.color == "green"}
        class:fill-blue-200={point.color == "blue"}
        class:fill-gray-200={point.color == "gray"}
        class:fill-indigo-200={point.color == "indigo"}
        class:fill-purple-200={point.color == "purple"}
        class:fill-wow={point.color == "wow"}
        r="{coinr}"
        cx={(w/100)*point.locationx}
        cy={(h/100)*point.locationy}
      />
      <!----
        <foreignObject
          y={((h/100)*point.location)-14}
          x={point.location <= 50 ? ((w/100)*point.location)+50 : ((w/100)*point.location)-100}
          stroke="blueviolet"
          width=200
          height=100
        >
          <div
                  role="contentinfo"

        on:mouseenter={() => (point.hover = true)}
        on:mouseleave={() => (point.hover = false)}
           >
          <Tile
          big={point.hover}
          sm={point.hover}
           word={point.heading[lang]} bg={point.color? point.color : "red"}/>
          <h3 style="text-align:center">{point.more[lang]}</h3>
        </div>
        </foreignObject>-->
   
      
    {/each}
       
  </svg>
  {/key}
   
  </div>
</div>