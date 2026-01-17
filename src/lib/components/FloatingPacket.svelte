<script lang="ts">
	import { T, useTask } from '@threlte/core';
    import type { Packet } from '$lib/game-logic/PackageManager.svelte';

    let { packet }: { packet: Packet } = $props();
    let currentPos = $derived(packet.curve.getPoint(packet.progress));
    
    // סיבוב קטן גם לחבילות
    let rot = $state(0);
    useTask((delta) => rot += delta * 2);
</script>

<T.Group position={[currentPos.x, currentPos.y, currentPos.z]} scale={packet.scale} rotation={[rot, rot, 0]}>
    {#if packet.type === 'cube'}
        <T.Mesh>
            <T.BoxGeometry />
            <T.MeshStandardMaterial color={packet.color} />
        </T.Mesh>
    {:else if packet.type === 'pyramid'}
        <T.Mesh>
            <T.ConeGeometry args={[0.5, 1, 4]} /> 
            <T.MeshStandardMaterial color={packet.color} />
        </T.Mesh>
    {:else}
        <T.Mesh>
            <T.IcosahedronGeometry args={[0.5, 0]} />
            <T.MeshStandardMaterial color={packet.color} />
        </T.Mesh>
    {/if}
</T.Group>