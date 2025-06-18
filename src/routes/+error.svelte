

<script>
  import ErrorScreen from '../lib/components/screens/ErrorScreen.svelte'; // your own Error screen component
  import NotFoundScreen from '../lib/components/screens/NotFoundScreen.svelte'; // your own 404 screen component


  import { page } from '$app/stores';
  let { message = $page.error.message, status = $page.status } = $props();

</script>


{#if status == 404} <!-- Used '==' instead of '===' to match string/number status code (just to be sure) -->
  <NotFoundScreen />
{:else}
  <ErrorScreen {message} {status} />
{/if}