<script>
  import Tile from '$lib/celim/tile.svelte';
  import Button from '$lib/celim/ui/button.svelte';
  import { lang } from '$lib/stores/lang';
  /** @type {{src?: string, pname?: string, mname?: string, type?: string, isOpen?: boolean, isPend?: boolean, text?: any, onClick?: any}} */
  let {
    src = '',
    pname = '',
    mname = '',
    type = '',
    isOpen = false,
    isPend = false,
    text = { he: 'אני אבצע', en: 'assign to me' },
    onClick = () => {}
  } = $props();
</script>

{#if type !== 'button'}
  <div class="flex items-center gap-2">
    {#if src}
      <img {src} alt={pname} class="w-8 h-8 rounded-full" />
    {/if}
    <div class="flex flex-col text-start">
      {#if pname}
        <span>{pname}</span>
      {/if}
      {#if mname}
        <span
          class="text-blue-500 cursor-pointer hover:underline"
          role="button"
          tabindex="0"
          onclick={onClick}
        >
          {mname}
        </span>
      {/if}
    </div>
  </div>
  {#if !pname && !mname}
    {#if isOpen}
      <button onclick={onClick}>
        <Tile bg="pink" word={isOpen.name} />
      </button>
    {:else if isPend}
      <button onclick={onClick}>
        <Tile bg="gold" word={isPend.name} />
      </button>
    {/if}
  {/if}
{:else}
  <Button {text} click={onClick} />
{/if}
