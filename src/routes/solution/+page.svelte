<script>
    let lang = "he"
$: h = 0
$: w = 0
$: ww = 0
$: www = 0
$: portrate = h <= w ? false : true 
$: console.log(portrate)
let points = [{location:3,color:"red",hover:false,heading:{"he":"נקודת ההתחלה"},more:{"he":"תמונות של המסכימים כמות שלהם או כל דבר"}},
 {location:50,color:"blue",hover:false,heading:{"he":"נקודת האמצע"},more:{"he":"עוד ועוד"}},
 {location:94,color:"pink",hover:false,heading:{"he":"נקודת סוף"},more:{"he":"עוד מידע"}}]
</script>
<div style="height:100vh;width:100vw;">

<div style="height:100%;width:100%;display:flex;align-items:center;justify-content:center;" bind:clientHeight={h} bind:clientWidth={w}>
    <div style="background-color:cadetblue;" style:width={portrate ? "60px" : "100%"} 
        style:height={portrate ?  "100%" : "60px"}></div>
        {#each points as point,i}
        <div 
        on:mouseenter={()=>point.hover = true}
        on:mouseleave={()=>point.hover = false}
        role="contentinfo"
        style:background-color={point.color}  
        style="height:40px;width:40px;border-radius:50%;position:absolute;" 
        style:top={portrate ?  point.location+"%" :"calc(50% - 20px)" }
        style:left={portrate ? "calc(50% - 20px)" : point.location+"%"}
        ></div>   
        {#if point.hover}
        <div 
        bind:clientWidth={ww}
         style:top={portrate ?  `calc(${point.location}% - 5px)` :"calc(50% - 100px)" }
        style:left={portrate ? "calc(50% + 50px)" : `calc(${point.location}% - ${ww/2}px + 15px)`}
        style="border-width:2px; border-color:blueviolet; position:absolute; border-radius:15%; padding:15px; "><h3>{point.heading[lang]}</h3></div>
        {/if}
        {#if point.hover}
        <div 
        bind:clientWidth={www}
         style:top={portrate ?  `calc(${point.location}% - 5px)` :"calc(50% + 100px)" }
        style:left={portrate ? "calc(50% - 50px)" : `calc(${point.location}% - ${www/2}px + 15px)`}
        style="border-width:2px; border-color:blueviolet; position:absolute; border-radius:15%; padding:15px; "><h3>{point.more[lang]}</h3></div>
        {/if} 
        {#if points[i+1] != null}
        <div 
        style:top={portrate ?  `calc(${(point.location + points[i+1].location)/2}%)` :"calc(50%)" }
        style:left={portrate ? "calc(50%)" : `calc(${(point.location + points[i+1].location)/2}%)`}
        style="position:absolute; border-radius:15%; "><button style="background-color:yellowgreen;color:red;">{portrate ? "↕️" :"↔️"}</button></div>
        {/if}
        {#if points[i+1] != null}
        <div 
        style:top={portrate ?  `calc(${(point.location + points[i+1].location)/2}% - 5px)` :"calc(50% - 25px)" }
        style:left={portrate ? "calc(50% - 25px)" : `calc(${(point.location + points[i+1].location)/2}% - 5px)`}
        style="position:absolute; border-radius:15%; "><button style="background-color:yellowgreen;color:red;">➕</button></div>
        {/if}        
        {/each} 
</div>
</div>