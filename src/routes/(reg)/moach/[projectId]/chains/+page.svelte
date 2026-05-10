<script>
  import ProcessChainView from '$lib/components/process/ProcessChainView.svelte';
  import { getMoachStore } from '$lib/stores/moachStore.svelte.js';
  import { page } from '$app/state';
  import { untrack } from 'svelte';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { onMount } from 'svelte';
  import Lowding from '$lib/celim/lowding.svelte';
  import { lang } from '$lib/stores/lang.js';

  const moachStore = getMoachStore();
  const baseUrl = import.meta.env.VITE_URL;

  let projectId = $derived(page.params.projectId);
  let projectData = $derived(moachStore.state.projects[projectId]);
  let missions = $derived(projectData?.missions);
  let financials = $derived(projectData?.financials);
  let base = $derived(projectData?.base);

  let { data } = $props();

  $effect(() => {
    if (data.chainsServerData && !projectData?.chainsExtra) {
      moachStore.updateProjectData(projectId, 'chainsExtra', data.chainsServerData);
    }
  });

  let chainsExtra = $derived(projectData?.chainsExtra || data.chainsServerData);
  let chainExtraOpmashData = $derived(chainsExtra?.open_mashaabims?.data || []);
  let chainExtraArchiveBmi = $derived(chainsExtra?.extraArchiveBmi?.data || []);
  let chainExtraArchivePm = $derived(chainsExtra?.extraArchivePm?.data || []);

  let loading = $state(false);

  let chainExtraOmiData = $state([]);
  let chainExtraPmiData = $state([]);
  let chainExtraLoading = $state(false);

  async function fetchChainExtraData() {
    if (chainExtraLoading || !missions) return;

    const omiData = missions.open_missions?.data || [];
    const bmiData = missions.mesimabetahaliches?.data || [];
    const pmiData = missions.pendms?.data || [];

    const knownOmIds = new Set(omiData.map((om) => String(om.id)));
    const neededOmIds = [
      ...new Set(
        bmiData.flatMap((b) =>
          (b.attributes?.open_missions?.data ?? []).map((om) => String(om.id))
        )
      )
    ].filter((id) => id && !knownOmIds.has(id));

    const knownPmIds = new Set(pmiData.map((p) => String(p.id)));
    const neededPmIds = [
      ...new Set([
        ...(base?.acts?.data ?? [])
          .map((a) => String(a.attributes?.pendm?.data?.id ?? ''))
          .filter(Boolean),
        ...omiData
          .map((om) => String(om?.attributes?.pendm?.data?.id ?? ''))
          .filter(Boolean)
      ])
    ].filter((id) => !knownPmIds.has(id));

    if (neededOmIds.length === 0 && neededPmIds.length === 0) return;

    const cacheKey = `pcv_extra_v4_${projectId}`;
    try {
      const raw = localStorage.getItem(cacheKey);
      if (raw) {
        const { ts, o, p } = JSON.parse(raw);
        if (Date.now() - ts < 30 * 60 * 1000) {
          const cachedOmIds = new Set((o ?? []).map((e) => String(e.id)));
          const cachedPmIds = new Set((p ?? []).map((e) => String(e.id)));
          if (
            neededOmIds.every((id) => cachedOmIds.has(id)) &&
            neededPmIds.every((id) => cachedPmIds.has(id))
          ) {
            chainExtraOmiData = o ?? [];
            chainExtraPmiData = p ?? [];
            return;
          }
        }
      }
    } catch {
      /* ignore parse errors */
    }

    chainExtraLoading = true;
    try {
      const parts = [];
      if (neededOmIds.length > 0) {
        parts.push(`
          extraOm: open_missions(filters:{id:{in:[${neededOmIds.map((id) => `"${id}"`).join(',')}]}}) {
            data { id attributes { name noofhours perhour sqadualed privatlinks publicklinks
              rishon{data{id}} mission{data{id}} acts{data{id attributes{shem dateS}}} createdAt
              asks {data{ id attributes { archived
                users_permissions_user {data{ id attributes{ username profilePic {data{attributes{ url }}}}}}
                forums {data{ id }}
              }}}
            }}
          }
        `);
      }
      if (neededPmIds.length > 0) {
        parts.push(`
          extraPendm: pendms(filters:{id:{in:[${neededPmIds.map((id) => `"${id}"`).join(',')}]}}) {
            data { id attributes { name createdAt dates noofhours perhour mission{data{id}}
              users { what why id users_permissions_user { data { id attributes { username } } } }
            }}
          }
        `);
      }

      const token = page.data?.tok || '';
      const res = await fetch(baseUrl + '/graphql', {
        method: 'POST',
        headers: {
          Authorization: 'bearer ' + token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query: `query { project(id: "${projectId}") { data { attributes { ${parts.join('\n')} } } } }` })
      });
      const json = await res.json();
      const projAttrs = json?.data?.project?.data?.attributes;

      const newOmi = projAttrs?.extraOm?.data ?? [];
      const newPmi = projAttrs?.extraPendm?.data ?? [];
      
      chainExtraOmiData = newOmi;
      chainExtraPmiData = newPmi;

      try {
        localStorage.setItem(
          cacheKey,
          JSON.stringify({ ts: Date.now(), o: newOmi, p: newPmi })
        );
      } catch {
        /* quota exceeded */
      }
    } catch (e) {
      console.error('fetchChainExtraData failed', e);
    } finally {
      chainExtraLoading = false;
    }
  }

  onMount(async () => {
    const promises = [];
    if (!moachStore.isDataFresh(projectId, 'missions')) {
      promises.push(sendToSer({ pid: projectId }, 'getProjectMissions', null, null, false, fetch).then(res => {
        if (res?.data?.project?.data?.attributes) moachStore.updateProjectData(projectId, 'missions', res.data.project.data.attributes);
      }));
    }
    if (!moachStore.isDataFresh(projectId, 'financials')) {
      promises.push(sendToSer({ pid: projectId }, 'getProjectFinancials', null, null, false, fetch).then(res => {
        if (res?.data?.project?.data?.attributes) moachStore.updateProjectData(projectId, 'financials', res.data.project.data.attributes);
      }));
    }

    if (promises.length > 0) {
      loading = true;
      await Promise.all(promises);
      loading = false;
    }
  });

  $effect(() => {
    if (missions && !loading && base) {
      untrack(() => fetchChainExtraData());
    }
  });

  function handleOpenModal(e) {
    moachStore.openModal(e.kind, e.id);
  }

  function handleOpenActModal(act) {
    moachStore.openActModal(act);
  }

  function handleOpenChat(id) {
    console.log('Open chat', id);
  }
</script>

<div class="chains-page p-4">
  {#if loading && (!missions || !financials)}
    <div class="flex justify-center p-12">
      <Lowding />
    </div>
  {:else if missions && financials}
    <ProcessChainView
      pmiData={[...(missions.pendms?.data || []), ...chainExtraArchivePm]}
      omiData={missions.open_missions?.data || []}
      bmiData={[...(missions.mesimabetahaliches?.data || []), ...chainExtraArchiveBmi]}
      fmiData={financials.finnished_missions?.data || []}
      opmash={chainExtraOpmashData}
      rikmashes={financials.rikmashes?.data || []}
      acts={base?.acts?.data ?? []}
      extraOmiData={chainExtraOmiData}
      extraPmiData={chainExtraPmiData}
      isLoadingExtra={chainExtraLoading}
      {projectId}
      projectUsers={base?.user_1s?.data || []}
      onOpenModal={handleOpenModal}
      onOpenActModal={handleOpenActModal}
      onOpenChat={handleOpenChat}
      lang={$lang}
    />
  {/if}
</div>
