<script>
    import { goto } from "$app/navigation";
    import { createEventDispatcher } from "svelte";
    import { lang } from "$lib/stores/lang";

    let showMenu = false;

    const translations = {
        he: {
            profile: "פרופיל",
            timers: "טיימרים",
            calendar: "לוח שנה",
            profileMenu: "תפריט פרופיל"
        },
        en: {
            profile: "Profile",
            timers: "Timers",
            calendar: "Calendar",
            profileMenu: "Profile Menu"
        }
    };

    // SVG Icons
    const profileIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>`;
    const timersIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>`;
    const calendarIcon = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5m-9-6h.008v.008H12v-.008zM12 15h.008v.008H12v-.008zM12 18h.008v.008H12v-.008zM15.75 12h.008v.008h-.008v-.008zM15.75 15h.008v.008h-.008v-.008zM15.75 18h.008v.008h-.008v-.008zM18.75 12h.008v.008h-.008v-.008zM18.75 15h.008v.008h-.008v-.008zM18.75 18h.008v.008h-.008v-.008zM3.75 12h.008v.008H3.75v-.008zM3.75 15h.008v.008H3.75v-.008zM3.75 18h.008v.008H3.75v-.008z" /></svg>`;

    function toggleMenu() {
        showMenu = !showMenu;
    }

    function navigateTo(path) {
        goto(path);
        showMenu = false; // Close menu after navigation
    }
</script>

<div class="relative inline-flex flex-col items-center justify-center h-full px-5 rounded-e-full">
    <button on:click={toggleMenu} type="button" class="inline-flex flex-col items-center justify-center text-barbi h-full hover:bg-gray-50 dark:hover:bg-gray-800 group">
        <svg
            class="w-6 h-6 transition-transform duration-200 {showMenu ? 'rotate-180' : ''}"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M19 9l-7 7-7-7"></path>
        </svg>
        <span class="sr-only">{$lang === 'he' ? translations.he.profileMenu : translations.en.profileMenu}</span>
    </button>

    {#if showMenu}
        <div class="absolute bottom-full mb-2 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none dark:bg-gray-800">
            <div class="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                <button on:click={() => navigateTo("/me")} class="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700" role="menuitem">
                    {@html profileIcon}
                    <span class="ml-2">{$lang === 'he' ? translations.he.profile : translations.en.profile}</span>
                </button>
                <button on:click={() => navigateTo("/timers")} class="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700" role="menuitem">
                    {@html timersIcon}
                    <span class="ml-2">{$lang === 'he' ? translations.he.timers : translations.en.timers}</span>
                </button>
                <button on:click={() => navigateTo("/myCalander")} class="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-700" role="menuitem">
                    {@html calendarIcon}
                    <span class="ml-2">{$lang === 'he' ? translations.he.calendar : translations.en.calendar}</span>
                </button>
            </div>
        </div>
    {/if}
</div>

<style>
    /* ניתן להוסיף כאן סגנונות ספציפיים אם צריך */
</style>
