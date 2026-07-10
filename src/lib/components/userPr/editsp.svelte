<script>
  import { onMount } from 'svelte';
  import { RingLoader } from 'svelte-loading-spinners';
  import { executeAction } from '$lib/client/actionClient';

  /**
   * @typedef {Object} ClosePayload
   * @property {any} id
   * @property {any} name
   * @property {any} skob
   */

  /**
   * @typedef {Object} Props
   * @property {(payload: ClosePayload) => void} [onClose] - Callback for the close event.
   */

  /** @type {Props} */
  let { onClose, meData = [] } = $props();
  let error1 = $state(null);

  /** offerScope as loaded — used to detect a revert to rikma-only on save. */
  let initialScope = $state('rikma');

  onMount(async () => {
    const id = meData.id;
    meData = meData.attributes;
    meData.id = id;
    meData.offerScope = meData.offerScope || 'rikma';
    initialScope = meData.offerScope;
    myMissionH();
    myMi();
  });

  function myMi() {
    meData.hm = meData.hm || 1;
    meData.easy = meData.easy || meData.price;
    meData.dates = meData.dates || new Date().toISOString().slice(0, -1);
    meData.datef =
      meData.datef ||
      new Date(new Date().setFullYear(new Date().getFullYear() + 2))
        .toISOString()
        .slice(0, -1);
  }

  let already = $state(false);

  async function han() {
    already = true;
    const hm = meData.hm > 0 ? meData.hm : 1;
    const price = meData.price > 0 ? meData.price : 0;
    const easy = meData.myp > 0 ? meData.myp : 0;

    try {
      const result = await executeAction('updateResourceRequest', {
        id: meData.id,
        name: meData.name,
        descrip: meData.descrip,
        kindOf: meData.kindOf,
        hm,
        spnot: meData.spnot,
        price,
        myp: easy,
        linkto: meData.linkto,
        sdate: meData.dates ? new Date(meData.dates).toISOString() : undefined,
        fdate: meData.datef ? new Date(meData.datef).toISOString() : undefined
      });

      if (result.success && result.data) {
        // PLAN_USER_OFFERINGS §3.2 — sync the public product when the resource
        // is (or was) offered to customers. Idempotent server-side: mints or
        // re-syncs the personal Matanot, or archives it on revert to 'rikma'.
        const scope = meData.offerScope || 'rikma';
        if (scope !== 'rikma' || initialScope !== 'rikma') {
          const pub = await executeAction('publishUserResourceAsProduct', {
            spId: String(meData.id),
            offerScope: scope,
            price
          });
          if (!pub.success) {
            error1 = pub.error?.message || 'Publishing as product failed';
            already = false;
            return;
          }
          initialScope = scope;
        }
        onClose?.({
          id: result.data.id,
          name: result.data.attributes.name,
          skob: result.data
        });
      } else {
        error1 = result.error?.message || 'Update failed';
        already = false;
      }
    } catch (e) {
      error1 = e;
      already = false;
    }
  }

  let ky = $state(false);
  let kc = $state(false);

  function myMissionH() {
    ky = false;
    kc = false;
    let is = [];

    if (meData.kindOf === 'monthly') {
      ky = true;
      meData.ky = true;
      meData.kc = false;
      meData.m = true;
      meData.r = false;
      meData.y = false;
    } else if (meData.kindOf === 'yearly') {
      ky = true;
      meData.ky = true;
      meData.kc = false;
      meData.m = false;
      meData.r = false;
      meData.y = true;
    } else if (meData.kindOf === 'rent') {
      ky = true;
      meData.ky = true;
      meData.kc = false;
      meData.m = false;
      meData.r = true;
      meData.y = false;
    } else if (meData.kindOf === 'perUnit') {
      meData.kc = true;
      meData.ky = false;
      kc = true;
      meData.m = false;
      meData.r = false;
      meData.y = false;
    } else {
      meData.kc = false;
      meData.ky = false;
      meData.m = false;
      meData.r = false;
      meData.y = false;
    }
  }
  import { lang } from '$lib/stores/lang';
  const ot = { he: 'עלות חד פעמית', en: 'one time' };
  const py = { he: 'ליחידה', en: 'per unit' };
  const pm = { he: 'חודשי', en: 'monthly' };
  const pye = { he: 'שנתי', en: 'yearly' };
  const re = { he: 'השכרה לזמן קצוב', en: 'rent' };
  const scLabel = { he: 'למי המשאב מוצע?', en: 'offered to whom?' };
  const scRikma = { he: 'לרקמות בלבד (שותפות)', en: 'weaves only (partnership)' };
  const scBoth = { he: 'גם לרקמות וגם ללקוחות', en: 'weaves and customers' };
  const scCustomers = { he: 'ללקוחות בלבד (כמוצר)', en: 'customers only (as a product)' };
  const scNote = {
    he: 'פרסום ללקוחות יוצר עמוד מוצר עם המחיר שלמעלה. אם אין לך עדיין ריקמה שתנהל את המכירות — נקים לך אחת, ותמיד אפשר להזמין אליה שותפים.',
    en: 'Offering to customers creates a product page with the price above. If you do not yet have a weave to manage the sales, one will be created for you — and you can always invite partners into it.'
  };
