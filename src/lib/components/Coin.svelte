<script lang="ts">
	import { T, useTask, useLoader } from '@threlte/core';
	import { TextureLoader } from 'three';
    import type { Packet } from '$lib/game-logic/PackageManager.svelte';

    let { packet }: { packet: Packet } = $props();

    // טעינת הלוגו
    const texture = useLoader(TextureLoader).load('/coin-logo.png');

    // חישוב מיקום נוכחי על המסלול
    let currentPos = $derived(packet.curve.getPoint(packet.progress));

    // רוטציה
    let rotationY = $state(0);
    useTask((delta) => {
        rotationY += delta * 5; // מהירות סיבוב
    });
</script>

<T.Group position={[currentPos.x, currentPos.y, currentPos.z]} scale={packet.scale} rotation.y={rotationY}>
    
    <!-- 1. טבעת זהב (העובי של המטבע) -->
    <T.Mesh rotation.x={Math.PI / 2}>
        <T.CylinderGeometry args={[0.52, 0.52, 0.08, 32]} />
        <T.MeshStandardMaterial color="#FFD700" metalness={1} roughness={0.2} />
    </T.Mesh>

    <!-- 2. הלוגו מקדימה -->
    {#if $texture}
        <T.Mesh position.z={0.05} rotation.x={0}>
            <T.CircleGeometry args={[0.5, 32]} />
            <T.MeshBasicMaterial map={$texture} transparent side={2} /> 
            <!-- side=2 אומר שרואים אותו משני הצדדים למקרה של באג -->
        </T.Mesh>

        <!-- 3. הלוגו מאחורה (כדי שלא יראו שחור) -->
        <T.Mesh position.z={-0.05} rotation.x={Math.PI}>
            <T.CircleGeometry args={[0.5, 32]} />
            <T.MeshBasicMaterial map={$texture} transparent />
        </T.Mesh>
    {/if}
</T.Group>