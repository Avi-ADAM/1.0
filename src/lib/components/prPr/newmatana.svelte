<script>
  import { mi } from '$lib/components/prPr/mi.js';
  import { idPr } from '../../stores/idPr.js';
  import { lang } from '$lib/stores/lang.js';
  import { t } from '$lib/translations';
  import Checkbox from '$lib/celim/ui/input/checkbox.svelte';
  import TextInput from '$lib/celim/ui/input/textInput.svelte';
  import NumberInput from '$lib/celim/ui/numberInput.svelte';
  import RichText from '$lib/celim/ui/richText.svelte';
  import Button from '$lib/celim/ui/button.svelte';
  import UploadPic from '../userPr/uploadPic.svelte';
  import axios from 'axios';
  import { page } from '$app/state';
  let oneForeProject = $state(false);
  let description = $state('');
  let loading = $state(false);
  let success = $state(false);
  let error = $state(false);
  let price = $state(0);
  let unlimitedM = $state(false);
  let quant = $state(1);
  let kindOf = $state('total');
  let name = $state('');
  let bearer1;
  let token;
  let error1;
  let miDatan = [];
  let linkg = import.meta.env.VITE_URL + '/graphql';

  let croppedImage = $state(null);
  const baseUrl = import.meta.env.VITE_URL;

  let url1 = baseUrl + '/api/upload';


  async function add() {
    loading = true;
    console.log(description);
    let imageId = null;
    quant = quant > 0 ? quant : 1;
    price = price > 0 ? price : 0;

    let d = new Date();
    already = true;

    token = page.data.tok;
    bearer1 = 'bearer' + ' ' + token;
    try {
      if (croppedImage) {
        try {
          const response = await axios.post(url1, croppedImage, {
            headers: {
              Authorization: bearer1
            }
          });
          imageId = response.data[0].id;
          console.log('imageId', imageId);
        } catch (error) {
          console.log('צריך לתקן:', error.response);
        }
      }
      // GraphQL mutation without image
      console.log(dates, datef);
      const sdate = new Date(dates) || null;
      const fdate = new Date(datef) || null;
      const response = await fetch(linkg, {
        method: 'POST',
        headers: {
          Authorization: bearer1,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: `mutation {
              createMatanot(
                data: {
                ${imageId ? `pic: "${imageId}",` : ``}
                  projectcreates: "${$idPr}"
                  name: """${name}"""
                  price: ${price}
                  quant: ${unlimitedM ? -1 : quant}
                  desc: """${description}"""	
                  publishedAt: "${d.toISOString()}"
                  kindOf: ${kindOf}
                 ${sdate !== null ? `	 startDate: "${sdate.toISOString()}" ` : ``}	
                 ${fdate !== null ? `	finnishDate: "${fdate.toISOString()}" ` : ``}
                  oneForeProject: ${oneForeProject}
                }
              ) {
                data {
                  id
                  attributes {
                    name
                    price
                    quant
                    kindOf
                  }
                }
              }
            }`
        })
      });

      const result = await response.json();
      miDatan = result;

      console.log(miDatan);
      loading = false;
      success = true;
      error = false;
      onDone({
        matana: miDatan.data.createMatanot.data
      });
    } catch (e) {
      error1 = e;
      console.log(error1);
      error = true;
      loading = false;
    }
  }
  let totalV = $state(0);

  let already = false,
    dates = $state(null),
    datef = $state(null);
  $effect(() => {
    if (dates !== null && datef !== null) {
      totalV = 0;
      let quanter = unlimitedM === true ? 1 : quant;
      let a = new Date(dates);
      let b = new Date(datef);
      if (kindOf == 'monthly') {
        totalV =
          ((b.getFullYear() - a.getFullYear()) * 12 +
            (b.getMonth() - a.getMonth())) *
          price *
          quanter;
        console.log(
          (b.getFullYear() - a.getFullYear()) * 12 +
            (b.getMonth() - a.getMonth()),
          price,
          quant,
          totalV
        );
      } else if (kindOf == 'yearly') {
        totalV = (b.getFullYear() - a.getFullYear()) * price * quant;
      }
    } else {
      let quanter = unlimitedM === true || kindOf == 'unlimited' ? 1 : quant;
      totalV = price * quanter;
    }
  });
  /**
   * @typedef {Object} Props
   * @property {(data: { matana: any }) => void} [onDone] - Callback function triggered when the gift creation is complete.
   */

  /** @type {Props} */
  let { onDone } = $props();
  //תמונה מלבנית
