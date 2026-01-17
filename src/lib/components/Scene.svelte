<script lang="ts">
	import { T, useTask } from '@threlte/core';
	import { OrbitControls, Environment } from '@threlte/extras';
    import { Vector3 } from 'three';
    import FloatingPacket from './FloatingPacket.svelte';
    import Coin from './Coin.svelte';
	import { packetSystem } from '$lib/game-logic/PackageManager.svelte';

    // --- קונפיגורציה ---
    const userPos = new Vector3(0, 0, 0);
    const islands = [
        { pos: new Vector3(-4, 1, -4), color: '#ff0055' }, // אי 1
        { pos: new Vector3(4, 2, -2), color: '#00ccff' },  // אי 2
        { pos: new Vector3(0, -2, -5), color: '#00ff66' }  // אי 3
    ];

    // --- לוגיקה ---
	useTask((delta) => {
		packetSystem.update(delta);
	});

    // פונקציה שיוצרת תנועה אוטומטית (דמו)
    const spawnWork = () => {
        const target = islands[Math.floor(Math.random() * islands.length)];
        const types = ['cube', 'pyramid', 'sphere'] as const;
        const type = types[Math.floor(Math.random() * 3)];
        
        // שליחת עבודה מהיוזר לאי
        packetSystem.addPacket(userPos, target.pos, type, target.color);
    };

    // כל 1.2 שניות יוצאת עבודה חדשה
    // אפשר להחליף את זה ב-onMount אם רוצים שליטה ידנית
    setInterval(spawnWork, 1200); 

</script>

<!-- מצלמה -->
<T.PerspectiveCamera makeDefault position={[0, 2, 8]} fov={50}>
    <!-- מאפשר לסובב עם העכבר - אופציונלי -->
    <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.5} />
</T.PerspectiveCamera>

<!-- תאורה -->
<Environment preset="city" />
<T.DirectionalLight position={[5, 10, 5]} intensity={1.5} />

<!-- 1. המשתמש במרכז -->
<T.Mesh position={[userPos.x, userPos.y, userPos.z]}>
    <T.SphereGeometry args={[0.8, 32, 32]} />
    <T.MeshStandardMaterial color="white" metalness={0.5} roughness={0.1} />
</T.Mesh>

<!-- 2. האיים מסביב -->
{#each islands as island}
    <T.Mesh position={[island.pos.x, island.pos.y, island.pos.z]}>
        <T.CylinderGeometry args={[1.2, 1, 0.5, 6]} /> <!-- צורת משושה -->
        <T.MeshStandardMaterial color={island.color} transparent opacity={0.8} />
    </T.Mesh>
{/each}

<!-- 3. החבילות והמטבעות -->
{#each packetSystem.packets as packet (packet.id)}
    {#if packet.type === 'coin'}
        <Coin {packet} />
    {:else}
        <FloatingPacket {packet} />
    {/if}
{/each}