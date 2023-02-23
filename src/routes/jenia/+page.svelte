<script>
  /*import {  MeshBasicMaterial, CircleBufferGeometry, MeshStandardMaterial, BoxBufferGeometry, DoubleSide , SphereGeometry} from 'three'
  import { DEG2RAD } from 'three/src/math/MathUtils'

  import {
    AmbientLight,
    Canvas,
    DirectionalLight,
    Group,
    Mesh,
    OrbitControls,
    PerspectiveCamera
  } from '@threlte/core'
  import { spring } from 'svelte/motion'

  const scale = spring(1)
    const scaled = spring(1)



  import { Text } from '@threlte/extras'
  let value = '1lev1'
  let tfc*/
</script>

<div>
 <!-- <Canvas>
  <input type="text" bind:value={tfc} class="border border-yellow-500"/>

    <Text text={value} color={"0x9966FF"} fontSize="8" rotation={{z:0}} position={{ x: 10, y: -20, z: 10 }}/>

    <PerspectiveCamera position={{ x: 10, y: 10, z: 10 }} fov={24}>
      <OrbitControls
        maxPolarAngle={DEG2RAD * 80}
        autoRotate={true}
        enableZoom={false}
        target={{ y: 1.5 }}
      />
    </PerspectiveCamera>

    <DirectionalLight shadow position={{ x: 3, y: 10, z: 10 }} />
    <DirectionalLight position={{ x: -3, y: 10, z: -10 }} intensity={0.2} />
    <AmbientLight intensity={0.2} />
    
    <Group scale={$scaled}>
      <Mesh
        interactive
        on:pointerenter={() => ($scaled = 2)}
        on:pointerleave={() => ($scaled = 1)}
        position={{ y: 0.5 }}
        castShadow
        geometry={new BoxBufferGeometry(1, 1, 1)}
        material={new MeshStandardMaterial({ color: '#FF0092' })}
      />
    </Group>
    <Group scale={$scale}>
      <Mesh
       interactive
        on:pointerenter={() => ($scale = 2)}
        on:pointerleave={() => ($scale = 1)}
        position={{ y: 1.5 }}
        geometry={new SphereGeometry(1, 32, 16, 0, 6.283185307179586, 0, 3.141592653589793 )}
        material={new MeshBasicMaterial({ color: '#ffff00' })}
      />
    </Group>


    <Mesh
      receiveShadow
      rotation={{ x: -90 * (Math.PI / 180) }}
      geometry={new CircleBufferGeometry(3, 72)}
      material={new MeshStandardMaterial({ side: DoubleSide, color: '#EEE8AA' })}
    />
  </Canvas>-->
</div>

<style>
  div {
    height: 100vh;
    width: 100%;
  }
</style>