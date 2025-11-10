<script>
  import { lang } from '$lib/stores/lang.js';
  import pic from './../../celim/pic.js';
  import { idPr } from '../../stores/idPr.js';
  import { onMount } from 'svelte';
  import { calcX } from '$lib/func/calcX.svelte';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import ComparisonDisplay from '$lib/components/ui/ComparisonDisplay.svelte';
  /**
   * @typedef {Object} Props
   * @property {any} [fmiData]
   * @property {any} [rikmashes]
   * @property {boolean} [hagdel]
   * @property {any} [salee]
   * @property {number} [allin]
   * @property {any} trili
   * @property {any} users
   * @property {boolean} [already]
   */

  /** @type {Props} */
  let {
    fmiData = [],
    rikmashes = [],
    hagdel = false,
    salee = [],
    allin = 0,
    restime,
    trili,
    users,
    already = $bindable(false)
  } = $props();
  let revach = allin;
  let x = [];
  let meca = [];
  let miDatan = [];
  let noten = [];
  // what about hours alrerady done to mission in progres
  // matbea: Matbea,
  function remove(id) {
    console.log(id);
  }
  function edit(id) {
    console.log(id);
  }
  function confirm(id) {
    console.log(id);
  }
  function percentage(partialValue, totalValue) {
    return (100 * partialValue) / totalValue;
  }
  let ulist = $state([]);
  const baseUrl = import.meta.env.VITE_URL;

  let linkg = baseUrl + '/graphql';
  let dictid = {};
  let dictidi = {};
  let hal = false;
  let error1 = null;

  function checkSplitChanges() {
    if (
      !currentTosplit ||
      !currentTosplit.attributes.halukas ||
      !currentTosplit.attributes.hervachti
    ) {
      return;
    }

    const existingHalukas = currentTosplit.attributes.halukas.data;
    const existingHervachti = currentTosplit.attributes.hervachti;

    // Check if amounts have changed
    let hasChanges = false;

    // Compare hervachti (split amounts)
    for (let i = 0; i < ulist.length; i++) {
      const currentUser = ulist[i];
      const existingHervachti = currentTosplit.attributes.hervachti.find(
        (h) => h.users_permissions_user.data.id == currentUser.uid
      );

      if (existingHervachti) {
        // Check if the amount has changed
        if (Math.abs(existingHervachti.amount - currentUser.x) > 0.01) {
          hasChanges = true;
          break;
        }
      } else if (currentUser.x > 0) {
        // New user with amount
        hasChanges = true;
        break;
      }
    }

    // Compare halukas (transfers) - only consider unconfirmed ones as changeable
    if (!hasChanges) {
      const currentTransfers = [];
      for (let i = 0; i < ulist.length; i++) {
        if (ulist[i].le && ulist[i].noten > 0) {
          for (let j = 0; j < ulist[i].le.length; j++) {
            currentTransfers.push({
              from: ulist[i].uid,
              to: ulist[i].le[j].leid,
              amount: ulist[i].le[j].cama
            });
          }
        }
      }

      // Only consider unconfirmed halukas for comparison
      const unconfirmedHalukas = existingHalukas.filter(
        (h) => !h.attributes.confirmed
      );

      if (currentTransfers.length !== unconfirmedHalukas.length) {
        hasChanges = true;
      } else {
        // Check each transfer against unconfirmed halukas
        for (let transfer of currentTransfers) {
          const existingTransfer = unconfirmedHalukas.find(
            (h) =>
              h.attributes.usersend.data.id == transfer.from &&
              h.attributes.userrecive.data.id == transfer.to
          );

          if (
            !existingTransfer ||
            Math.abs(existingTransfer.attributes.amount - transfer.amount) >
              0.01
          ) {
            hasChanges = true;
            break;
          }
        }
      }
    }

    // Build change details
    let changes = [];
    let changesForDisplay = [];

    // Check for new users
    const existingUserIds = existingHervachti.map(
      (h) => h.users_permissions_user.data.id
    );
    for (let user of ulist) {
      if (user.x > 0 && !existingUserIds.includes(user.uid)) {
        const addedText = $lang === 'he' ? 'נוסף לחלוקה' : 'added to split';
        changes.push(`${user.username} ${addedText}`);
        changesForDisplay.push({
          label: `${user.username}:`,
          oldValue: '0',
          newValue: user.x.toFixed(2)
        });
      }
    }

    // Check for amount changes
    for (let i = 0; i < ulist.length; i++) {
      const currentUser = ulist[i];
      const existingUser = existingHervachti.find(
        (h) => h.users_permissions_user.data.id == currentUser.uid
      );

      if (
        existingUser &&
        Math.abs(existingUser.amount - currentUser.x) > 0.01
      ) {
        changes.push(
          `${currentUser.username}: ${existingUser.amount.toFixed(2)} → ${currentUser.x.toFixed(2)}`
        );
        changesForDisplay.push({
          label: `${currentUser.username}:`,
          oldValue: existingUser.amount.toFixed(2),
          newValue: currentUser.x.toFixed(2)
        });
      }
    }

    // Check for new sales
    const existingSalesIds = currentTosplit.attributes.sales?.data?.map(s => s.id) || [];
    const currentUnsplitedIds = unsplitedSales.map(s => s.id);
    
    const newSales = currentUnsplitedIds.filter(id => !existingSalesIds.includes(id));
    
    if (newSales.length > 0) {
      hasChanges = true;
      const newSalesText = $lang === 'he' ? 'מכירות חדשות נוספו' : 'new sales added';
      changes.push(`${newSales.length} ${newSalesText}`);
      changesForDisplay.push({
        label: $lang === 'he' ? 'מכירות חדשות:' : 'New sales:',
        oldValue: existingSalesIds.length.toString(),
        newValue: (existingSalesIds.length + newSales.length).toString()
      });
    }

    splitChanged = hasChanges;
    showUpdateSuggestion = hasChanges;
    changeDetails = changes.join(', ');
    changesList = changesForDisplay;
  }

  async function updateTosplit() {
    const cookieValueId = document.cookie
      .split('; ')
      .find((row) => row.startsWith('id='))
      .split('=')[1];

    let idL = cookieValueId;
    let d = new Date();

    try {
      const existingHalukas = currentTosplit.attributes.halukas.data;

      // Build current transfers list
      const currentTransfers = [];
      for (let i = 0; i < ulist.length; i++) {
        if (ulist[i].noten > 0 && ulist[i].le) {
          for (let x = 0; x < ulist[i].le.length; x++) {
            currentTransfers.push({
              from: ulist[i].uid,
              to: ulist[i].le[x].leid,
              amount: parseFloat(ulist[i].le[x].cama.toFixed(2))
            });
          }
        }
      }

      let updatedHalukaIds = [];

      // Process existing halukas
      for (let existingHaluka of existingHalukas) {
        const matchingTransfer = currentTransfers.find(
          (transfer) =>
            transfer.from == existingHaluka.attributes.usersend.data.id &&
            transfer.to == existingHaluka.attributes.userrecive.data.id
        );

        if (matchingTransfer) {
          // Update existing haluka if amount changed and not confirmed
          if (
            !existingHaluka.attributes.confirmed &&
            Math.abs(
              existingHaluka.attributes.amount - matchingTransfer.amount
            ) > 0.01
          ) {
            await sendToSer(
              {
                id: existingHaluka.id,
                amount: matchingTransfer.amount
              },
              '70updateHaluka',
              null,
              null,
              false,
              fetch
            );
          }
          updatedHalukaIds.push(existingHaluka.id);

          // Remove this transfer from currentTransfers as it's been handled
          const index = currentTransfers.indexOf(matchingTransfer);
          currentTransfers.splice(index, 1);
        } else if (existingHaluka.attributes.confirmed) {
          // Keep confirmed halukas even if they don't match current calculation
          updatedHalukaIds.push(existingHaluka.id);
        }
        // If no matching transfer found and not confirmed, the haluka will be removed from tosplit relation
        // (not deleted, just not included in the updated halukas array)
      }

      // Create new halukas for remaining transfers
      for (let transfer of currentTransfers) {
        const halukaData = {
          project: $idPr,
          usersend: transfer.from,
          userrecive: transfer.to,
          amount: transfer.amount,
          matbea: '2',
          confirmed: false,
          publishedAt: d.toISOString()
        };

        const result = await sendToSer(
          { data: halukaData },
          '69createHaluka',
          null,
          null,
          false,
          fetch
        );
        if (result?.data?.createHaluka?.data?.id) {
          updatedHalukaIds.push(result.data.createHaluka.data.id);
        }
      }

      // Create new hervachti array
      let hervachtiArray = [];
      for (let c = 0; c < ulist.length; c++) {
        const amount = ulist[c].x;
        const user = ulist[c].uid;
        if (amount > 0) {
          hervachtiArray.push({
            users_permissions_user: parseInt(user),
            amount: amount,
            mekabel: ulist[c].meca > 0,
            noten: ulist[c].noten > 0
          });
        }
      }

      // Get all unsplited sales IDs
      const salesIds = unsplitedSales.map(sale => sale.id);

      // Update the tosplit with new halukas, hervachti, and sales
      await sendToSer(
        {
          id: currentTosplit.id,
          halukas: updatedHalukaIds,
          hervachti: hervachtiArray,
          sales: salesIds
        },
        '68updateTosplit',
        null,
        null,
        false,
        fetch
      );

      // Update each sale to mark as splited
      for (let saleId of salesIds) {
        await sendToSer(
          {
            id: saleId,
            splited: true,
            tosplits: [currentTosplit.id]
          },
          '71updateSaleSplited',
          null,
          null,
          false,
          fetch
        );
      }

      showUpdateSuggestion = false;
      splitChanged = false;
    } catch (e) {
      console.error('Error updating tosplit:', e);
    }
  }

  async function ask() {
    already = true;
    let d = new Date();
    const cookieValue = document.cookie
      .split('; ')
      .find((row) => row.startsWith('jwt='))
      .split('=')[1];
    const cookieValueId = document.cookie
      .split('; ')
      .find((row) => row.startsWith('id='))
      .split('=')[1];
    let idL = cookieValueId;
    let token = cookieValue;
    let bearer1 = 'bearer' + ' ' + token;
    let qurer = ``;
    let naminator = [];
    for (let i = 0; i < ulist.length; i++) {
      console.log(qurer, ulist[i]);
      if (ulist[i].noten > 0) {
        for (let x = 0; x < ulist[i].le.length; x++) {
          qurer = `  
createHaluka( 
      data: { 
                project: "${$idPr}",
        usersend: "${ulist[i].uid}",
        userrecive: "${ulist[i].le[x].leid}",
        amount: ${ulist[i].le[x].cama.toFixed(2)},
        matbea: "2",
        confirmed: false,
        publishedAt: "${d.toISOString()}",
      }
    
    ){data{ id  }} `;

          try {
            await fetch(linkg, {
              method: 'POST',
              headers: {
                Authorization: bearer1,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                query: `mutation 
          { ${qurer}
}`
              })
            })
              .then((r) => r.json())
              .then((data) => (miDatan = data));
            console.log(miDatan);
            naminator.push(`${miDatan.data.createHaluka.data.id}`);
          } catch (e) {
            error1 = e;
            console.log(error1);
          }
        }
      }
    }

    console.log(naminator);
    //create hervachti compo
    let hervachti = ``;
    let counter = 0;
    let mored = ``;
    for (let c = 0; c < ulist.length; c++) {
      const amount = ulist[c].x;
      const user = ulist[c].uid;
      if (amount > 0) {
        counter += 1;
        if (counter == 1) {
          mored = `
             {
              users_permissions_user: ${user},
              amount: ${amount},
              ${ulist[c].meca > 0 ? 'mekabel:true,' : ``}
              ${ulist[c].noten > 0 ? 'noten:true' : ``}
             },
             `;
          hervachti = `hervachti:[${mored}]`;
        } else {
          mored += `
             {
              users_permissions_user: ${user},
              amount: ${amount},
              ${ulist[c].meca > 0 ? 'mekabel:true,' : ``}
              ${ulist[c].noten > 0 ? 'noten:true' : ``}
             },
            `;
          hervachti = `hervachti:[${mored}]`;
          console.log('here', hervachti);
        }
      }
    }
    hervachti = hervachti;
    
    // Get all unsplited sales IDs
    const salesIds = unsplitedSales.map(sale => sale.id);
    const salesString = salesIds.length > 0 ? `sales: [${salesIds.join(',')}],` : '';
    
    try {
      await fetch(linkg, {
        method: 'POST',
        headers: {
          Authorization: bearer1,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `mutation
           { createTosplit(
      data: { 
        publishedAt: "${d.toISOString()}",
        project: "${$idPr}",
      vots: [
     {
      what: true
      users_permissions_user: "${idL}"
    }
  ],
    halukas: [${naminator}],
    ${hervachti}
    ${salesString}
}
    
  ){data { id }}
} `
        })
      })
        .then((r) => r.json())
        .then((data) => (miDatan = data));
      console.log(miDatan);
      //get ids put in tosplitname for now
      let timegramaId = miDatan.data.createTosplit.data.id;
      
      // Update each sale to mark as splited
      for (let saleId of salesIds) {
        await sendToSer(
          {
            id: saleId,
            splited: true,
            tosplits: [timegramaId]
          },
          '71updateSaleSplited',
          null,
          null,
          false,
          fetch
        );
      }
      
      let x = calcX(restime);
      let fd = new Date(Date.now() + x);
      await sendToSer(
        { whatami: 'tosplit', tosplit: timegramaId, date: fd },
        '32createTimeGrama',
        null,
        null,
        false,
        fetch
      );
    } catch (e) {
      error1 = e;
      console.log(error1);
    }
  }

  let hatzaa = $state(false);
  let noofok = $state(),
    noofw = $state(),
    noofno = $state(0);
  let splitChanged = $state(false);
  let currentTosplit = $state(null);
  let showUpdateSuggestion = $state(false);
  let changeDetails = $state('');
  let changesList = $state([]);
  let unsplitedSales = $state([]);

  onMount(async () => {
    // Filter unsplited sales
    unsplitedSales = salee.filter(sale => 
      !sale.attributes.splited && 
      (!sale.attributes.tosplits?.data || sale.attributes.tosplits.data.length === 0)
    );

    cal();

    pre();
    if (trili.length > 0) {
      already = true;
      hatzaa = true;
      currentTosplit = trili[0];
      const vots = trili[0].attributes.vots;
      for (let i = 0; i < vots.length; i++) {
        if (vots[i].what == true) {
          noofok += 1;
        } else {
          noofno += 1;
        }
      }
      noofw = ulist.length - vots.length;

      // Check if split has changed
      checkSplitChanges();
    }
  });
  function cal() {
    // Only calculate with unsplited sales
    const unsplitedOnly = salee.filter(s => !s.attributes.splited);
    
    for (let i = 0; i < users.length; i++) {
      for (let j = 0; j < unsplitedOnly.length; j++) {
        if (
          unsplitedOnly[j].attributes.users_permissions_user.data.id === users[i].id
        ) {
          if (unsplitedOnly[j].attributes.users_permissions_user.data.id in dictidi) {
            dictidi[unsplitedOnly[j].attributes.users_permissions_user.data.id] +=
              unsplitedOnly[j].attributes.in;
          } else {
            dictidi[unsplitedOnly[j].attributes.users_permissions_user.data.id] =
              unsplitedOnly[j].attributes.in;
          }
        }
      }
      if (users[i].id in dictidi) {
      } else {
        dictidi[users[i].id] = 0;
      }
    }
  }
  function pre() {
    for (let i = 0; i < users.length; i++) {
      for (let j = 0; j < fmiData.length; j++) {
        if (
          fmiData[j].attributes.users_permissions_user.data.id === users[i].id
        ) {
          if (fmiData[j].attributes.users_permissions_user.data.id in dictid) {
            dictid[fmiData[j].attributes.users_permissions_user.data.id] +=
              fmiData[j].attributes.total;
          } else {
            dictid[fmiData[j].attributes.users_permissions_user.data.id] =
              fmiData[j].attributes.total;
          }
        }
      }
      for (let j = 0; j < rikmashes.length; j++) {
        if (
          rikmashes[j].attributes.users_permissions_user.data.id === users[i].id
        ) {
          if (
            rikmashes[j].attributes.users_permissions_user.data.id in dictid
          ) {
            dictid[rikmashes[j].attributes.users_permissions_user.data.id] +=
              rikmashes[j].attributes.total;
          } else {
            dictid[rikmashes[j].attributes.users_permissions_user.data.id] =
              rikmashes[j].attributes.total;
          }
        }
      }
    }
    for (let j = 0; j < fmiData.length; j++) {
      if ('net' in dictid) {
        dictid['net'] += fmiData[j].attributes.total;
      } else {
        dictid['net'] = fmiData[j].attributes.total;
      }
    }
    for (let j = 0; j < rikmashes.length; j++) {
      if ('net' in dictid) {
        dictid['net'] += rikmashes[j].attributes.total;
      } else {
        dictid['net'] = rikmashes[j].attributes.total;
      }
    }
    const filteredw = Object.keys(dictid);
    const filtered = Object.keys(dictidi);

    for (let i = 0; i < users.length; i++) {
      //arr from obj key and val then add needed data
      for (let t = 0; t < filteredw.length; t++) {
        if (filteredw[t] === users[i].id) {
          for (let m = 0; m < filtered.length; m++) {
            if (filtered[m] === users[i].id) {
              if ('counter' in dictid) {
                dictid['counter'] += 1;
              } else {
                dictid['counter'] = 1;
              }
              if ('pmcounter' in dictid) {
                dictid['pmcounter'] -= ulist[ulist.length - 1].p;
              } else {
                dictid['pmcounter'] = 0;
              }
              let src22 = ``;
              if (users[i].attributes.profilePic.data !== null) {
                src22 = users[i].attributes.profilePic.data.attributes.url;
              } else {
                src22 = pic;
              }
              ulist.push({
                ihave: dictidi[filtered[m]],
                total: dictid[filteredw[t]],
                uid: users[i].id,
                username: users[i].attributes.username,
                src: src22,
                p: percentage(dictid[filteredw[t]], dictid['net']),
                un: users[i].username,
                s: percentage(dictid[filteredw[t]], dictid['net']),
                s2: 100,
                d: dictid['pmcounter'],
                o: 'visible',
                c: `url(#img${dictid['counter']})`,
                imid: `img${dictid['counter']}`
              });
            }
          }
        }
      }
      for (let i = 0; i < ulist.length; i++) {
        ulist[i].x = (ulist[i].p / 100) * revach;
        if (ulist[i].ihave - ulist[i].x < 0) {
          ulist[i].meca = ulist[i].x - ulist[i].ihave;
          ulist[i].noten = 0;
          ulist[i].cama = 0;
        } else if (ulist[i].ihave - ulist[i].x > 0) {
          ulist[i].noten = ulist[i].ihave - ulist[i].x;
          ulist[i].meca = 0;
        } else {
          ulist[i].meca = 0;
          ulist[i].noten = 0;
          ulist[i].cama = 0;
        }
      }
    }
    // Reset transfer arrays
    for (let i = 0; i < ulist.length; i++) {
      ulist[i].le = [];
      ulist[i].kibal = false;
      ulist[i].latet = ulist[i].noten;
    }

    // Sort by amount needed (meca) in descending order for better distribution
    ulist.sort(({ meca: a }, { meca: b }) => b - a);

    // Store original meca values for display
    const originalMeca = ulist.map(u => u.meca);
    
    // Calculate transfers using a more flexible approach
    for (let giver = 0; giver < ulist.length; giver++) {
      if (ulist[giver].noten <= 0) continue; // Skip if nothing to give

      let remainingToGive = ulist[giver].noten;

      for (let receiver = 0; receiver < ulist.length; receiver++) {
        if (ulist[receiver].meca <= 0 || remainingToGive <= 0) continue; // Skip if nothing needed or nothing left to give
        if (giver === receiver) continue; // Can't transfer to self

        // Calculate how much to transfer
        let transferAmount = Math.min(remainingToGive, ulist[receiver].meca);

        if (transferAmount > 0.01) {
          // Only transfer if meaningful amount
          // Add to giver's transfer list
          ulist[giver].le.push({
            le: ulist[receiver].username,
            leid: ulist[receiver].uid,
            cama: transferAmount
          });

          // Update remaining amounts
          remainingToGive -= transferAmount;
          ulist[receiver].meca -= transferAmount;
        }
      }
    }
    
    // Restore original meca values for display
    for (let i = 0; i < ulist.length; i++) {
      ulist[i].meca = originalMeca[i];
    }

    // Debug log to see the results
    console.log(
      'Transfer calculation results:',
      ulist.map((u) => ({
        name: u.username,
        shouldGet: u.x.toFixed(2),
        has: u.ihave.toFixed(2),
        needsToGive: u.noten.toFixed(2),
        needsToReceive: u.meca.toFixed(2),
        transfers: u.le
      }))
    );

    ulist = ulist;

    // Check for split changes after calculation is complete
    if (currentTosplit) {
      checkSplitChanges();
    }
  }
  const head = { he: 'טבלת חישוב', en: 'coculation table' };
  const name = { he: 'שם', en: 'name' };
  const pres = { he: 'החלק מהרווח', en: 'profit precentage' };
  const amho = { he: 'הסכום שממתין אצלי', en: 'amount that I guard' };
  const amtog = { he: 'סכום להעביר', en: 'amount to give' };
  const amtor = { he: 'סכום לקבל', en: 'amount to recive' };
  const movto = { he: ' להעביר אל:', en: 'give to:' };
  const perof = { he: 'אחוז ברקמה', en: 'precentage in the FreeMate' };
  const appbu = { he: 'אישור ובקשת חלוקה', en: 'confirm split' };
  const ft = {
    he: 'הוגשה הצעה לחלוקה והיא בתהליך אישור:',
    en: 'suggestion to split has been requested and its in appruval process:'
  };
  const sofar = { he: 'עד כה', en: 'so far' };
  const there = { he: 'ישנן', en: 'there are' };
  const vots = { he: 'הצבעות', en: 'vots' };
  const onvo = { he: 'ישנה הצבעה אחת', en: 'there is one vote' };
  const toap = { he: 'בעד', en: 'in favor' };
  const ag = { he: 'נגד', en: 'against' };
  const and = { he: 'ו', en: 'and' };
  const noy = { he: 'שעוד לא הצביעו', en: 'that didnt vote yet' };
  const splitChangedTitle = {
    he: 'שינוי בחלוקה זוהה',
    en: 'Split Changes Detected'
  };
  const splitChangedDesc = {
    he: 'הסכומים או אופן החלוקה השתנו מאז ההצעה המקורית. האם ברצונך לעדכן את ההצעה לחלוקה החדשה?',
    en: 'The amounts or split method have changed since the original proposal. Would you like to update the proposal to the new split values?'
  };
  const updateSplit = { he: 'עדכון חלוקה', en: 'Update Split' };
  const cancel = { he: 'ביטול', en: 'Cancel' };
  const changesDetected = { he: 'שינויים שזוהו:', en: 'Changes detected:' };
