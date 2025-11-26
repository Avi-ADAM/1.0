---
inclusion: always
---

# Svelte 5 Syntax Guidelines

## Critical: Always Use Svelte 5 Syntax

This project uses **Svelte 5**. Always write components using Svelte 5 syntax, not legacy Svelte 3/4 syntax.

## Key Differences

### Props (ALWAYS use this in Svelte 5)
```svelte
<script>
  // ✅ Svelte 5 - CORRECT
  let { username, amount = 0, isReceiving = true } = $props();
</script>
```

```svelte
<script>
  // ❌ Svelte 3/4 - WRONG
  export let username;
  export let amount = 0;
  export let isReceiving = true;
</script>
```

### State (ALWAYS use this in Svelte 5)
```svelte
<script>
  // ✅ Svelte 5 - CORRECT
  let count = $state(0);
  let doubled = $derived(count * 2);
</script>
```

```svelte
<script>
  // ❌ Svelte 3/4 - WRONG
  let count = 0;
  $: doubled = count * 2;
</script>
```

### Effects (ALWAYS use this in Svelte 5)
```svelte
<script>
  // ✅ Svelte 5 - CORRECT
  $effect(() => {
    console.log('count changed:', count);
  });
</script>
```

```svelte
<script>
  // ❌ Svelte 3/4 - WRONG
  $: {
    console.log('count changed:', count);
  }
</script>
```

### Event Handlers (ALWAYS use this in Svelte 5)
```svelte
<!-- ✅ Svelte 5 - CORRECT -->
<button onclick={() => count++}>Click</button>
```

```svelte
<!-- ❌ Svelte 3/4 - WRONG -->
<button on:click={() => count++}>Click</button>
```

### Bind (ALWAYS use this in Svelte 5)
```svelte
<!-- ✅ Svelte 5 - CORRECT -->
<input bind:value={text} />
```

```svelte
<!-- ❌ Svelte 3/4 - STILL WORKS but prefer consistency -->
<input bind:value={text} />
```

## Quick Reference

| Feature | Svelte 5 | Legacy (DON'T USE) |
|---------|----------|-------------------|
| Props | `let { prop } = $props()` | `export let prop` |
| State | `let x = $state(0)` | `let x = 0` |
| Derived | `let y = $derived(x * 2)` | `$: y = x * 2` |
| Effects | `$effect(() => {})` | `$: {}` |
| Events | `onclick={handler}` | `on:click={handler}` |

## When Creating New Components

1. Always start with `let { ...props } = $props()`
2. Use `$state()` for reactive variables
3. Use `$derived()` for computed values
4. Use `$effect()` for side effects
5. Use `onclick`, `onchange`, etc. for events

## Migration Note

If you see legacy syntax in existing files, it's okay to leave it as-is unless you're actively editing that component. But **all new code must use Svelte 5 syntax**.
