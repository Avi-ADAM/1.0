<!-- src/routes/CreateNewMeetingIcon.svelte -->
<script>
    import * as THREE from 'three';
  import { T } from '@threlte/core';

	import {  useTask } from '@threlte/core'

    const participantGeometry = new THREE.SphereGeometry(1, 32, 32);

  let  participants = [
      new THREE.Mesh(participantGeometry, new THREE.MeshBasicMaterial({ color: 0xFF0092 })),
      new THREE.Mesh(participantGeometry, new THREE.MeshBasicMaterial({ color: 0x02FFBB })),
      new THREE.Mesh(participantGeometry, new THREE.MeshBasicMaterial({ color: 0x99AABB }))
    ];
let position = $state([
    [-2, 2, 0],   // Adjust the x, y, and z coordinates for the first participant
    [2, 2, 0],    // Adjust the x, y, and z coordinates for the second participant
    [0, -2, 0]    // Adjust the x, y, and z coordinates for the third participant
]);
  
    const plusGeometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(0, 1.5, 0),
      new THREE.Vector3(0, -1.5, 0),
      new THREE.Vector3(1.5, 0, 0),
      new THREE.Vector3(-1.5, 0, 0)
    ]);
  let rotation = $state([0,0,0]);
  
  let  plusSign = new THREE.LineSegments(plusGeometry, new THREE.LineBasicMaterial({ color: 0x000000 })); 
  // Adjust rotation angle for spinning effect
  let angle = $state(0);
  

  // Define rotation speed
  const speed = 0.01;

  // Rotate the participants around the plus sign
  useTask(() => {
    participants.forEach((participant, i) => {
      const radius = 2; // Adjust radius as needed

      // Calculate new position based on rotation angle
      // Calculate new position based on rotation angle
      const x = Math.cos(angle + i * (Math.PI * 2 / participants.length)) * radius;
      const y = Math.sin(angle + i * (Math.PI * 2 / participants.length)) * radius;
      const z = Math.sin(angle + i * (Math.PI * 2 / participants.length)) * radius; // Calculate z coordinate

      // Update participant position
      position[i] = [x, y, z];

    });
    position = position
    // Increment the angle for next frame
    angle += speed;
    rotation[0] += 0.02; // Adjust rotation speed as needed
    rotation = rotation
  });
</script>

  <T.AmbientLight />
  <T.PointLight position={[10, 10, 10]} />
  {#each participants as participant,i}
    <T.Mesh geometry={participant.geometry} material={participant.material} position={position[i]} />
  {/each}
  <T.LineSegments geometry={plusSign.geometry} material={plusSign.material} {rotation} />
