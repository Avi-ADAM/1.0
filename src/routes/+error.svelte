<script>
  import ErrorScreen from '../lib/components/screens/ErrorScreen.svelte'; // your own Error screen component
  import NotFoundScreen from '../lib/components/screens/NotFoundScreen.svelte'; // your own 404 screen component

  import { page } from '$app/state';

  // `code` / `from` are stamped by handleError (hooks.server.js, hooks.client.js)
  // so the screen can tell a dead session apart from a real bug and offer the
  // way back in. They are absent when SvelteKit renders a built-in error.
  let {
    message = page.error?.message,
    status = page.status,
    code = page.error?.code,
    from = page.error?.from
  } = $props();
</script>

{#if status == 404}
  <!-- Used '==' instead of '===' to match string/number status code (just to be sure) -->
  <NotFoundScreen />
{:else}
  <ErrorScreen {message} {status} {code} {from} />
{/if}
