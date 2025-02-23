<script>
    /** @type {{missions?: any, reasorses?: any}} */
    let { missions = [{
        name: "",
        amount: 0,
        perhor: 0
    }], reasorses = [{
        name: "",
        amount: 0,
    type: "",
    perhor: 0
    }] } = $props();
    let global = [{
        description: "",
        amount: 0
    }]
</script>
{#each missions as mission ,i}

{/each}