</script>

{#if error1 !== null}
  {error1}
{:else}
  <div class="dd md:items-center border-2 border-gold rounded z-[1000]">
    <div class="body items-center">
      <table dir="rtl">
        <caption class="sm:text-right md:text-center text-right">
          <h1 class="md:text-center text-2xl md:text-2xl font-bold">
            משאבים שנבחרו
          </h1>
        </caption>
        <tbody>
          <tr class="gg"> </tr><tr class="ggr">
            <th class="ggr">שם</th>

            <td class="ggr">
              <div dir="rtl" class="textinput">
                <input
                  type="text"
                  id="nam"
                  name="nam"
                  bind:value={meData.name}
                  class="input"
                  required
                />
                <label for="nam" class="label">שם</label>
                <span class="line"></span>
              </div>
            </td>
          </tr>
          <tr>
            <th>תיאור</th>
            <td>
              <div dir="rtl" class="textinput">
                <input
                  bind:value={meData.descrip}
                  type="text"
                  class="input"
                  required
                />
                <label for="name" class="label">תיאור</label>
                <span class="line"></span>
              </div>
            </td>
          </tr>
          <tr>
            <th>עלות</th>
            <td>
              <div dir="rtl" class="textinput">
                <input
                  bind:value={meData.price}
                  type="number"
                  class="input"
                  required
                />
                <label for="name" class="label"
                  >שווי כספי <span style="display:{meData.m ? '' : 'none'};"
                    >לכל חודש</span
                  ><span style="display:{meData.y ? '' : 'none'};">לכל שנה</span
                  ><span style="display:{meData.r ? '' : 'none'};"
                    >לכל התקופה</span
                  ><span style="display:{kc ? '' : 'none'};">ליחידה</span>
                </label>
                <span class="line"></span>
              </div>
            </td></tr
          ><tr>
            <th>שווי להשקעה בריקמה</th>
            <td>
              <div dir="rtl" class="textinput">
                <input
                  bind:value={meData.myp}
                  type="number"
                  class="input"
                  required
                />
                <label for="name" class="label"
                  >שווי מבוקש <span style="display:{meData.m ? '' : 'none'};"
                    >לכל חודש</span
                  ><span style="display:{meData.y ? '' : 'none'};">לכל שנה</span
                  ><span style="display:{meData.r ? '' : 'none'};"
                    >לכל התקופה</span
                  ><span style="display:{kc ? '' : 'none'};">ליחידה</span>
                </label>
                <span class="line"></span>
              </div>
            </td></tr
          >
          <tr>
            <th>סוג</th>
            <td>
              <select
                bind:value={meData.kindOf}
                onchange={() => myMissionH()}
                class="round form-select appearance-none
      block
      w-full
      px-3
      py-1.5
      text-barbi
      font-normal
      bg-gold bg-clip-padding bg-no-repeat
      border border-solid border-gold
      rounded
      transition
      ease-in-out
      m-0
      focus:text-barbi focus:bg-gold focus:border-barbi focus:outline-none"
              >
                <option value="total">{ot[$lang]}</option>
                <option value="monthly">{pm[$lang]}</option>
                <option value="yearly">{pye[$lang]}</option>
                <option value="perUnit">{py[$lang]}</option>
                <option value="rent">{re[$lang]}</option>
              </select>
            </td>
          </tr>
          <tr>
            <th>{scLabel[$lang]}</th>
            <td>
              <select
                bind:value={meData.offerScope}
                class="round form-select appearance-none
      block
      w-full
      px-3
      py-1.5
      text-barbi
      font-normal
      bg-gold bg-clip-padding bg-no-repeat
      border border-solid border-gold
      rounded
      transition
      ease-in-out
      m-0
      focus:text-barbi focus:bg-gold focus:border-barbi focus:outline-none"
              >
                <option value="rikma">{scRikma[$lang]}</option>
                <option value="both">{scBoth[$lang]}</option>
                <option value="customers">{scCustomers[$lang]}</option>
              </select>
              {#if meData.offerScope === 'customers' || meData.offerScope === 'both'}
                <p class="text-sm text-barbi mt-1" dir={$lang === 'he' ? 'rtl' : 'ltr'}>
                  {scNote[$lang]}
                </p>
              {/if}
            </td>
          </tr>
          <tr style="display:{kc ? '' : 'none'};">
            <th>כמות</th>
            <td>
              <div
                style="display:{meData.kc ? '' : 'none'};"
                dir="rtl"
                class="textinput"
              >
                <input
                  bind:value={meData.hm}
                  type="number"
                  class="input"
                  required
                />
                <label for="name" class="label">כמות</label>
                <span class="line"></span>
              </div>
            </td></tr
          ><tr style="display:{ky ? '' : 'none'};">
            <th>תאריך התחלה </th>
            <td
              ><input
                class="bg-gold hover:bg-mtork border-2 border-barbi rounded"
                type="datetime-local"
                style="display:{meData.ky ? '' : 'none'};"
                placeholder="הוספת תאריך התחלה"
                bind:value={meData.dates}
              /></td
            >
          </tr>
          <tr style="display:{ky ? '' : 'none'};">
            <th>תאריך סיום </th>
            <td
              ><input
                class="bg-gold hover:bg-mtork border-2 border-barbi rounded"
                style="display:{meData.ky ? '' : 'none'};"
                type="datetime-local"
                placeholder="הוספת תאריך סיום"
                bind:value={meData.datef}
              /></td
            >
          </tr>
          <tr>
            <th>הערות מיוחדות</th>
            <td>
              <div dir="rtl" class="textinput">
                <input
                  bind:value={meData.spnot}
                  type="text"
                  class="input"
                  required
                />
                <label for="name" class="label">הערות מיוחדות</label>
                <span class="line"></span>
              </div>
            </td>
          </tr>
          <tr>
            <th>לינק לפרטי מוצר\ מחיר \ רכישה</th>
            <td>
              <div dir="rtl" class="textinput">
                <input
                  bind:value={meData.linkto}
                  type="text"
                  class="input"
                  required
                />
                <label for="name" class="label">לינק</label>
                <span class="line"></span>
              </div></td
            >
          </tr>
        </tbody>
      </table>
    </div>
    <div>
      {#if already === false}
        <button
          class="bg-gradient-to-br hover:from-gra hover:via-grb hover:via-gr-c hover:via-grd hover:to-gre from-barbi to-mpink text-gold hover:text-barbi font-bold py-2 px-4 rounded-full"
          onclick={han}>פרסום משאבים</button
        >
      {:else}
        <RingLoader size="80" color="#ff00ae" unit="px" duration="2s"
        ></RingLoader>
      {/if}
    </div>
  </div>
{/if}

<style>
  select.round {
    background-image:
      linear-gradient(315deg, transparent 50%, rgb(0, 174, 255) 50%),
      linear-gradient(225deg, rgb(0, 174, 255) 50%, transparent 50%),
      radial-gradient(#ddd 70%, transparent 72%);
    background-position:
      calc(0% + 20px) calc(1em + 2px),
      calc(0% + 15px) calc(1em + 2px),
      calc(0% + 0.5em) 0.5em;
    background-size:
      5px 5px,
      5px 5px,
      1.5em 1.5em;
    background-repeat: no-repeat;
  }

  select.round:focus {
    background-image:
      linear-gradient(315deg, white 50%, transparent 50%),
      linear-gradient(225deg, transparent 50%, white 50%),
      radial-gradient(gray 70%, transparent 72%);
    background-position:
      calc(0% + 15px) 1em,
      calc(0% + 20px) 1em,
      calc(0% + 0.5em) 0.5em;
    background-size:
      5px 5px,
      5px 5px,
      1.5em 1.5em;
    background-repeat: no-repeat;
    border-color: green;
    outline: 0;
  }
  .gg {
    background-color: var(--naim) !important;
    border-width: 4px;
    border-color: rgb(103, 232, 249);
    border-radius: 4%;
    opacity: 1;
  }
  .ggr {
    background-color: var(--naim) !important;
    opacity: 1;
  }
  .ggr:hover,
  .gg:hover {
    background: rgb(132, 241, 223);
  }
  .dd {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
  }
  .body {
    z-index: 999;
    overflow-x: auto;
    overflow-y: auto;
    min-width: 96vw;
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
  th,
  td {
    background: var(--gold);
    min-width: 150px;
  }

  th:hover,
  td:hover {
    background: rgb(132, 241, 223);
  }

  .textinput {
    position: relative;
    width: 100%;
    display: block;
  }

  .input {
    border: none;
    margin: 0;
    padding: 10px 0;
    outline: none;
    border-bottom: solid 1px var(--mturk);
    font-size: 15px;
    margin-top: 12px;
    width: 100%;
    color: var(--barbi-pink);
    -webkit-tap-highlight-color: transparent;
    background: transparent;
  }

  .label {
    font-size: 15px;
    position: absolute;
    right: 0;
    top: 22px;
    transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
    pointer-events: none;
    color: var(--barbi-pink);
    user-select: none;
  }

  .line {
    height: 2px;
    background-color: #2196f3;
    position: absolute;
    transform: translateX(-50%);
    left: 50%;
    bottom: 0;
    width: 0;
    transition: 0.2s cubic-bezier(0, 0, 0.3, 1);
  }

  .input:focus ~ .line,
  .input:valid ~ .line {
    width: 100%;
  }

  .input:focus ~ .label,
  .input:valid ~ .label {
    font-size: 11px;
    color: #2196f3;
    top: 0;
  }

  @media (max-width: 600px) {
    .textinput {
      position: relative;
      width: 100%;
      display: block;
    }
  }
</style>
