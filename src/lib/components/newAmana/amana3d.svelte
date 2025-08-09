<script >
 // import { T } from '@threlte/core'
 // import { Align, Environment, Float, OrbitControls, Text3DGeometry } from '@threlte/extras'

  export let text
  export let bevelEnabled
  export let bevelOffset
  export let bevelSegments
  export let bevelSize
  export let bevelThickness
  export let curveSegments
  export let height
  export let size
  export let smooth
</script>
<!---
<Align let:align>
  <T.Mesh>
    <Text3DGeometry
      font={'/fonts/Inter-semibold.blob'}
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
      on:create={align}
    />
    <T.MeshStandardMaterial
      color="#FD3F00"
      toneMapped={false}
      metalness={1.0}
      roughness={0.1}
    />
  </T.Mesh>
</Align>

<Environment files="/hdr/shanghai_riverside_1k.hdr" />

<Float
  rotationIntensity={[0, 3, 0]}
  rotationSpeed={1}
  floatingRange={[-5, 5]}
  speed={1}
>
  <T.PerspectiveCamera
    makeDefault
    position.y={0}
    position.z={20}
    fov={90}
    on:create={({ ref }) => {
      ref.lookAt(0, 0, 0)
    }}
  >
    <OrbitControls
      enableDamping
      enablePan={false}
      enableZoom={false}
    />
  </T.PerspectiveCamera>
</Float>-->
