<script >
 // import { Canvas } from '@threlte/core'
  import Amana3d from './amana3d.svelte';
  let text = 'Hello\nWorld'
  let bevelEnabled = true
  let bevelOffset = 0
  let bevelSegments = 20
  let bevelSize = 0.2
  let bevelThickness = 0.1
  let curveSegments = 12
  let height = 1
  let size = 5
  let smooth = 0.1
  /*
	rotation.x={-0.28}
      size={5}
      height={1}
      bevelEnabled={true}
      bevelThickness={0.1}
      bevelSize={0.2}
      bevelSegments={20}
      smooth={0.1}
			*/
</script>


<div>
  <!----<Canvas>
    <Amana3d
      {text}
      {bevelEnabled}
      {bevelOffset}
      {bevelSegments}
      {bevelSize}
      {bevelThickness}
      {curveSegments}
      {height}
      {size}
      {smooth}
    />
  </Canvas>-->
</div>

<style>
  div {
    height: 100%;
  }
  .card {
  width: 95%;
  height: 80%;
  background: rgb(223, 225, 235);
  border-radius: 50px;
  box-shadow: rgba(0, 0, 0, 0.17) 0px -23px 25px 0px inset, rgba(0, 0, 0, 0.15) 0px -36px 30px 0px inset, rgba(0, 0, 0, 0.1) 0px -79px 40px 0px inset, rgba(0, 0, 0, 0.06) 0px 2px 1px, rgba(0, 0, 0, 0.09) 0px 4px 2px, rgba(0, 0, 0, 0.09) 0px 8px 4px, rgba(0, 0, 0, 0.09) 0px 16px 8px, rgba(0, 0, 0, 0.09) 0px 32px 16px;
}
p{
padding: 25px;
}
</style>
