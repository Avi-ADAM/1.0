<script>
    import { cn } from "$lib/utils";
  
  /** @type {{gradient?: boolean, class?: string, label?: import('svelte').Snippet, children?: import('svelte').Snippet}} */
  let {
    gradient = false,
    class: className = "",
    label,
    children
  } = $props();
    
  </script>
  
  {#if label}
    <div class="flex items-center w-full">
      <div
        class={cn(
          "rounded-full w-full h-[1px]",
          gradient
            ? "bg-gradient-to-r from-transparent dark:from-zinc-800 dark:to-zinc-400 to-zinc-500"
            : "bg-zinc-300 dark:bg-zinc-800",
          className
        )}
      ></div>
      <div class="text-gray-600  uppercase w-fit dark:text-gray-300 text-nowrap">
        {@render label?.()}
      </div>
      <div
        class={cn(
          "rounded-full w-full h-[1px]",
          gradient
            ? "bg-gradient-to-r from-zinc-500 dark:from-zinc-200 to-transparent dark:to-zinc-700"
            : "bg-zinc-300 dark:bg-zinc-800",
          className
        )}
      ></div>
    </div>
  {:else}
    {#if children}{@render children()}{:else}
      <div
        class={cn(
          "rounded-full w-full h-[1px]",
          gradient
            ? "bg-gradient-to-r from-transparent via-zinc-500 dark:via-zinc-200 to-transparent dark:from-zinc-800 dark:to-zinc-700"
            : "bg-zinc-300 dark:bg-zinc-800",
          className
        )}
></div>
    {/if}
  {/if}
  