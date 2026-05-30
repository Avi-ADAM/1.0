<script>
  import Tile from '$lib/celim/tile.svelte';
  import { lang } from '$lib/stores/lang.js';
  import { t } from '$lib/translations';
  import { onMount } from 'svelte';

  let fir = $t('lev.cards.filter.heartDesc');
  let u = $t('lev.cards.filter.heartDesc');

  let sugg = 'sugg';
  let pend = 'pend';
  let asks = 'asks';
  let welc = 'welc';
  let betaha = 'betaha';
  let desi = 'desi';
  let fiap = 'fiap';
  let ppmash = 'ppmash';
  let pmashs = 'pmashs';
  let pmaap = 'pmaap';
  let askmap = 'askmap';
  let sheirutp = 'sheirutp';
  let purchases = 'purchases';
  let hachla = 'hachla';
  let selectedProjectName = $state(null);
  // נאחסן את כל המצבים באובייקט אחד
  let states = $state({
    sugg,
    pend,
    asks,
    welc,
    betaha,
    desi,
    fiap,
    ppmash,
    pmashs,
    pmaap,
    askmap,
    sheirutp,
    purchases,
    hachla
  });
  onMount(async () => {
    if (filterKind === 'projects') {
      const colors = [
        'blue',
        'green',
        'yellow',
        'indigo',
        'purple',
        'pink',
        'gold',
        'neww',
        'wow',
        'red',
        'gray'
      ];
      milon = [];
      for (let i = 0; i < allIds.length; i++) {
        milon.push({
          id: allIds[i].projectId,
          name: allIds[i].projectName,
          val: true,
          color: colors[i % colors.length],
          word: {
            he: `${allIds[i].projectName} - (${allIds[i].count})`,
            en: `${allIds[i].projectName} - (${allIds[i].count})`
          }
        });
      }
      milon = milon;
      console.log(milon, 'milon');
    }
  });
  function showonly(value, id = null) {
    if (filterKind === 'projects') {
      if (selectedProjectName === value) {
        selectedProjectName = null;
        onShowall?.();
      } else {
        selectedProjectName = value;
        onShowonly?.({ data: value, kind: filterKind, id: id });
      }
    } else {
      if (value !== 'true') {
        onShowonly?.({
          data: value,
          kind: filterKind,
          id: id
        });

        // נאפס את כל הערכים
        Object.keys(states).forEach((key) => {
          states[key] = key;
        });

        // נעדכן את הערך הספציפי
        states[value] = 'true';
      } else {
        onShowall?.();
        // נאפס את כל הערכים
        Object.keys(states).forEach((key) => {
          states[key] = key;
        });
      }
    }
  }

  let hovere = false;

  function hover(event) {
    const num = event.id;
    hovere = !hovere;
    if (hovere === true) {
      if (num === 'a') {
        fir = $t('lev.cards.filter.showSuggestions');
      } else if (num === 'b') {
        fir = $t('lev.cards.filter.showVotes');
      } else if (num === 'c') {
        fir = $t('lev.cards.filter.showJoinRequests');
      } else if (num === 'd') {
        fir = $t('lev.cards.filter.showSplitRequests');
      } else if (num === 'e') {
        fir = $t('lev.cards.filter.showInProgress');
      } else if (num === 'f') {
        fir = $t('lev.cards.filter.showWelcome');
      } else if (num === 'g') {
        fir = $t('lev.cards.filter.showCompletionApproval');
      } else if (num === 'h') {
        fir = $t('lev.cards.filter.personalDashboard');
      } else if (num === 'q') {
        fir = $t('lev.cards.filter.showResourceApproval');
      } else if (num === 'j') {
        fir = $t('lev.cards.filter.showResourceInvestment');
      } else if (num === 'y') {
        fir = $t('lev.cards.filter.showResourceVotes');
      } else if (num === 'x') {
        fir = $t('lev.cards.filter.showJoinAndInvest');
      } else if (num === 'u') {
        fir = $t('lev.cards.filter.showMyPurchases');
      }
    } else {
      fir = $t('lev.cards.filter.heartDesc');
    }
    onHover?.({ id: fir });
  }

  /**
   * @typedef {Object} Props
   * @property {any} [allIds]
   * @property {string} [filterKind]
   * @property {number} [sug]
   * @property {number} [pen]
   * @property {number} [ask]
   * @property {number} [wel]
   * @property {number} [beta]
   * @property {number} [des]
   * @property {number} [fia]
   * @property {number} [pmash]
   * @property {number} [mashs]
   * @property {number} [maap]
   * @property {number} [askma]
   * @property {number} [hachlot]
   * @property {boolean} [low]
   * @property {(payload: { id: any }) => void} [onHover] - Callback for hover event
   * @property {(payload: { data: any, kind: string, id: any }) => void} [onShowonly] - Callback for showonly event
   * @property {() => void} [onShowall] - Callback for showall event
   */

  /** @type {Props} */
  let {
    allIds = [],
    filterKind = 'projects',
    sug = 13,
    pen = 13,
    ask = 17,
    wel = 17,
    beta = 13,
    des = 13,
    fia = 99,
    pmash = 99,
    mashs = 17,
    maap = 17,
    askma = 13,
    hachlot = 9,
    sheirutps = 13,
    purchasesn = 0,
    low = true,
    onHover,
    onShowonly,
    onShowall
  } = $props();
  let hovered = false;
  function hoverede(x) {
    let tLabel = $t('lev.cards.filter.heartTitle');
    if (x == 'x') {
      tLabel = $t('lev.cards.filter.switchView');
    }
    hovered = !hovered;
    if (hovered == false) {
      u = tLabel;
    } else {
      u = $t('lev.cards.filter.heartDesc');
    }
    onHover?.({ id: u });
  }
  $effect(() => {
    console.log('milon', milon);
  });
  //{name:"welc",val:true,color:"gray"},
  let milon = $state([
    {
      name: 'fiap',
      val: true,
      color: 'blue',
      word: {
        he: `אשרורי סיום (${fia})`,
        en: `Mission Completion Approvals (${fia})`
      }
    },
    {
      name: 'sugg',
      val: true,
      color: 'green',
      word: { he: `הצעות למשימות (${sug})`, en: `Mission Proposals (${sug})` }
    },
    {
      name: 'pend',
      val: true,
      color: 'yellow',
      word: {
        he: `משימות בתהליך אישור (${pen})`,
        en: `Missions Pending Approval (${pen})`
      }
    },
    {
      name: 'asks',
      val: true,
      color: 'indigo',
      word: {
        he: `אישורי השמה למשימות (${ask})`,
        en: `Mission Assignment Approvals (${ask})`
      }
    },
    {
      name: 'betaha',
      val: true,
      color: 'purple',
      word: {
        he: `משימות בביצוע (${beta})`,
        en: `Missions in Progress (${beta})`
      }
    },
    {
      name: 'desi',
      val: true,
      color: 'pink',
      word: { he: `החלטות כלליות (${des})`, en: `General Decisions (${des})` }
    },
    {
      name: 'ppmash',
      val: true,
      color: 'gold',
      word: {
        he: `משאבים בתהליך אישור (${pmash})`,
        en: `Resources Pending Approval (${pmash})`
      }
    },
    {
      name: 'pmashs',
      val: true,
      color: 'neww',
      word: {
        he: `הצעות לשיתוף משאבים (${mashs})`,
        en: `Resource Sharing Proposals (${mashs})`
      }
    },
    {
      name: 'pmaap',
      val: true,
      color: 'wow',
      word: {
        he: `אשרור קבלת משאבים (${maap})`,
        en: `Resource Reception Approvals (${maap})`
      }
    },
    {
      name: 'askmap',
      val: true,
      color: 'red',
      word: {
        he: `אשרור השמה למשאבים (${askma})`,
        en: `Resource Assignment Approvals (${askma})`
      }
    },
    {
      name: 'hachla',
      val: true,
      color: 'gray',
      word: {
        he: `אשרורים כלליים (${hachlot})`,
        en: `General Approvals (${hachlot})`
      }
    },
    {
      name: 'sheirutp',
      val: true,
      color: 'gray',
      word: {
        he: `בקשות שירות (${sheirutps})`,
        en: `Service Requests (${sheirutps})`
      }
    },
    {
      name: 'purchases',
      val: true,
      color: 'blue',
      word: {
        he: `קניות שלי (${purchasesn})`,
        en: `My Purchases (${purchasesn})`
      }
    }
  ]);
