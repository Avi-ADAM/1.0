<script>
  import { idPr } from '../../stores/idPr.js';
  import { t } from '$lib/translations';
  import Checkbox from '$lib/celim/ui/input/checkbox.svelte';
  import TextInput from '$lib/celim/ui/input/textInput.svelte';
  import NumberInput from '$lib/celim/ui/numberInput.svelte';
  import RichText from '$lib/celim/ui/richText.svelte';
  import Button from '$lib/celim/ui/button.svelte';
  import UploadPic from '../userPr/uploadPic.svelte';
  import { executeAction } from '$lib/client/actionClient';
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
  let error1;

  let croppedImage = $state(null);


  async function add() {
    loading = true;
    quant = quant > 0 ? quant : 1;
    price = price > 0 ? price : 0;
    already = true;

    try {
      let picId = null;
      if (croppedImage) {
        try {
          const uploadRes = await fetch('/api/upload', { method: 'POST', body: croppedImage });
          const uploadData = await uploadRes.json();
          picId = uploadData?.[0]?.id != null ? String(uploadData[0].id) : null;
        } catch (e) {
          console.log('upload failed:', e);
        }
      }

      const result = await executeAction('createComplexMatanot', {
        projectId: String($idPr),
        name,
        desc: description,
        pricingMode: 'fixed',
        fixedPrice: price,
        quant,
        unlimitedM,
        kindOf,
        dates: dates ?? null,
        datef: datef ?? null,
        oneForeProject,
        picId
      });

      if (result.success) {
        loading = false;
        success = true;
        error = false;
        onDone({ matana: result.data?.matanot ?? result.data });
      } else {
        throw new Error(result.error?.message ?? 'Failed to create matanot');
      }
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
