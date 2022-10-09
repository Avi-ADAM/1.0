

<script>
  import ErrorScreen from '../lib/components/screens/ErrorScreen.svelte'; // your own Error screen component
  import NotFoundScreen from '../lib/components/screens/NotFoundScreen.svelte'; // your own 404 screen component

  export let message = $page.error.message;
  export let status = $page.status;

  import { page } from '$app/stores';

</script>


{#if status == 404} <!-- Used '==' instead of '===' to match string/number status code (just to be sure) -->
  <NotFoundScreen />
{:else}
  <ErrorScreen {message} {status} />
{/if}