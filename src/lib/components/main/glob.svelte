<script>
    //https://res.cloudinary.com/barb1/image/upload/v1676238523/%D7%A4%D7%AA%D7%A6%D7%95%D7%92%D7%94%D7%9C%D7%95%D7%A4%D7%A4%D7%99%D7%95%D7%9F_kkymez.glb
	import {  Color } from 'three'
	import { T, useFrame } from '@threlte/core'

    import { createEventDispatcher } from 'svelte';
 const dispatch = createEventDispatcher();
	import {  GLTF } from '@threlte/extras'

  let rotationt = $state(0)
		let rotX = 0
  let poz = {z:0, y:0, x:0};
  let obPoz = {z:0, y:0, x:0}
 let boll = false
 let bool = false
 useFrame(() => {

  if(isHovering == false){
	rotationt += 0.01
  } else{
    rotationt = 0

  }
	//rotX += 0.04

//	obPoz.x += 0.01
//} else if(rotationt > -1.5){
//	boll = true
//	rotX -= 0.0	rotationt -= 0.01
	//obPoz.x -= 0.01

//} else{
//	boll = false

//}
/*
if(rotationt < 0.5 && boll == false){
	rotationt += 0.01
} else if(rotationt > -0.5){
	boll = true
	rotationt -= 0.01
} else{
	boll = false

}*/

//console.log(rotationt)
//	poz.y += 1
//	poz.x += 1
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
    dispatch("submit")
}
let isHovering = $state(false), isPointerDown = $state(false)
import Globu from './globu.svelte'
</script>
<!----
<PerspectiveCamera position={{ x: 600, y: 200, z: 600 }} near={10} far={10000}>
	<OrbitControls autoRotate autoRotateSpeed={0.2} enableDamping target={{ y: -75, x: -60 }} />
</PerspectiveCamera>

<AmbientLight />
<DirectionalLight position={{ y: 10, z: 5, x: 5 }} />
<Environment path="/hdr/" files="shanghai_riverside_1k.hdr" />

-->

<T.PerspectiveCamera makeDefaulte position={{ x:0, y:0 , z:25}} fov={24}/>
<T.AmbientLight   intensity={0.61} />
<!--
<AmbientLight  color={new Color(0x00029E)}  intensity={1} rotation={345}/>
color={0x2DFF34} intensity={180} $poz
<AmbientLight color={new Color( 0x2DFF34 )} intensity={1} />

-->
<T.SpotLight position={poz} />

<T.DirectionalLight  intensity={0.81} position={{ y: -20, z: -5, x: 5 }} />
<T.DirectionalLight  intensity={0.91} position={{ y: 10, z: 10 }} />

<GLTF
castShadow receiveShadow
interactive
on:pointerenter={() => (isHovering = true)}
on:pointerleave={() => {
  isPointerDown = false
  isHovering = false

}}
on:pointerdown={() => (isPointerDown = true)}
on:pointerup={() => (isPointerDown = false)}
on:pointercancel={() => {
  isPointerDown = false
  isHovering = false
}}
on:click={sub}
rotation={{y: rotationt
}}
	position={obPoz}
	scale={13}
	url="3d/withlev.glb"
/>
<Globu />