</script>

<div
  class="flex flex-nowrap overflow-x-auto whitespace-nowrap w-full sm:max-w-[calc(100vw-200px)] max-w-[calc(100vw-180px)] d"
>
  {#if filterKind == 'kind'}
    {#each milon.filter((item) => {
      // מיפוי של שמות ה-items לערכים המספריים שלהם
      const valueMap = { fiap: fia, sugg: sug, pend: pen, asks: ask, betaha: beta, desi: des, ppmash: pmash, pmashs: mashs, pmaap: maap, askmap: askma, hachla: hachlot, sheirutp: sheirutps, purchases: purchasesn }; // אין ערך מספרי

      // מחזיר true רק אם יש ערך מספרי והוא גדול מ-0
      return valueMap[item.name] > 0;
    }) as key}
      <button onclick={() => showonly?.(key.name)}>
        <Tile
          bg={key.color}
          word={key.word[$lang]}
          openi={states[key.name] === 'true'}
          closei={states[key.name] !== 'true'}
        />
      </button>
    {/each}
  {:else}
    {#each milon as key}
      <button onclick={() => showonly?.(key.name, key.id)}>
        <Tile
          bg={key.color}
          word={key.word[$lang]}
          openi={selectedProjectName === null ||
            selectedProjectName === key.name}
          closei={selectedProjectName !== null &&
            selectedProjectName !== key.name}
        />
      </button>
    {/each}
  {/if}
</div>
