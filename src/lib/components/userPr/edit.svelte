<script>
  import Tile from '$lib/celim/tile.svelte';
  import { crossfade } from 'svelte/transition';
  import { quintOut } from 'svelte/easing';

  const [send, receive] = crossfade({
    duration: 1500,
    easing: quintOut
  });
  import Grow from '$lib/celim/icons/grow.svelte';
  import { lang } from '$lib/stores/lang.js';
  // import AddSkil from './addSkil.svelte';
  import { skillsNew } from '../../stores/skillsNew.js';
  import MultiSelect from 'svelte-multiselect';
  import SkillSelector from '../ui/SkillSelector.svelte';
  import ValueSelector from '../ui/ValueSelector.svelte';
  import RoleSelector from '../ui/RoleSelector.svelte';
  import WorkwaySelector from '../ui/WorkwaySelector.svelte';
  import { skil, role, valluesStore, ww } from '$lib/components/prPr/mi.js';
  import Addnewv from '../addnew/addnewval.svelte';
  import Addnewr from '../addnew/addNewRole.svelte';
  import Addnewn from '../addnew/addNewNeed.svelte';
  import Newsp from './newsp.svelte';
  import Edsp from './editsp.svelte';
  import Button from '$lib/celim/ui/button.svelte';

  import { slide, fly } from 'svelte/transition';
  import { executeAction } from '$lib/client/actionClient';
  import { sendToSer } from '$lib/send/sendToSer.js';

  let newskillslist;

  //for the options of multiselect
  let allvn = $state([]);
  let listt = [];
  let error1 = null;
  async function get() {
    try {
      const result = await executeAction('loadCatalog', { linkp, lang: $lang });
      if (!result.success) { console.log('loadCatalog error:', result.error); return; }
      meData = result.data;
      if ($lang !== 'en') {
        for (let i = 0; i < meData.length; i++) {
          if (meData[i].attributes.localizations?.data?.length > 0) {
            meData[i].attributes[valc] = meData[i].attributes.localizations.data[0].attributes[valc];
          }
        }
      }
      meData = meData;
      allvn = meData.map((c) => c.attributes[valc]);
      newcontent = false;
    } catch (e) {
      error1 = e;
      console.log(error1);
    }
  }

  skillsNew.subscribe((newwork) => {
    newskillslist = newwork;
  });
  /*
function deleteitem (skillId){
  console.log(skillId);
    const index = skillslist.indexOf(skillId);
if (index > -1) {
  skillslist.splice(index, 1);
  };
console.log("skillslist",skillslist);
};    */
  let g = $state(false);
  let needr = $state([]);

  async function increment() {
    g = true;
    if (datan !== 'mash') {
      const ids = data.map((c) => String(c.id));
      try {
        const result = await executeAction('updateUserRelation', { kish, ids });
        if (!result.success) { error1 = result.error; g = false; return; }
        let updatedList = result.data.attributes[kish].data;
        if ($lang !== 'en') {
          for (let i = 0; i < updatedList.length; i++) {
            if (updatedList[i].attributes.localizations?.data?.length > 0) {
              updatedList[i].attributes[valc] = updatedList[i].attributes.localizations.data[0].attributes[valc];
            }
          }
        }
        addSl = false;
        yy = 0;
        onClose?.({ linkp, list: updatedList });
        g = false;
      } catch (e) {
        error1 = e;
      }
    } else {
      g = false;
    }
  }

  import { RingLoader } from 'svelte-loading-spinners';
  let yy = $state(0);
  $effect(() => {
    console.log(yy, 'yy');
  });
  function find_id(arra) {
    var arr = [];
    const baseSource =
      datan === 'skil'
        ? $skil
        : datan === 'val'
          ? $valluesStore
          : datan === 'taf'
            ? $role
            : datan === 'work'
              ? $ww
              : meData;
    // Combine with current data to ensure we don't lose items already in sync
    const sourceData = [...baseSource, ...data];
    const nameField =
      datan === 'skil'
        ? 'skillName'
        : datan === 'val'
          ? 'valueName'
          : datan === 'work'
            ? 'workWayName'
            : valc;

    for (let j = 0; j < arra.length; j++) {
      const searchName = arra[j];
      let foundId = null;

      for (let i = 0; i < sourceData.length; i++) {
        if (!sourceData[i].attributes) continue;
        let name = sourceData[i].attributes[nameField];
        let heName = name;

        // Check localizations if available (selector-backed catalogs carry he
        // localizations, and the selectors emit the localized name in Hebrew)
        if (
          (datan === 'skil' || datan === 'val' || datan === 'taf' || datan === 'work') &&
          sourceData[i].attributes.localizations?.data?.length > 0
        ) {
          heName =
            sourceData[i].attributes.localizations.data[0].attributes[
              nameField
            ];
        }

        if (name === searchName || heName === searchName) {
          foundId = sourceData[i].id;
          break;
        }
      }

      if (foundId) {
        arr.push(foundId);
      }
    }
    return arr;
  }
  function find_name(arra) {
    var arr = [];
    for (let j = 0; j < arra.length; j++) {
      for (let i = 0; i < meData.length; i++) {
        if (meData[i].id === arra[j]) {
          arr.push(meData[i].attributes[valc]);
        }
      }
    }
    return arr;
  }

  const filterByReference = (allob, id) => {
    let res = [];
    res = allob.filter((el) => {
      return id.some((element) => {
        return String(element) === String(el.id);
      });
    });
    return res;
  };

  // Resolved catalog objects keep the DEFAULT-locale name in their name field
  // (Hebrew lives only in `localizations`). When displaying in Hebrew we must
  // surface the localized name in the display field too — otherwise the tiles
  // and the re-seeded dropdown labels show English, and the English label then
  // makes find_id resolve a re-picked Hebrew item to the same id (collapsing
  // the list). Shallow-copy so the shared store is never mutated.
  function localizeObjects(objs, nameField) {
    if ($lang !== 'he') return objs;
    return objs.map((o) => {
      const loc = o?.attributes?.localizations?.data?.[0]?.attributes?.[nameField];
      return loc
        ? { ...o, attributes: { ...o.attributes, [nameField]: loc } }
        : o;
    });
  }

  function handleAdd() {
    console.log(data);
    if (datan !== 'mash') {
      addSK(data.selected2);
    }
  }

  function addSK(id) {
    if (datan !== 'mash') {
      yy = 1;
      console.log(data);
      listt = data;
      const oldob = data;
      const old = oldob.map((c) => c.id); //.map(String)
      const neww = find_id(id);
      let array3 = old.concat(neww);
      array3 = [...new Set([...old, ...neww])];

      const sourceData = datan === 'skil' ? $skil : meData;
      const resp = filterByReference(sourceData, array3);
      const datana = resp;
      onAdd?.({
        data: datana,
        linkp: kish,
        valc: valc,
        a: datan
      });
    }
  }

  function adm(id) {
    if (datan === 'mash' && id.length > 0) {
      const neww = find_id(id);
      needr = neww;
      updi();
    }
  }

  function min(id, nj) {
    if (datan !== 'mash') {
      yy = 2;
      listt = data;
      const oldob = data;
      const x = oldob.map((c) => c.id);
      const indexy = x.indexOf(id);
      oldob.splice(indexy, 1);

      onRemove?.({
        data: oldob,
        linkp: kish
      });
    } else if (datan === 'mash') {
      onDelm?.({
        id: id,
        nj: nj
      });
    }
  }

  function open() {
    //if there is no already , but to check changes
    // Reset per-session edit state. `yy` drives the save button AND the
    // close/cancel path, and this component instance is reused across edit
    // sessions (only its view toggles). A stale `yy` from a previous *saved*
    // session makes the editor think there are unsaved changes and, on close,
    // send a stale/empty list — which wiped the whole relation. Always start
    // each session at yy=0 with listt snapshotting the current items.
    yy = 0;
    listt = data;
    get();
    onOpen?.({
      linkp: linkp
    });
  }

  function bitul() {
    // Close the inline editor preserving whatever is currently selected. Adds
    // and removes are already applied live to the parent during editing, so
    // "close" keeps the current list. Never fall back to a stale/empty `listt`
    // snapshot (that emptied the relation when yy was left non-zero).
    const list = Array.isArray(data) ? data : listt;
    onClose?.({
      linkp: linkp,
      list
    });
  }

  function addnewM(event) {
    const id = event.id;
    const skob = event.skob;

    // Add new mashaabim to catalog so find_id can resolve it
    meData = [...meData, skob];
    allvn = meData.map((c) => c.attributes[valc]);

    // Add new name to selection
    if (!data.selected2) data.selected2 = [];
    data.selected2 = [...data.selected2, event.name];

    needr = [...new Set([...needr, String(id)])];

    updi();
  }

  function addnew(event) {
    yy = 3;
    listt = data;
    const id = event.id;
    const oldob = data;
    const old = oldob.map((c) => c.id);
    const newi = [id];
    let array3 = old.concat(newi);
    array3 = [...new Set([...old, ...newi])];
    const skob = event.skob;
    addS = false;
    addR = false;
    addW = false;

    onAddnew?.({
      id: array3,
      data: data,
      skob: skob,
      linkp: kish
    });
  }
  let meDatamm = $state([]);
  function bitulm() {
    masss = false;
    onMassss?.({
      mass: false
    });
    needr = [];
    data.selected2 = [];
    meDatamm = [];
  }
  async function updi() {
    try {
      const result = await sendToSer({ ids: needr }, '205getMashaabimsByIds', 0, 0, false, fetch);
      meDatamm = result.data?.mashaabims?.data ?? [];
      g = false;
      masss = true;
      onMassss?.({ mass: true });
    } catch (e) {
      console.log(e);
    }
  }
  function clodd(event) {
    const id = event.id;
    const name = event.name;
    const skob = event.skob;
    const oldob = data;
    const x = oldob.map((c) => c.id);
    const indexy = x.indexOf(id);
    oldob.splice(indexy, 1);
    data.push(skob);
    data = data;
    console.log(id);
    masss = false;
    addSl = false;
    onClose?.({
      linkp: linkp,
      list: data
    });
    onMassss?.({
      mass: false
    });
  }

  function clohh(event) {
    const id = event.id;
    const name = event.name;
    const skob = event.skob;
    const oldob = data;
    const old = oldob.map((c) => c.id).map(String);
    const neww = find_id(id);
    let array3 = old.concat(neww);
    array3 = [...new Set([...old, ...neww])];

    const resp = filterByReference(meData, array3);
    const datana = resp;

    // Snapshot the full list BEFORE onAdd can reset the parent binding
    const listWithNew = [...data, skob];

    onAdd?.({
      data: datana,
      linkp: kish,
      valc: valc,
      a: datan
    });

    console.log(id);
    masss = false;
    addSl = false;
    onClose?.({
      linkp: linkp,
      list: listWithNew
    });
    onMassss?.({
      mass: false
    });
  }
  async function wdwd(event) {
    const miDatanew = event.data;
    const y = miDatanew.map((c) => c.id);
    const id = event.id;
    const index = y.indexOf(id);
    if (index > -1) {
      miDatanew.splice(index, 1);
    }
    if (miDatanew.length > 0) {
      masss = false;
      meDatamm = miDatanew;
      needr = meDatamm.map((c) => c.id);
      const old = data.selected2;
      const tor = find_name(event.id);
      const indexd = old.indexOf(tor);
      if (index > -1) {
        old.splice(indexd, 1);
      }
      data.selected2 = old;
      masss = true;
    } else {
      masss = false;
      onMassss?.({
        mass: false
      });
    }
  }
  let newcontent = $state(true);
  let xd = $state([]);
  let ed = $state(false);
  async function edit(id) {
    g = true;
    console.log(id);
    try {
      const result = await sendToSer({ spId: id }, '257getSpForEditWithOffer', 0, 0, false, fetch);
      xd = result.data?.sp?.data;
      const meId = result.data?.me?.id;
      console.log(result);
      if ((xd.attributes.users_permissions_user.data.id = meId)) {
        console.log(xd);
        ed = true;
        g = false;
        masss = true;
        onMassss?.({ mass: true });
      }
    } catch (e) {
      error1 = e;
      console.log(error1);
    }
  }
  //style="margin:auto; overflow:auto;"
  const cencel = { he: 'ביטול', en: 'cencel' };
  const less = { he: 'הסרה', en: 'remove' };
  const bef = { he: 'ה', en: 'My ' };
  const aft = { he: ' שלי', en: '' };
  const edito = { he: 'עריכה', en: 'edit' };
  const edbef = { he: 'עריכת ה', en: 'edit My ' };
  const edaft = { he: ' שלי ', en: '' };
  const save = { he: 'שמירה', en: 'save' };
  const rem = { he: 'הסרת ', en: 'remove ' };
  const adbf = { he: ' בחירת ', en: 'choose more ' };
  const adaf = { he: ' נוספים', en: '' };
  const om = { he: 'רק רגע בבקשה', en: 'one moment please' };
  const onin = { he: 'מושקע בריקמה', en: 'invested on FreeMates' };
  //add new msg
  let searchText = $state(``);

  let addn = $derived({
    he: ` \"${searchText}\" לא קיים עדיין ברשימה, ניתן להוסיף בלחיצה על כפתור  \"הוספת חדש\" שלמטה`,
    en: `\"${searchText}\" Not on the list yet , add it with the \"Add new\" button bellow`
  });

  /**
   * @typedef {Object} Props
   * @property {string} [bgi] - export let addNs;
   * @property {string} [valc]
   * @property {any} [data]
   * @property {any} [meData]
   * @property {string} [datan]
   * @property {boolean} [addS]
   * @property {any} kish
   * @property {string} [linkp]
   * @property {boolean} [addSl]
   * @property {string} [placeholder]
   * @property {string} [Valname]
   * @property {boolean} [masss]
   * @property {boolean} [addR]
   * @property {boolean} [addW]
   * @property {number} [width]
   * @property {(payload: { linkp: any, list: any[] }) => void} [onClose]
   * @property {(payload: { data: any[], linkp: any, valc: any, a: any }) => void} [onAdd]
   * @property {(payload: { id: any, nj: any }) => void} [onDelm]
   * @property {(payload: { data: any[], linkp: any }) => void} [onRemove]
   * @property {(payload: { linkp: any }) => void} [onOpen]
   * @property {(payload: { mass: boolean }) => void} [onMassss]
   * @property {(payload: { id: any[], data: any[], skob: any, linkp: any }) => void} [onAddnew]
   */

  /** @type {Props} */
  let {
    bgi = 'wow',
    valc = 'skillName',
    data = $bindable([]),
    meData = $bindable([]),
    datan = '',
    kish,
    linkp = 'skills',
    addSl = $bindable(false),
    placeholder = ' בחירת כישורים',
    Valname = 'כישורים',
    masss = $bindable(false),
    width = 1,
    onClose,
    onAdd,
    onDelm,
    onRemove,
    onOpen,
    onMassss,
    onAddnew
  } = $props();

  let addS = $state(false);
  let addR = $state(false);
  let addW = $state(false);

  $effect(() => {
    if (
      data &&
      (data.selected2 === undefined ||
        (data.length > 0 && data.selected2.length === 0))
    ) {
      if ((datan === 'skil' || datan === 'taf' || datan === 'work') && data.length > 0) {
        data.selected2 = data.map(
          (d) =>
            d.attributes[valc] ||
            d.attributes.skillName ||
            d.attributes.roleDescription ||
            d.attributes.workWayName
        );
      } else if (datan === 'val' && data.length > 0) {
        data.selected2 = data.map(
          (d) => d.attributes[valc] || d.attributes.valueName
        );
      } else if (data.selected2 === undefined) {
        data.selected2 = [];
      }
    }
  });

  $effect(() => {
    if (datan === 'val' && data.selected2 && $valluesStore) {
      const labels = data.selected2;
      const ids = find_id(labels);

      if (ids.length < labels.length) return;

      const existingIds = data.map((d) => String(d.id)).sort();
      const targetIds = [...new Set(ids.map((id) => String(id)))].sort();

      if (JSON.stringify(existingIds) !== JSON.stringify(targetIds)) {
        const deduplicatedSource = Array.from(
          new Map(
            [...$valluesStore, ...data].map((item) => [String(item.id), item])
          ).values()
        );
        const objects = localizeObjects(
          filterByReference(deduplicatedSource, ids),
          valc
        );
        onAdd?.({
          data: objects,
          linkp: kish,
          valc: valc,
          a: datan
        });
      }
    }
  });

  let filteredAllvn = $derived(
    allvn.filter((v) => !data.some((d) => d.attributes[valc] === v))
  );

  let anim = $derived(
    datan == 'work' || datan == 'val' ? -(width / 2) : width / 2
  );
  $effect(() => {
    if (datan === 'skil' && data.selected2 && $skil) {
      const labels = data.selected2;
      const ids = find_id(labels);

      // Only sync if we found IDs for ALL selected labels.
      // This prevents mass removal while new skills are being created.
      if (ids.length < labels.length) return;

      // Only sync if they represent a different set of IDs than what we currently have
      const existingIds = data.map((d) => String(d.id)).sort();
      const targetIds = [...new Set(ids.map((id) => String(id)))].sort();

      if (JSON.stringify(existingIds) !== JSON.stringify(targetIds)) {
        // Deduplicate source data to prevent duplicate keys in the UI
        const deduplicatedSource = Array.from(
          new Map(
            [...$skil, ...data].map((item) => [String(item.id), item])
          ).values()
        );
        const objects = localizeObjects(
          filterByReference(deduplicatedSource, ids),
          valc
        );
        onAdd?.({
          data: objects,
          linkp: kish,
          valc: valc,
          a: datan
        });
      }
    }
  });

  $effect(() => {
    if (datan === 'taf' && data.selected2 && $role) {
      const labels = data.selected2;
      const ids = find_id(labels);

      if (ids.length < labels.length) return;

      const existingIds = data.map((d) => String(d.id)).sort();
      const targetIds = [...new Set(ids.map((id) => String(id)))].sort();

      if (JSON.stringify(existingIds) !== JSON.stringify(targetIds)) {
        const deduplicatedSource = Array.from(
          new Map(
            [...$role, ...data].map((item) => [String(item.id), item])
          ).values()
        );
        const objects = localizeObjects(
          filterByReference(deduplicatedSource, ids),
          valc
        );
        onAdd?.({
          data: objects,
          linkp: kish,
          valc: valc,
          a: datan
        });
      }
    }
  });

  $effect(() => {
    if (datan === 'work' && data.selected2 && $ww) {
      const labels = data.selected2;
      const ids = find_id(labels);

      if (ids.length < labels.length) return;

      const existingIds = data.map((d) => String(d.id)).sort();
      const targetIds = [...new Set(ids.map((id) => String(id)))].sort();

      if (JSON.stringify(existingIds) !== JSON.stringify(targetIds)) {
        const deduplicatedSource = Array.from(
          new Map(
            [...$ww, ...data].map((item) => [String(item.id), item])
          ).values()
        );
        const objects = localizeObjects(
          filterByReference(deduplicatedSource, ids),
          valc
        );
        onAdd?.({
          data: objects,
          linkp: kish,
          valc: valc,
          a: datan
        });
      }
    }
  });
