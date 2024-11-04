<script>
      import Tile from '$lib/celim/tile.svelte';
import { animate, signal, all } from '$lib/func/animation.ts'
  import { onMount } from 'svelte';
      let colors = ["pink" ,"blue", "purple","wow","indigo",  "green", "yellow", "red", "gray"];

  onMount(()=>{
    addLocation(points)
  })

    const line = signal({ x: 2.5, y: 2.5, x2: 1.5, y2: 1.5, fill: 'blue' })
$: oldH = 0
$: oldW = 0
      $effect(async() => {
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

  $: ww = 0;
  $: www = 0;
  $: portrate = h <= w ? false : true;
  $: points = [
    {
      hover: false,
      heading: { he: 'נקודת ההתחלה' },
      more: { he: 'תמונות של המסכימים כמות שלהם או כל דבר' },
      distance: {sum:0},
      order:1
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
  $: for (let i = 0; i < points.length; i++) {
    const element = points[i];
    points[i].distance.sum = (points[i].location + points[i + 1]?.location) / 2;
  }
  async function addPoint(location="middle",length=1,i=3){
    console.log(location)
    if(length == 1){
      points[0].order = location == "buttom" ? 1:2
      points.push({
      order:location == "top" ? 1:2,  
      hover: false,
      heading: { he: 'נקודה שניה' },
      more: { he: 'עוד מידע' },
      distance: {sum:0}
    })
    
  }else if (location == "top"){
    for (let i = 0; i < points.length; i++) {
      points[i].order += 1      
    }
    points.push({
      order: 1,  
      hover: false,
      heading: { he: ' נקודה'+(length+1) },
      more: { he: 'עוד מידע' },
      distance: {sum:0}
    })
  }else if (location == "buttom"){
   
    points.push({
      order: (length+1),  
      hover: false,
      heading: { he: ' נקודה'+(length+1) },
      more: { he: 'עוד מידע' },
      distance: {sum:0}
    })
  }else{
    for (let t = 0; t < points.length; t++) {
      console.log(i,t,points[t].order)
      if(points[t].order > i){
        points[t].order ++
      }
    }
    points.push({
      order: i+1,  
      hover: false,
      heading: { he: ' נקודה'+(length+1) },
      more: { he: 'עוד מידע' },
      distance: {sum:0}
    })
  }

    points = points
    points.sort(function(a,b){
  return b.order - a.order;
}).reverse()
    points = points
    console.log(points,i)
     addLocation(points)
  }
  function addLocation(pointsArr = []){
    let length = pointsArr.length
    if (length == 1){
      pointsArr[0].location = 50
      pointsArr[0].color = colors[0]
    }else if(length == 2){
      pointsArr[0].location = 33.33
      pointsArr[1].location = 66.666
      pointsArr[0].color = colors[0]
      pointsArr[1].color = colors[1]
    }else if(length == 3){
      pointsArr[0].location = 10
      pointsArr[1].location = 50
      pointsArr[2].location = 90
      pointsArr[0].color = colors[0]
      pointsArr[1].color = colors[1]
      pointsArr[2].color = colors[2]
    }else if(length > 0){
      let t = 10
      let a = 80/(length-1)
      let counter = 0
    for (let i = 0; i < pointsArr.length; i++) {
      pointsArr[i].location = t
      t += a
      pointsArr[i].color = colors[counter]
     counter < 8 ? counter += 1 : counter = 0;
    }
    }

    points = pointsArr
    points = points
  }
</script>

<div style="height:100vh;width:100vw;">
  <div
    style="height:100%;width:100%;display:flex;align-items:center;justify-content:center;"
    bind:clientHeight={h}
    bind:clientWidth={w}
  >
  {#key w,points,h}
  
  <svg  style="height:100%;width:100%;"
         viewBox="{$svg.x} {$svg.y} {$svg.w} {$svg.h}">
     <line
          x1={$line.x}
          y1={$line.y}
          x2={$line.x2}
          y2={$line.y2}
          stroke={$line.fill}
          fill='#fff'
          width="2"
          stroke-width="1.6"
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
        r="20"
        cx={(w/100)*point.location}
        cy={(h/100)*point.location}
      />
      
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
         <!--- <h3 style="text-align:center">{point.more[lang]}</h3>
         --></div>
        </foreignObject>
      <!---- smaller then100 ?
             ((h/100)*point.location) < (h-100) ? 
             h-100 : 
             100 : 
             ((h/100)*point.location)
              {#if point.hover}{/if}

      {#if point.hover}
        <div
          bind:clientWidth={www}
          style:top={portrate
            ? `calc(${point.location}% - 5px)`
            : 'calc(50% + 100px)'}
          style:left={portrate
            ? 'calc(50% - 50px)'
            : `calc(${point.location}% - ${www / 2}px + 15px)`}
          style="border-width:2px; border-color:blueviolet; position:absolute; border-radius:15%; padding:15px; "
        >
          <h3>{point.more[lang]}</h3>
        </div>
      {/if}-->
      {#if points[i + 1] != null}
      <foreignObject
          x={(w/100)*(point.location + points[i + 1].location)/2}
          y={(h/100)*(point.location + points[i + 1].location)/2}
           width=100
          height=100
        >
          <button class="bg-gold text-barbi rounded-full p-2 font-bold"
            >↕️</button
          >
        </foreignObject>
      {/if}
      {#if points[i + 1] != null}
        <foreignObject
          x={(w/100)*(point.location + points[i + 1].location)/2+50}
          y={(h/100)*(point.location + points[i + 1].location)/2}
           width=100
          height=100
        >
          <button on:click={addPoint("middle",points.length,point.order)} class="bg-gold text-barbi rounded-full p-2">➕</button>
        </foreignObject>
      {/if}
    {/each}
        <foreignObject
          x={points.length > 1 ? points.length > 2 ? 3*(w/100)+25 : 16*(w/100)+25 : 33.3*(w/100)+25}
          y={points.length > 1 ? points.length > 2 ? 3*(h/100) : 16*(h/100) : 33.3*(h/100)}
           width=50
          height=50
        >
          <button on:click={addPoint("top",points.length)} class="bg-gold text-barbi rounded-full p-2">➕</button>
        </foreignObject>
        <foreignObject
          x={points.length > 1 ? points.length > 2 ?  94*(w/100)+25 : 84*(w/100)+25  : 66.6*(w/100)+25}
          y={points.length > 1 ? points.length > 2 ?  94*(h/100) : 84*(h/100) : 66.6*(h/100)}
           width=50
          height=50
        >
          <button on:click={addPoint("buttom",points.length)} class="bg-gold text-barbi rounded-full p-2">➕</button>
        </foreignObject>
  </svg>
  {/key}
   <!--- <div
      style="background-color:rgb(2, 255, 187);"
      style:width={portrate ? '60px' : '100%'}
      style:height={portrate ? '100%' : '60px'}
    />-->
   
  </div>
</div>