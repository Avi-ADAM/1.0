<script>
  import { page } from '$app/state';
  import { lang } from '$lib/stores/lang.js';
  import VoteDetail from '$lib/components/moach/VoteDetail.svelte';

  // `data` merges the moach [projectId] layout load (projectBase, uid,
  // projectId) with this route's load (kind, entity).
  let { data } = $props();

  // A Decision carries no `name` — its title is `decisionName` (and `newname`
  // for the kinds that propose one). Without this the tab reads "rikma ·  · vote".
  let entityTitle = $derived(
    data.entity?.attributes?.name ??
      data.entity?.attributes?.newname ??
      data.entity?.attributes?.decisionName ??
      ''
  );
</script>

<svelte:head>
  <title
    >{data.projectBase?.projectName
      ? `${data.projectBase.projectName} · `
      : ''}{entityTitle ? `${entityTitle} · ` : ''}{$lang === 'he'
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
