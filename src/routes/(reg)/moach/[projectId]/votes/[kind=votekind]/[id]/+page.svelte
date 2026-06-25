<script>
  import { page } from '$app/state';
  import { lang } from '$lib/stores/lang.js';
  import VoteDetail from '$lib/components/moach/VoteDetail.svelte';

  // `data` merges the moach [projectId] layout load (projectBase, uid,
  // projectId) with this route's load (kind, entity).
  let { data } = $props();
</script>

<svelte:head>
  <title
    >{data.projectBase?.projectName
      ? `${data.projectBase.projectName} · `
      : ''}{data.entity?.attributes?.name ?? ''} · {$lang === 'he'
      ? 'הצבעה'
      : $lang === 'ar'
        ? 'تصويت'
        : 'Vote'} · 1lev1</title
  >
</svelte:head>

<VoteDetail
  kind={data.kind}
  entity={data.entity}
  projectId={data.projectId}
  projectBase={data.projectBase}
  uid={data.uid}
  backHref={`/moach/${data.projectId}/votes`}
/>
