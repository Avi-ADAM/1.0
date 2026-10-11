<script>
  import { onMount } from 'svelte';
  import { userStore, mtahaStore, myActsStore } from '$lib/stores/levStores';
  import { fetchMyActs } from '$lib/utils/levGraphQLQueries';
  import MyActs from '$lib/components/prPr/tasks/Myacts.svelte';
  import { lang } from '$lib/stores/lang.js';
  import { useRealtime } from '$lib/realtime/bus.svelte';

  let { data } = $props();
  /** True once this page read the acts itself — then they are fresher than the heart page's copy. */
  let refetched = $state(false);

  async function loadMyActs() {
    const userId = data.uid || $userStore?.id;
    if (!userId) return false;

    try {
      const res = await fetchMyActs(userId);
      const fetchedMesimot =
        res.data?.usersPermissionsUser?.data?.attributes?.mesimabetahaliches
          ?.data;
      if (fetchedMesimot) {
        myActsStore.set(fetchedMesimot);
        return true;
      }
    } catch (err) {
      console.error('Failed to fetch my acts:', err);
    }
    return false;
  }

  onMount(async () => {
    // 1. Check if we already have data in either store
    if ($mtahaStore.length > 0 || $myActsStore.length > 0) {
      return;
    }

    // 2. Fetch data if empty
    await loadMyActs();
  });

  // An act or a mission of mine changed — by another member, or on another device.
  useRealtime(['act:*', 'mission:*'], async () => {
    if (await loadMyActs()) refetched = true;
  });

  // Priority: mtahaStore (processed) > myActsStore (raw) — until this page re-read them.
  const mesimotToDisplay = $derived(
    !refetched && $mtahaStore.length > 0 ? $mtahaStore : $myActsStore
  );
</script>

<svelte:head>
  <title>{$lang === 'he' ? 'הפעולות שלי' : $lang === 'ar' ? 'أعمالي' : 'My Acts'} · 1lev1</title>
</svelte:head>

<MyActs mesimot={mesimotToDisplay} />
