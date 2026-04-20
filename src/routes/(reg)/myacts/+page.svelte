<script>
  import { onMount } from 'svelte';
  import { userStore, mtahaStore, myActsStore } from '$lib/stores/levStores';
  import { fetchMyActs } from '$lib/utils/levGraphQLQueries';
  import MyActs from '$lib/components/prPr/tasks/Myacts.svelte';

  let { data } = $props();

  onMount(async () => {
    // 1. Check if we already have data in either store
    if ($mtahaStore.length > 0 || $myActsStore.length > 0) {
      return;
    }

    // 2. Fetch data if empty
    const userId = data.uid || $userStore?.id;
    if (!userId) return;

    try {
      const res = await fetchMyActs(userId);
      const fetchedMesimot = res.data?.usersPermissionsUser?.data?.attributes?.mesimabetahaliches?.data;
      if (fetchedMesimot) {
        myActsStore.set(fetchedMesimot);
      }
    } catch (err) {
      console.error('Failed to fetch my acts:', err);
    }
  });

  // Priority: mtahaStore (processed) > myActsStore (raw)
  const mesimotToDisplay = $derived(
    $mtahaStore.length > 0 ? $mtahaStore : $myActsStore
  );
</script>

<MyActs mesimot={mesimotToDisplay} />