</script>

<div class="flex flex-col align-middle justify-center gap-x-2">
  <h2 class="text-barbi font-bold text-center underline">{$t('project.newmatana.create')}</h2>
  <TextInput lebel={{ he: 'שם', en: 'Name', ar: 'الاسم' }} bind:text={name} />
  <br />
  <small class="text-center text-barbi">{$t('project.newmatana.description')}:</small>
  <RichText bind:outpot={description} editable={true} />
  <NumberInput
    bind:value={price}
    topLebel={$t('project.newmatana.price')}
    barbi={true}
    noNegative={true}
  />

  <h2 class="text-center text-barbi">{$t('project.newmatana.type')}</h2>
  <select
    bind:value={kindOf}
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
    <option value="" disabled selected hidden>{$t('project.newmatana.perUnit')}</option>
    <option value="monthly">{$t('project.newmatana.monthly')}</option>
    <option value="yearly">{$t('project.newmatana.yearly')}</option>
    <option value="total">{$t('project.newmatana.perUnit')}</option>
    <option value="unlimited">{$t('project.newmatana.unlimited')}</option>
  </select>
  {#key unlimitedM}
    {#if kindOf !== 'unlimited' && unlimitedM === false}
      <NumberInput
        bind:value={quant}
        topLebel={$t('project.newmatana.availableQuantity')}
        barbi={true}
        noNegative={true}
      />
    {/if}
  {/key}
  {#if kindOf == 'monthly' || kindOf == 'yearly'}
    <Checkbox bind:value={unlimitedM} lebel={{ he: 'ליחידה - ללא הגבלה', en: 'unlimited', ar: 'غير محدود' }} />
    <small class="text-center text-barbi"
      >{$t('project.newmatana.startDate')} - {$t('project.newmatana.optional')}</small
    >
    <input
      class="bg-gold hover:bg-mtork border-2 border-barbi rounded max-w-full"
      type="datetime-local"
      placeholder={$t('project.newmatana.startDate')}
      bind:value={dates}
    />
    <br />
    <small class="text-center text-barbi"
      >{$t('project.newmatana.endDate')} - {$t('project.newmatana.optional')}</small
    >
    <input
      class="bg-gold hover:bg-mtork border-2 border-barbi rounded max-w-full"
      type="datetime-local"
      placeholder={$t('project.newmatana.endDate')}
      bind:value={datef}
      min={dates}
    />
    <br />
  {/if}
  <small class="text-center text-barbi">{$t('project.newmatana.total')}:</small>
  <h2 class="text-center text-barbi">
    {totalV.toLocaleString()}
    {#if unlimitedM === true || kindOf == 'unlimited'}
      {$t('project.newmatana.forEachUnit')}
    {/if}
  </h2>

  <br />
  <UploadPic
    aspect={16 / 9}
    cropShape="rect"
    onMessage={(e) => (croppedImage = e.files)}
    color={true}
    current={'/cover.png'}
  />
  <br />
  <Checkbox
    bind:value={oneForeProject}
    lebel={{ he: 'מוצר יחיד לפרויקט', en: 'one product for one project', ar: 'منتج واحد لكل مشروع' }}
  />
  <Button text={{ he: 'הוספת מוצר', en: 'Add product', ar: 'إضافة منتج' }} onClick={add} {loading} {success} {error} />
</div>
