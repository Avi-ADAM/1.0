<!-- @migration-task Error while migrating Svelte code: Cannot use `$props()` more than once
https://svelte.dev/e/props_duplicate -->
<!-- @migration-task Error while migrating Svelte code: Cannot use `$props()` more than once
https://svelte.dev/e/props_duplicate -->
<!-- @migration-task Error while migrating Svelte code: Cannot use `$props()` more than once
https://svelte.dev/e/props_duplicate -->
<!-- @migration-task Error while migrating Svelte code: Cannot use `$props()` more than once
https://svelte.dev/e/props_duplicate -->
<script>
    //https://res.cloudinary.com/barb1/image/upload/v1676238523/%D7%A4%D7%AA%D7%A6%D7%95%D7%92%D7%94%D7%9C%D7%95%D7%A4%D7%A4%D7%99%D7%95%D7%9F_kkymez.glb
	import {  useFrame } from '@threlte/core'
import { onMount } from 'svelte';
import Glttf from './11.svelte'
import { T } from '@threlte/core'
let s = true
onMount(()=>{
    s = true;
    setTimeout(function () {
        s = false;
    }, 4300);
})


  /**
   * @typedef {Object} Props
   * @property {number} [ss]
   * @property {boolean} [fi]
   * @property {boolean} [hover]
   * @property {boolean} [scrolli]
   * @property {() => void} [onSubmit] - Callback for when the component submits.
   */

  /** @type {Props} */
  let {
    onSubmit,
    ss = $bindable(0),
    fi = false,
    hover = false,
    scrolli = false
  } = $props();

let rotationt = 0
let poz = $state({z:0, y:0, x:0});

let up = true
 useFrame(() => {
    if (s == false){
      ss =0
    if(poz.y < 2.5 && up == false){
	poz.y += 0.01
} else if(poz.y > -2.5){
	up = true
	poz.y -= 0.01
} else{
	up = false
    poz.y = -2.49
}
   
  if(isHovering == false){
	rotationt += 0.01
  } else{
    rotationt = 0

  }
}else{
    if(poz.y != 0){
    poz.y -= 0.09
    ss += 0.001
    }else{
    poz.y = 10
    ss = -2
    }
}
  })
  /*
setInterval(() => {
	console.log("shalom",$poz)

  rotationt += 0.002
  if($poz.y < 1 && boll == false){
	poz.set({z:0,y:$poz.y+0.5, x:0})
  } else if ($poz.y > 0){
	boll = true
	poz.set({z:0, y:$poz.y-1, x:0 })
  } else {
	boll = false
	poz.set({z:0, y:$poz.y+0.5, x:0})
  }

  if (boll == false){
  poz.set({z: 2, y:1, x:2})
  } else{
    poz.set({z: 0, y:-1, x:0})

  }

}, 1000);*/
//	const { scene } = useThrelte()
//	scene.background = new Color(0xeae8e2)
function sub (){
    console.log("click")
    onSubmit?.()
}
let isHovering = false, isPointerDown = false

</script>
<!----
<PerspectiveCamera position={{ x: 600, y: 200, z: 600 }} near={10} far={10000}>
	<OrbitControls autoRotate autoRotateSpeed={0.2} enableDamping target={{ y: -75, x: -60 }} />
</PerspectiveCamera>

<AmbientLight />
<DirectionalLight position={{ y: 10, z: 5, x: 5 }} />
<Environment path="/hdr/" files="shanghai_riverside_1k.hdr" />



<PerspectiveCamera position={{ x:0, y:0 , z:25}} fov={24}>
</PerspectiveCamera>-->

<!--
{#if gltf}
  <T
    is={ref}
    {...$$restProps}
  >
    <T.Group name="Scene">
      <T.Group
        name="Stacy"
        rotation={[Math.PI / 2, 0, 0]}
        scale={0.01}
      >
        <T is={gltf.nodes.mixamorigHips} />
        <T.SkinnedMesh
          name="stacy"
          material={gltf.materials}
          rotation={[-Math.PI / 2, 0, 0]}
          scale={100}
        />
      </T.Group>
    </T.Group>
    <slot {ref} />
  </T>
{/if}


<GLTF rotation={{y:poz.y/50,z:-(poz.y/50),x:-(poz.y/40)}} position={{x:((-(poz.y/10))-3),z:-(poz.y/4)}} scale={13} url="3d/ehad.glb"/>
<GLTF rotation={{y:-(poz.y/50),z:(poz.y/50),x:(poz.y/40)}} position={{x:(poz.y/10)+3,z:(poz.y/4)}} scale={13} url="3d/אחת.glb"/>
<GLTF position={{y:poz.y/5, x:poz.y/4}} rotation={{x:poz.y*4,y:poz.y*4}} scale={(poz.y/8)+13} url="3d/לבבה.glb"/>

<GLTF position={{y:poz.y/5 -1.2, x:poz.y/4}} rotation={{y:0.3,x:poz.y/15}} scale={6} url="3d/11.glb"/>
-->
<T.AmbientLight  />
<T.AmbientLight    intensity={0.61} />

<T.AmbientLight    intensity={1} rotation={345}/>

<T.AmbientLight  intensity={1} />


<T.SpotLight position={poz} />

<T.DirectionalLight  intensity={0.81} position={{ y: -20, z: -5, x: 5 }} />
<T.DirectionalLight  intensity={0.91} position={{ y: 10, z: 10 }} />
<Glttf {poz} s={ss} {fi} {hover} {scrolli}/>