</script>

{#if masss === true}
  <div class="grid items-center align-center justify-center">
    <button
      class=" hover:bg-barbi text-gold font-bold rounded-full"
      style="width:24px; height:24px; margin: 0 auto;"
      title={cencel[$lang]}
      onclick={bitulm}
      ><svg style="width:24px; height:24px;" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41"
        />
      </svg></button
    >
    {#if ed === false}
      <Newsp {needr} meData={meDatamm} onClose={clohh} onRemove={wdwd} />
    {:else if ed === true}
      <Edsp meData={xd} onClose={clodd} />
    {/if}
  </div>
{:else if addSl == false}
  <div
    class="another"
    style="margin: auto"
    in:fly={{ x: anim, duration: 1500 }}
    out:fly={{ x: anim - width / 5, y: -100, duration: 1500, opacity: 0.5 }}
  >
    <h2
      style="font-weight: 400;  color: var(--barbi-pink); text-shadow: 1px 1px #feeb02 ; "
      class="th"
    >
      {bef[$lang]}{Valname}{aft[$lang]}
    </h2>
    {#if data.length > 0}
      <div
        class="flex sm:flex-row flex-wrap justify-center align-middle inner-scroll d cd p-2 mb-1"
      >
        {#each data as dat, i}
          <p class="m-0" style="text-shadow:none; white-space:none;">
            <Tile
              big={width > 640}
              sm={width > 640}
              bg={bgi}
              gr={datan === 'mash' && dat.attributes.panui === false
                ? true
                : false}
              word={dat.attributes[valc]}
            />
          </p>{/each}
      </div>
    {/if}

    <!--
        מובייל , רקמות? להוסיף חץ כאייקון? צבע שונה לכל דבר??
          {#if data} <span class="d"> {#each data as dat, i}
           <p style="margin: 0; line-height: 1;  padding: auto;" class="t">{dat[valc]}</p>
           {/each} </span>{/if}-->
    <button
      class=" hover:bg-barbi text-mturk rounded-full h-6 w-6"
      title={edito[$lang]}
      onclick={open}
      ><svg class="e" viewBox="0 0 24 24">
        <path
          fill="currentColor"
          d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12H20A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4V2M18.78,3C18.61,3 18.43,3.07 18.3,3.2L17.08,4.41L19.58,6.91L20.8,5.7C21.06,5.44 21.06,5 20.8,4.75L19.25,3.2C19.12,3.07 18.95,3 18.78,3M16.37,5.12L9,12.5V15H11.5L18.87,7.62L16.37,5.12Z"
        />
      </svg>
    </button>
  </div>
{:else if addSl == true}
  {#if g == false}
    <div>
      <button
        class=" hover:bg-barbi text-gold font-bold rounded-full"
        title={cencel[$lang]}
        onclick={bitul}
        ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M8.27,3L3,8.27V15.73L8.27,21H15.73L21,15.73V8.27L15.73,3M8.41,7L12,10.59L15.59,7L17,8.41L13.41,12L17,15.59L15.59,17L12,13.41L8.41,17L7,15.59L10.59,12L7,8.41"
          />
        </svg></button
      >

      <p class="text-center text-md text-white">
        {edbef[$lang]}{Valname}{edaft[$lang]}
      </p>
      {#if data.length > 0}
        <div
          class="  flex sm:flex-row flex-wrap justify-center align-middle d cd p-2 mb-1"
        >
          {#each data as da, i (da.id)}
            <div
              transition:slide|local={{
                delay: 150,
                duration: 1000,
                easing: quintOut
              }}
            >
              {#if datan === 'mash'}
                <Tile
                  big={width > 640}
                  sm={width > 640}
                  bg={bgi}
                  gr={datan === 'mash' && da.attributes.panui === false
                    ? true
                    : false}
                  word={da.attributes[valc]}
                >
                  {#if da.attributes.panui != false}
                    <button
                      class="text-barbi hover:text-red-700"
                      title={less[$lang]}
                      onclick={() => min(da.id, da.attributes[valc])}
                      aria-label={less[$lang]}
                      ><svg style="width:17px;height:17px" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M17,13H7V11H17M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z"
                        />
                      </svg></button
                    >
                    <button
                      class=" hover:bg-gold text-barbi rounded-full"
                      title={edito[$lang]}
                      onclick={() => edit(da.id)}
                      aria-label={edito[$lang]}
                      ><svg style="width:17px;height:17px" viewBox="0 0 24 24">
                        <path
                          fill="currentColor"
                          d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12H20A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4V2M18.78,3C18.61,3 18.43,3.07 18.3,3.2L17.08,4.41L19.58,6.91L20.8,5.7C21.06,5.44 21.06,5 20.8,4.75L19.25,3.2C19.12,3.07 18.95,3 18.78,3M16.37,5.12L9,12.5V15H11.5L18.87,7.62L16.37,5.12Z"
                        />
                      </svg>
                    </button>
                  {:else}
                    <button
                      class=" hover:bg-barbi text-barbi rounded-full"
                      title={onin[$lang]}
                      aria-label={onin[$lang]}
                    >
                      <Grow width={17} height={17} /></button
                    >
                  {/if}
                </Tile>
              {:else if datan !== 'skil' && datan !== 'taf' && datan !== 'val' && datan !== 'work'}
                <div
                  class="text-center text-sm text-lturk md:text-xl"
                  title={less[$lang]}
                  onclick={() => min(da.id, da.attributes[valc])}
                >
                  <Tile
                    big={width > 640}
                    sm={width > 640}
                    bg={bgi}
                    closei={true}
                    closeiline={false}
                    gr={datan === 'mash' && da.attributes.panui === false
                      ? true
                      : false}
                    word={da.attributes[valc]}
                  />
                </div>
              {/if}
            </div>
          {/each}
        </div>
        {#if datan === 'mash' && yy == 2}
          <button
            onclick={increment}
            title="{rem[$lang]}{Valname} "
            class="bt hover:bg-barbi text-gold hover:text-mturk font-bold py-1 px-2 m-4 rounded-full hover:scale-150"
            aria-label="{rem[$lang]}{Valname}"
            ><svg style="width:24px;height:24px" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M14.3 21.7C13.6 21.9 12.8 22 12 22C6.5 22 2 17.5 2 12S6.5 2 12 2C13.3 2 14.6 2.3 15.8 2.7L14.2 4.3C13.5 4.1 12.8 4 12 4C7.6 4 4 7.6 4 12S7.6 20 12 20C12.4 20 12.9 20 13.3 19.9C13.5 20.6 13.9 21.2 14.3 21.7M7.9 10.1L6.5 11.5L11 16L21 6L19.6 4.6L11 13.2L7.9 10.1M18 14V17H15V19H18V22H20V19H23V17H20V14H18Z"
              />
            </svg>
          </button>
        {/if}
      {/if}
      <br />
      {#if datan != 'skil' && datan != 'val' && datan != 'taf' && datan != 'work'}
        <div>
          <h3 class="text-center text-sm text-barbi">
            {adbf[$lang]}{Valname}{adaf[$lang]}
          </h3>
          <div class="flex justify-center">
            <MultiSelect
              bind:selected={data.selected2}
              outerDivClass="!bg-gold !text-barbi"
              inputClass="!bg-gold !text-barbi"
              liSelectedClass="!bg-barbi !text-gold"
              bind:searchText
              noMatchingOptionsMsg={addn[$lang]}
              {placeholder}
              options={filteredAllvn}
              --sms-width={'200px'}
              loading={newcontent}
              onadd={handleAdd}
            />
          </div>
        </div>
        <!--      allowUserOptions={"append"}-->
      {/if}
      {#if datan == 'skil'}
        <SkillSelector
          bind:selectedSkills={data.selected2}
          onadd={() => {
            yy = 1;
          }}
          onremove={() => {
            yy = 2;
          }}
          {placeholder}
          autoCreate={true}
        />
      {:else if datan == 'val'}
        <ValueSelector
          bind:selectedValues={data.selected2}
          onadd={() => {
            yy = 1;
          }}
          onremove={() => {
            yy = 2;
          }}
          {placeholder}
          autoCreate={true}
        />
      {:else if datan == 'taf'}
        <RoleSelector
          bind:selectedRoles={data.selected2}
          onadd={() => {
            yy = 1;
          }}
          onremove={() => {
            yy = 2;
          }}
          {placeholder}
          autoCreate={true}
        />
      {:else if datan == 'work'}
        <WorkwaySelector
          bind:selectedWorkways={data.selected2}
          onadd={() => {
            yy = 1;
          }}
          onremove={() => {
            yy = 2;
          }}
          {placeholder}
          autoCreate={true}
        />
      {:else if datan == 'mash'}
        <Addnewn rr={13} onNewn={addnewM} bind:addW />
      {/if}
    </div>
    <br />
    {#if datan === 'mash' && data?.selected2?.length > 0}
      <Button onClick={() => adm(data.selected2)} text={save} aria-label={save}
        >✅</Button
      >
    {/if}
    {#if datan !== 'mash' && yy > 0}
      <Button
        variant="default"
        size="default"
        text={save}
        aria-label={save}
        onClick={increment}
        loading={g}
      >
        <svg style="width:24px;height:24px" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M14.3 21.7C13.6 21.9 12.8 22 12 22C6.5 22 2 17.5 2 12S6.5 2 12 2C13.3 2 14.6 2.3 15.8 2.7L14.2 4.3C13.5 4.1 12.8 4 12 4C7.6 4 4 7.6 4 12S7.6 20 12 20C12.4 20 12.9 20 13.3 19.9C13.5 20.6 13.9 21.2 14.3 21.7M7.9 10.1L6.5 11.5L11 16L21 6L19.6 4.6L11 13.2L7.9 10.1M18 14V17H15V19H18V22H20V19H23V17H20V14H18Z"
          />
        </svg>
      </Button>
    {/if}
  {:else if g == true}
    <div class="sp">
      <h3 class="text-barbi">{om[$lang]}</h3>
      <br />
      <RingLoader size="260" color="#ff00ae" unit="px" duration="2s"
      ></RingLoader>
    </div>
  {/if}
{/if}

<style>
  .bt {
    animation: changeColor 2s infinite ease;
  }
  .bt:hover {
    animation: changeColors 2s infinite ease;
  }
  @keyframes changeColor {
    from {
      color: var(--gold);
    }
    to {
      color: var(--barbi-pink);
    }
  }
  @keyframes changeColors {
    from {
      color: var(--gold);
    }
    to {
      color: aqua;
    }
  }
  @media (max-width: 528px) {
    .th {
      font-size: 12px;
    }
    .t {
      font-size: 13px;
    }

    .another {
      max-height: 20vh;
      min-height: 20vh;
      width: 27vw;
    }
    .e {
      width: 17px;
      height: 17px;
    }

    .e {
      width: 24px;
      height: 24px;
    }
  }
  .another {
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
  }

  :global(.dark) .another {
    background: rgba(15, 23, 42, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .another {
    text-shadow: 1px 1px aqua;
    padding: 0.6em;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
    text-align: center;
    max-height: 28vh;
    max-width: 37vw;
    min-width: 27vw;
    color: #9900cd;
    overflow: visible;
  }

  .inner-scroll {
    max-height: 20vh;
    width: 100%;
    overflow-y: auto;
  }
  .th {
    margin-top: 0.2em;
    margin-bottom: 0.2em;
    line-height: 1.1;
  }
  @media (min-width: 528px) {
    .another {
      max-width: 25vw;
    }
  }
</style>