</script>

<div class="dd md:items-center">
  <div class="body items-center">
    <table dir="rtl">
      <caption class="sm:text-right md:text-center text-right">
        <h1 class="md:text-center text-2xl md:text-2xl font-bold">
          {head[$lang]}
        </h1>
      </caption>
      <tbody>
        <tr class="gg">
          <th class="gg"></th>
          {#each ulist as data, i}
            <td class="gg" style="font-size: 3rem">
              {i + 1}
            </td>
          {/each}
        </tr>
        <tr class="ggr">
          <th class="ggr">{name[$lang]}</th>
          {#each ulist as data, i}
            <td class="ggr">{data.username}</td>
          {/each}
        </tr>
        <tr>
          <th>{pres[$lang]}</th>
          {#each ulist as data, i}
            <td>
              {#if revach > 0}
                {data.x.toFixed(2)}
              {:else}
                0
              {/if}
            </td>
          {/each}
        </tr><tr>
          <th>{amho[$lang]}</th>
          {#each ulist as data, i}
            <td>
              {#if data.ihave > 0}
                {data.ihave.toFixed(2)}
              {:else}
                0
              {/if}
            </td>
          {/each}
        </tr><tr>
          <th>{amtog[$lang]}</th>
          {#each ulist as data, i}
            <td>
              {#if revach > 0 && data.ihave - data.x > 0}
                {data.noten.toFixed(2)}
              {:else}
                0
              {/if}
            </td>
          {/each}
        </tr>
        <tr>
          <th>{movto[$lang]}</th>
          {#each ulist as data, i}
            <td>
              {#if data.le}
                {#each data.le as ee, i}
                  {` ${ee.le} :  ${ee.cama.toFixed(2)} `}
                  <br />
                {/each}
              {/if}
            </td>
          {/each}
        </tr>
        <tr>
          <th>{amtor[$lang]}</th>
          {#each ulist as data, i}
            <td>
              {#if revach > 0 && data.ihave - data.x < 0}
                {data.meca.toFixed(2)}
              {:else}
                0
              {/if}
            </td>
          {/each}
        </tr><tr>
          <th>{perof[$lang]}</th>
          {#each ulist as data, i}
            <td>{data.p.toFixed(2)}</td>
          {/each}
        </tr>
      </tbody>
    </table>

    {#if already === false}<!--//hal === false &&-->
      <button
        class="border border-barbi hover:border-gold bg-gradient-to-br from-gra via-grb via-gr-c via-grd to-gre hover:from-barbi hover:to-mpink text-barbi hover:text-gold font-bold py-2 px-4 rounded-full"
        onclick={ask}>{appbu[$lang]}</button
      >
    {/if}

    {#if showUpdateSuggestion}
      <div class="border border-yellow-500 bg-yellow-50 m-2 p-4 rounded">
        <h2 class="font-bold text-yellow-800 mb-2">
          {splitChangedTitle[$lang]}
        </h2>
        <p class="text-yellow-700 mb-3">
          {splitChangedDesc[$lang]}
        </p>
        {#if changesList.length > 0}
          <div class="bg-yellow-100 p-3 rounded mb-3 border border-yellow-300">
            <strong class="block mb-2 text-yellow-800">{changesDetected[$lang]}</strong>
            <div class="space-y-2 bg-white p-2 rounded border">
              {#each changesList as change}
                <ComparisonDisplay 
                  label={change.label}
                  oldValue={change.oldValue}
                  newValue={change.newValue}
                />
              {/each}
            </div>
          </div>
        {/if}
        <div class="flex gap-2">
          <button
            class="bg-yellow-500 hover:bg-yellow-600 text-white font-bold py-2 px-4 rounded"
            onclick={updateTosplit}
          >
            {updateSplit[$lang]}
          </button>
          <button
            class="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
            onclick={() => (showUpdateSuggestion = false)}
          >
            {cancel[$lang]}
          </button>
        </div>
      </div>
    {/if}

    {#if hatzaa == true}
      <div class="border border-barbi m-2 p-2  bg-gold">
        <h1 class="font-bold">
          {ft[$lang]}<br />
          {` ${sofar[$lang]} ${noofok > 1 ? `${there[$lang]} ${noofok} ${vots[$lang]}` : onvo[$lang]} ${toap[$lang]} ${noofno > 0 ? `, ${noofno} ${ag[$lang]} ` : ''} ${noofw > 0 ? `${and[$lang]}-${noofw} ${noy[$lang]}` : ''}`}
        </h1>
      </div>{/if}
  </div>
</div>

<style>
  .gg {
    position: sticky;
    top: 1px;
    background-color: #6b0f1a;
    background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);

    border-width: 4px;
    border-color: rgb(103, 232, 249);
    border-radius: 4%;
    opacity: 1;
    color: rgb(132, 241, 223);
  }
  .ggd {
    position: sticky;
    bottom: 1px;
    background-color: #6b0f1a;
    background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);

    border-width: 4px;
    border-color: rgb(103, 232, 249);
    border-radius: 4%;
    opacity: 1;
    color: rgb(132, 241, 223);
  }
  .ggr {
    position: sticky;
    top: 77px;
    background-color: #6b0f1a;
    background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);

    opacity: 1;
    color: rgb(132, 241, 223);
  }
  .ggr:hover,
  .gg:hover,
  .ggd:hover {
    background: var(--barbi-pink);
  }
  .dd {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }
  .body {
    overflow-x: auto;
    overflow-y: auto;
    max-width: 100vw;
    padding-left: 0.5em;
    padding-right: 0.5em;
  }

  table,
  th,
  td {
    border-collapse: collapse;
    border-width: 4px;
    border-color: rgb(103, 232, 249);
    border-radius: 4%;
  }
  table {
    text-align: center;
    color: var(--barbi-pink);
    margin: 0 auto;
  }
  th {
    background-color: #6b0f1a;
    background-image: linear-gradient(315deg, #6b0f1a 0%, #b91372 74%);
    color: rgb(132, 241, 223);
  }
  td {
    background-color: #5efaf2;
    background-image: linear-gradient(8deg, #5efaf2 0%, #eee 74%);
  }
  th:hover {
    background: var(--barbi-pink);
  }
  td:hover {
    background: rgb(132, 241, 223);
  }
</style>
