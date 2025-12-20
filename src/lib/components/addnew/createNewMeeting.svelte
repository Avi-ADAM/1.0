<script>
  import { username } from '$lib/stores/pendMisMes';
  import { page } from '$app/state';
  /**
   * Callback function when the meeting creation process is closed.
   * @type {() => void}
   */
  let { onClose } = $props();
  import Close from '$lib/celim/close.svelte';
  import Button from '$lib/celim/ui/button.svelte';
  import TextInput from '$lib/celim/ui/input/textInput.svelte';
  import RichText from '$lib/celim/ui/richText.svelte';
  import { sendToSer } from '$lib/send/sendToSer.js';
  import { lang } from '$lib/stores/lang';
  import { onMount } from 'svelte';
  import { MultiSelect } from 'svelte-multiselect';
  const placeholder = {
    he: 'צירוף לפגישה',
    en: 'Choose Users to add to your meeting'
  };
  const addn = { he: 'עוד פרטים על הפגישה', en: 'Add meeting details' };
  const head = { he: 'יצירת פגישת זהב חדשה', en: 'Create New Gold Meeting' };
  const explanetion = {
    he: 'פגישת זהב היא פגישה ללא תאריך מוגדר מראש, זמן הפגישה נקבע בזמן הזהב הזמן שנוח ומסתדר לכל המשתתפים והמשתתפות.',
    en: "Gold meeting is a meeting without a predefined date, the time of meeting is set in the golden timing when it is compteble for all the participant's."
  };
  const second = {
    he: 'בכדי שהקסם יקרה יש לעדכן סטטוס ללייב בכל פעם שיש לך זמן לפגישה, ניתן לעדכן כאן למעלה או דרך הבוט שלנו לטלגרם',
    en: 'For the magic to happen, you have to update the status to live when you are avauilable for the meeting, you can update it in the top or through our telegram bot.'
  };
  let name = $state('');
  let sucsses = $state(false);

  let loadingBtn = $state(false);

  let error = $state(false);

  let outpot = $state('');
  $inspect(outpot, 'outpot');
  let explanetionOpen = $state(false);
  let users = $state([]);
  let selected = $state([]);
  let loading = $state(true);
  onMount(async () => {
    await sendToSer({}, '17getUsers', null, null, false, fetch).then((data) => {
      users = data.data.usersPermissionsUsers.data;
      let me = page.data.uid;
      selected.push(users.filter((u) => u.id == me)[0].attributes.username);
      selected = selected;
      loading = false;
    });
  });
  async function create() {
    loadingBtn = true;

    // Map selected usernames to IDs
    const selectedIds = selected
      .map((username) => {
        const user = users.find((u) => u.attributes.username === username);
        return user ? user.id : null;
      })
      .filter((id) => id !== null);

    try {
      const response = await fetch('/api/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          actionKey: 'createNewMeeting',
          params: {
            name,
            outpot,
            selected: selectedIds,
            initiatorName: $username
          }
        })
      });

      const result = await response.json();

      if (result.success) {
        loadingBtn = false;
        sucsses = true;
        setTimeout(() => {
          onClose?.();
        }, 5000);
      } else {
        console.error('Action failed:', result.error);
        loadingBtn = false;
        error = true;
      }
    } catch (e) {
      console.error('Error calling action:', e);
      loadingBtn = false;
      error = true;
    }
  }
</script>

<div
  dir={$lang == 'he' || $lang == 'ar' ? 'rtl' : 'ltr'}
  class="flex flex-col p-4 min-h-[85vh] h-fit"
>
  <div class="text-center gap-2 flex flex-row justify-center items-center">
    <h1
      class="font-bold text-center underline text-decoration-solid"
      style="font-size: 1rem; line-height: normal; color: var(--barbi-pink); "
    >
      {head[$lang]}
    </h1>
    {#if explanetionOpen == false}
      <button
        class="text-center ww"
        style="font-size: 0.8rem; line-height: normal; color: white; "
        onclick={() => (explanetionOpen = true)}>?</button
      >
    {/if}
  </div>
  {#if explanetionOpen}
    <div
      class="text-center justify-center bg-wow bg-opacity-25"
      style="font-size: 0.8rem; line-height: normal; color: var(--barbi-pink); "
    >
      <button
        class="text-center"
        style="font-size: 0.8rem; line-height: normal; color: var(--barbi-pink); "
        onclick={() => (explanetionOpen = false)}><Close /></button
      >
      <p
        class="text-center"
        style="font-size: 0.8rem; line-height: normal; color: var(--barbi-pink); "
      >
        {explanetion[$lang]}
      </p>
      <p
        class="text-center"
        style="font-size: 0.8rem; line-height: normal; color: var(--barbi-pink); "
      >
        {second[$lang]}
      </p>
    </div>
  {/if}
  <TextInput
    color="barbi"
    bind:text={name}
    label={{ he: 'שם הפגישה', en: 'Meeting Name' }}
  />
  <h3 class="text-start underline decoration-barbi text-barbi">
    {addn[$lang]}
  </h3>
  <RichText bind:outpot />
  <h3 class="text-start underline decoration-barbi text-barbi">
    {placeholder[$lang]}
  </h3>
  <MultiSelect
    {loading}
    bind:selected
    options={users.map((c) => c.attributes.username)}
    placeholder={placeholder[$lang]}
    outerDivClass="!bg-gold !text-barbi"
    inputClass="!bg-gold !text-barbi"
  />
  <div class="flex items-center justify-center w-full">
    <div class="w-fit m-4">
      <Button onClick={create} loading={loadingBtn} {error} success={sucsses} />
    </div>
  </div>
</div>

<style>
  .ww {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: rgb(26, 188, 156);
    background: -moz-linear-gradient(
      -45deg,
      rgba(26, 188, 156, 1) 0%,
      rgba(142, 68, 173, 1) 100%
    );
    background: -webkit-linear-gradient(
      -45deg,
      rgba(26, 188, 156, 1) 0%,
      rgba(142, 68, 173, 1) 100%
    );
    background: linear-gradient(
      135deg,
      rgba(26, 188, 156, 1) 0%,
      rgba(142, 68, 173, 1) 100%
    );

    box-shadow: 0 5px 15px 0px rgba(0, 0, 0, 0.6);
    transform: translatey(0px);
    animation: float 6s ease-in-out infinite;
  }
  @keyframes float {
    0% {
      box-shadow: 0 5px 15px 0px rgba(0, 0, 0, 0.6);
      transform: translatey(0px);
    }
    50% {
      box-shadow: 0 25px 15px 0px rgba(0, 0, 0, 0.2);
      transform: translatey(10px);
    }
    100% {
      box-shadow: 0 5px 15px 0px rgba(0, 0, 0, 0.6);
      transform: translatey(0px);
    }
  }
</style>
