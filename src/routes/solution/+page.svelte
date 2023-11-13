<script>
      import { animate, signal, all } from '$lib/func/animation.ts'
   $: h = 0;
  $: w = 0;
      const svg = signal({ x: -2, y: -2, w: 2, h: 2 })
  const line = signal({ x: 2.5, y: 2.5, x2: 1.5, y2: 1.5, fill: '#00ffff' })
  const text = signal({ count: 0, opacity: 0 })

  animate(async () => {
    console.log(w,h)
    await svg.to({ x: 0, y: 0, w: w, h: h })//.sfx(sfx.transition)
    all(
      line.to({ x: 0, y: 0,  x2: w, y2: h, fill: '#ffff00' }),//.sfx(sfx.transition)
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
  let points = [
    {
      location: 9,
      color: 'red',
      hover: false,
      heading: { he: 'נקודת ההתחלה' },
      more: { he: 'תמונות של המסכימים כמות שלהם או כל דבר' },
      distance: {sum:0}
    },
    {
      location: 50,
      color: 'blue',
      hover: false,
      heading: { he: 'נקודת האמצע' },
      more: { he: 'עוד ועוד' },
      distance: {sum:0}
    },
    {
      location: 94,
      color: 'pink',
      hover: false,
      heading: { he: 'נקודת סוף' },
      more: { he: 'עוד מידע' },
      distance: {sum:0}
    }
  ];
  $: for (let i = 0; i < points.length; i++) {
    const element = points[i];
    points[i].distance.sum = (points[i].location + points[i + 1]?.location) / 2;
  }
</script>

<div style="height:100vh;width:100vw;">
  <div
    style="height:100%;width:100%;display:flex;align-items:center;justify-content:center;"
    bind:clientHeight={h}
    bind:clientWidth={w}
  >
  <svg  style="height:100%;width:100%;"
         viewBox="{$svg.x} {$svg.y} {$svg.w} {$svg.h}">
     <line
          x1={$line.x}
          y1={$line.y}
          x2={$line.x2}
          y2={$line.y2}
          stroke={'#5c6370'}
          stroke-width="1.6"
        />
     {#each points as point, i}
      <circle
        on:mouseenter={() => (point.hover = true)}
        on:mouseleave={() => (point.hover = false)}
        role="contentinfo"
        fill={point.color}
        r="40"
        cx={(w/100)*point.location}
        cy={(h/100)*point.location}
      />
      
        <foreignObject
          y={((h/100)*point.location)-40}
          x={point.location <= 50 ? ((w/100)*point.location)+150 : ((w/100)*point.location)-150}
          stroke="blueviolet"
          width=100
          height=100
        >
          <div
                  role="contentinfo"

        on:mouseenter={() => (point.hover = true)}
        on:mouseleave={() => (point.hover = false)}
           class="d" 
           style="max-height:100px;display:flex;align-content:center;justify-content:center;flex-direction:column;
           overflow:auto">
          <h3 style="text-align:center">{point.heading[lang]}</h3>
          <h3 style="text-align:center">{point.more[lang]}</h3>
          </div>
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
      {/if}
      {#if points[i + 1] != null}
        <div
          style:top={portrate ? `calc(${point.distance.sum}%)` : 'calc(50%)'}
          style:left={portrate
            ? 'calc(50%)'
            : `calc(${(point.location + points[i + 1].location) / 2}%)`}
          style="position:absolute; border-radius:15%; "
        >
          <button style="background-color:yellowgreen;color:red;"
            >{portrate ? '↕️' : '↔️'}</button
          >
        </div>
      {/if}
      {#if points[i + 1] != null}
        <div
          style:top={portrate
            ? `calc(${(point.location + points[i + 1].location) / 2}% - 5px)`
            : 'calc(50% - 25px)'}
          style:left={portrate
            ? 'calc(50% - 25px)'
            : `calc(${(point.location + points[i + 1].location) / 2}% - 5px)`}
          style="position:absolute; border-radius:15%; "
        >
          <button style="background-color:yellowgreen;color:red;">➕+</button>
        </div>
      {/if}-->
    {/each}
  </svg>
   <!--- <div
      style="background-color:rgb(2, 255, 187);"
      style:width={portrate ? '60px' : '100%'}
      style:height={portrate ? '100%' : '60px'}
    />-->
   
  </div>
</div>