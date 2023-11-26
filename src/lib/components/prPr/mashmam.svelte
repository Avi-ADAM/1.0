<script>
  export let meData = [];
  import { onMount } from 'svelte';

  import moment from 'moment';
  function remove(id) {
    console.log(id);
  }
  function edit(id) {
    console.log(id);
  }
  onMount(async () => {
    myMissionH();
  });

  let km = false;
  let ky = false;
  let kc = false;

  function myMissionH() {
    km = false;
    ky = false;
    kc = false;
    let is = [];

    for (var i = 0; i < meData.length; i++) {
      if (meData[i].attributes.kindOf === 'monthly') {
        var b = moment(meData[i].attributes.sqadualed);
        var a = moment(meData[i].attributes.sqadualedf);
        meData[i].monts = a.diff(b, 'months', true).toFixed(2);
        ky = true;
        meData[i].m = true;
        meData[i].ky = true;
        meData[i].kc = false;
        meData[i].r = false;
        meData[i].y = false;
        meData[i].total = meData[i].monts * meData[i].attributes.price;
        meData[i].totaltotal = meData[i].monts * meData[i].attributes.easy;
      } else if (meData[i].attributes.kindOf === 'yearly') {
        var b = moment(meData[i].attributes.sqadualed);
        var a = moment(meData[i].attributes.sqadualedf);
        meData[i].years = a.diff(b, 'years', true).toFixed(2);
        ky = true;
        meData[i].y = true;
        meData[i].m = false;
        meData[i].r = false;
        meData[i].ky = true;
        meData[i].kc = false;
        meData[i].total = (
          meData[i].years * meData[i].attributes.price
        ).toFixed(2);
        meData[i].totaltotal = (
          meData[i].years * meData[i].attributes.easy
        ).toFixed(2);
      } else if (meData[i].attributes.kindOf === 'rent') {
        meData[i].y = false;
        ky = true;
        meData[i].r = true;
        meData[i].ky = true;
        meData[i].m = false;
        meData[i].kc = false;
        meData[i].total = meData[i].attributes.price;
        meData[i].totaltotal = meData[i].attributes.easy;
      } else if (meData[i].attributes.kindOf === 'perUnit') {
        meData[i].y = false;
        meData[i].kc = true;
        meData[i].ky = false;
        meData[i].m = false;
        meData[i].r = false;
        kc = true;
        meData[i].total = meData[i].attributes.hm * meData[i].attributes.price;
        meData[i].totaltotal =
          meData[i].attributes.hm * meData[i].attributes.easy;
      } else if (meData[i].attributes.kindOf === 'total') {
        meData[i].y = false;
        meData[i].kc = false;
        meData[i].ky = false;
        meData[i].m = false;
        meData[i].r = false;
        meData[i].to = true;
        meData[i].total = meData[i].attributes.price;
        meData[i].totaltotal = meData[i].attributes.easy;
      }
    }
  }
</script>

<div class="dd md:items-center border-2 border-gold rounded">
  <div class="body items-center">
    <table dir="rtl">
      <caption class="sm:text-right md:text-center text-right">
        <h1 class="md:text-center text-2xl md:text-2xl font-bold">
          משאבים נדרשים שפורסמו
        </h1>
      </caption>
      <tr class="gg">
        <th class="gg" />
        {#each meData as data, i}
          <td class="gg" style="font-size: 3rem">
            {i + 1}
          </td>
        {/each}
      </tr>
      <tr class="ggr">
        <th class="ggr">שם</th>
        {#each meData as data, i}
          <td class="ggr">
            {data.attributes.name}
          </td>
        {/each}
      </tr>
      <tr>
        <th>תיאור</th>
        {#each meData as data, i}
          <td>
            {#if data.attributes.deskrip} {data.attributes.deskrip}{/if}
          </td>
        {/each}
      </tr>
      <tr>
        <th>סוג</th>
        {#each meData as data, i}
          <td>
            <h1>{data.attributes.kindOf}</h1>
          </td>
        {/each}
      </tr>
      <tr style="display:{kc ? '' : 'none'};">
        <th>כמות</th>
        {#each meData as data, i}
          <td>
            {data.attributes.hm}
          </td>{/each}
      </tr><tr style="display:{ky ? '' : 'none'};">
        <th>תאריך התחלה </th>
        {#each meData as data, i}
          <td
            ><h1 style="display:{meData[i].ky ? '' : 'none'};">
              {moment(data.attributes.sqadualed).format(
                'dddd, MMMM Do YYYY, H:mm:ss '
              )}
            </h1></td
          >
        {/each}
      </tr>
      <tr style="display:{ky ? '' : 'none'};">
        <th>תאריך סיום </th>
        {#each meData as data, i}
          <td
            ><h1 style="display:{meData[i].ky ? '' : 'none'};">
              {moment(data.attributes.sqadualedf).format(
                'dddd, MMMM Do YYYY, H:mm:ss '
              )}
            </h1></td
          >
        {/each}
      </tr>
      <tr>
        <th>הערות מיוחדות</th>
        {#each meData as data, i}
          <td
            >{#if data.attributes.spnot}
              {data.attributes.spnot}{/if}</td
          >
        {/each}
      </tr>
      <tr>
        <th>עלות</th>
        {#each meData as data, i}
          <td>
            <small for="name" class="label"
              >שווי כספי <span style="display:{meData[i].m ? '' : 'none'};"
                >לכל חודש</span
              ><span style="display:{meData[i].y ? '' : 'none'};">לכל שנה</span
              ><span style="display:{meData[i].r ? '' : 'none'};"
                >לכל התקופה</span
              ><span style="display:{meData[i].kc ? '' : 'none'};">ליחידה</span>
            </small>
            <h2>{data.attributes.price}</h2>
          </td>{/each}
      </tr><tr>
        <th>שווי מקסימלי לחישוב בריקמה</th>
        {#each meData as data, i}
          <td>
            <small for="name" class="label"
              >שווי כספי <span style="display:{meData[i].m ? '' : 'none'};"
                >לכל חודש</span
              ><span style="display:{meData[i].y ? '' : 'none'};">לכל שנה</span
              ><span style="display:{meData[i].r ? '' : 'none'};"
                >לכל התקופה</span
              ><span style="display:{meData[i].kc ? '' : 'none'};">ליחידה</span>
            </small>
            {data.attributes.easy}
          </td>{/each}
      </tr><tr style="display:{kc || ky ? '' : 'none'};">
        <th>עלות סה"כ</th>
        {#each meData as data, i}
          <td>
            <h3
              style="display:{meData[i].m ||
              meData[i].y ||
              meData[i].kc ||
              meData[i].to
                ? ''
                : 'none'};"
            >
              {data.total}
            </h3>
          </td>{/each}
      </tr><tr style="display:{kc || ky ? '' : 'none'};">
        <th>שווי מקסימלי סה"כ</th>
        {#each meData as data, i}
          <td>
            <h3
              style="display:{meData[i].m ||
              meData[i].y ||
              meData[i].kc ||
              meData[i].to
                ? ''
                : 'none'};"
            >
              {data.totaltotal}
            </h3>
          </td>{/each}
      </tr>
      <tr>
        <th>לינק לפרטי מוצר\ מחיר \ רכישה</th>
        {#each meData as data, i}
          <td
            >{#if data.attributes.linkto}{data.attributes.linkto}{/if}
          </td>
        {/each}
      </tr>
    </table>
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
    max-height: 100vh;
    width: 96vw;
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
