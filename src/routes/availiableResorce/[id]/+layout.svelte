<script>
    /**
     * @typedef {Object} Props
     * @property {import('svelte').Snippet} [children]
     */

    /** @type {Props} */
    let { children } = $props();
    let openSearch = false
    </script>
    <div class="w-screen max-h-screen overflow-auto d min-h-screen bg-gradient-to-br from-black via-slate-900 via-slate-800 via-slate-600 to-slate-400">
{#if children}{@render children()}{:else}<!-- optional fallback -->{/if}
    </div>
