<script>
  import { goto } from '$app/navigation';
  import { lang } from '$lib/stores/lang';

  let showMenu = $state(false);

  const translations = {
    he: {
      more: 'עוד',
      deals: 'עסקאות',
      profile: 'פרופיל',
      timers: 'טיימרים',
      calendar: 'לוח שנה',
      salesCenter: 'מרכז מכירות',
      profileMenu: 'תפריט פרופיל',
      meeting: 'פגישות',
      myActs: 'המטלות שלי'
    },
    en: {
      more: 'More',
      deals: 'Deals',
      profile: 'Profile',
      timers: 'Timers',
      calendar: 'Calendar',
      salesCenter: 'Sales Center',
      profileMenu: 'Profile Menu',
      meeting: 'Meetings',
      myActs: 'My Tasks'
    },
    ar: {
      more: 'المزيد',
      deals: 'صفقات',
      profile: 'الملف الشخصي',
      timers: 'المؤقتات',
      calendar: 'التقويم',
      salesCenter: 'مركز المبيعات',
      profileMenu: 'قائمة الملف الشخصي',
      meeting: 'اجتماعات',
      myActs: 'مهامي'
    }
  };

  // SVG Icons
  const profileIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>`;
  const timersIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
  const calendarIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12v-.008zM12 18h.008v.008H12v-.008zM15.75 12h.008v.008h-.008v-.008zM15.75 15h.008v.008h-.008v-.008zM15.75 18h.008v.008h-.008v-.008zM18.75 12h.008v.008h-.008v-.008zM18.75 15h.008v.008h-.008v-.008zM18.75 18h.008v.008h-.008v-.008zM3.75 12h.008v.008H3.75v-.008zM3.75 15h.008v.008H3.75v-.008zM3.75 18h.008v.008H3.75v-.008z" /></svg>`;
  const salesIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 3h1.386c.51 0 .955.343 1.087.835l.383 1.437M7.5 14.25a3 3 0 00-3 3h15.75m-12.75-3h11.218c1.121-2.3 2.1-4.684 2.924-7.138a60.114 60.114 0 00-16.536-1.84M7.5 14.25L5.106 5.272M6 20.25a.75.75 0 11-1.5 0 .75.75 0 011.5 0zm12.75 0a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" /></svg>`;
  const meetingIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="m15.75 10.5 4.72-4.72a.75.75 0 0 1 1.28.53v11.38a.75.75 0 0 1-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 0 0 2.25-2.25v-9a2.25 2.25 0 0 0-2.25-2.25h-9A2.25 2.25 0 0 0 2.25 7.5v9a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>`;
  const dealsIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.216.42-6.378.42s-4.291-.143-6.378-.42c-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25A2.25 2.25 0 0013.5 3h-3a2.25 2.25 0 00-2.25 2.25v.894m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>`;
  const myActsIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12h3.75M9 15h3.375M9 18h3.375m-3.562-12C8.344 3.97 9.878 3 12 3s3.656.97 3.812 3m-7.625 0h7.625m-7.625 0A1.5 1.5 0 005.25 7.5v12a1.5 1.5 0 001.5 1.5h10.5a1.5 1.5 0 001.5-1.5v-12a1.5 1.5 0 00-1.5-1.5m-7.625 0h7.625" /></svg>`;

  function toggleMenu() {
    showMenu = !showMenu;
  }

  function navigateTo(path) {
    goto(path);
    showMenu = false; // Close menu after navigation
  }
</script>

<div
  class="relative inline-flex flex-col items-center justify-center h-full px-2 rounded-e-full"
>
  <button
    onclick={toggleMenu}
    type="button"
    class="inline-flex flex-col items-center justify-center gap-0.5 text-barbi h-full w-full hover:bg-gray-50 dark:hover:bg-gray-800 group"
  >
    <svg
      class="w-6 h-6 transition-transform duration-200 {showMenu
        ? 'rotate-180'
        : ''}"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        stroke-linecap="round"
        stroke-linejoin="round"
        stroke-width="3"
        d="M19 9l-7 7-7-7"
      ></path>
    </svg>
    <span class="text-[9px] leading-none text-gray-500 dark:text-gray-300">
      {translations[$lang]?.more || translations.en.more}
    </span>
    <span class="sr-only">
      {translations[$lang]?.profileMenu || translations.en.profileMenu}
    </span>
  </button>

  {#if showMenu}
    <div
      class="absolute bottom-full mb-2 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800"
    >
      <div
        class="py-1"
        role="menu"
        aria-orientation="vertical"
        aria-labelledby="options-menu"
      >
        <button
          onclick={() => navigateTo('/me')}
          class="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          role="menuitem"
        >
          {@html profileIcon}
          <span class="mx-2">
            {translations[$lang]?.profile || translations.en.profile}
          </span>
        </button>
        <!-- Deals moves in here on screens too narrow for its footer tab -->
        <button
          onclick={() => navigateTo('/deals')}
          class="hidden max-[399px]:flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          role="menuitem"
        >
          {@html dealsIcon}
          <span class="mx-2">
            {translations[$lang]?.deals || translations.en.deals}
          </span>
        </button>
        <button
          onclick={() => navigateTo('/myacts')}
          class="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          role="menuitem"
        >
          {@html myActsIcon}
          <span class="mx-2">
            {translations[$lang]?.myActs || translations.en.myActs}
          </span>
        </button>
        <button
          onclick={() => navigateTo('/sales-center')}
          class="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          role="menuitem"
        >
          {@html salesIcon}
          <span class="mx-2">
            {translations[$lang]?.salesCenter || translations.en.salesCenter}
          </span>
        </button>
        <button
          onclick={() => navigateTo('/timers')}
          class="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          role="menuitem"
        >
          {@html timersIcon}
          <span class="mx-2">
            {translations[$lang]?.timers || translations.en.timers}
          </span>
        </button>
        <button
          onclick={() => navigateTo('/myCalander')}
          class="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          role="menuitem"
        >
          {@html calendarIcon}
          <span class="mx-2">
            {translations[$lang]?.calendar || translations.en.calendar}
          </span>
        </button>
        <button
          onclick={() => navigateTo('/meeting')}
          class="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700"
          role="menuitem"
        >
          {@html meetingIcon}
          <span class="mx-2">
            {translations[$lang]?.meeting || translations.en.meeting}
          </span>
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  /* ניתן להוסיף כאן סגנונות ספציפיים אם צריך */
</style>
