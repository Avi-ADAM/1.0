import i18n from 'sveltekit-i18n';
import { derived } from 'svelte/store';
import lang from './lang.json';

export const config = {
    translations: {
        en: { lang },
        he: { lang },
        ar: { lang },
        ru: { lang },
    },
    loaders: [
        {
            locale: 'he',
            key: 'onboard',
            routes: [/^(?:\/he|\/en|\/ar)?\/onboard/],
            loader: async () => (await import('./he/onboard.json')).default,
        },
        {
            locale: 'he',
            key: 'bot',
            routes: [/^(?:\/he|\/en|\/ar)?\/chat/],
            loader: async () => (await import('./he/bot.json')).default,
        },
        {
            locale: 'he',
            key: 'tasks',
            routes: [/^(?:\/he|\/en|\/ar)?\/myacts/],
            loader: async () => (await import('./he/tasks.json')).default,
        },
        {
            locale: 'ar',
            key: 'onboard',
            routes: [/^(?:\/he|\/en|\/ar)?\/onboard/],
            loader: async () => (await import('./ar/onboard.json')).default,
        },
        {
            locale: 'ar',
            key: 'tasks',
            routes: [/^(?:\/he|\/en|\/ar)?\/myacts/],
            loader: async () => (await import('./ar/tasks.json')).default,
        },
        {
            locale: 'en',
            key: 'onboard',
            routes: [/^(?:\/he|\/en|\/ar)?\/onboard/],
            loader: async () => (await import('./en/onboard.json')).default,
        },
        {
            locale: 'en',
            key: 'tasks',
            routes: [/^(?:\/he|\/en|\/ar)?\/myacts/],
            loader: async () => (await import('./en/tasks.json')).default,
        },
        {
            locale: 'en',
            key: 'deals',
            routes: [/^(?:\/he|\/en|\/ar)?\/deals/],
            loader: async () => (await import('./en/deals.json')).default,
        },
        {
            locale: 'ar',
            key: 'bot',
            routes: [/^(?:\/he|\/en|\/ar)?\/chat/],
            loader: async () => (await import('./ar/bot.json')).default,
        },
        {
            locale: 'en',
            key: 'bot',
            routes: [/^(?:\/he|\/en|\/ar)?\/chat/],
            loader: async () => (await import('./en/bot.json')).default,
        },
        {
            locale: 'he',
            key: 'negotiation',
            routes: [/^(?:\/he|\/en|\/ar)?\/negotiation/],
            loader: async () => (await import('./he/negotiation.json')).default,
        },
        {
            locale: 'ar',
            key: 'negotiation',
            routes: [/^(?:\/he|\/en|\/ar)?\/negotiation/],
            loader: async () => (await import('./ar/negotiation.json')).default,
        },
        {
            locale: 'en',
            key: 'negotiation',
            routes: [/^(?:\/he|\/en|\/ar)?\/negotiation/],
            loader: async () => (await import('./en/negotiation.json')).default,
        },
        {
            locale: 'he',
            key: 'guide',
            routes: [/^(?:\/he|\/en|\/ar)?\/guid/],
            loader: async () => (await import('./he/guide.json')).default,
        },
        {
            locale: 'en',
            key: 'guide',
            routes: [/^(?:\/he|\/en|\/ar)?\/guid/],
            loader: async () => (await import('./en/guide.json')).default,
        },
        {
            locale: 'ar',
            key: 'guide',
            routes: [/^(?:\/he|\/en|\/ar)?\/guid/],
            loader: async () => (await import('./ar/guide.json')).default,
        },
        {
            locale: 'he',
            key: 'faq',
            routes: [/^\/faq/],
            loader: async () => (await import('./he/faq.json')).default,
        },
        {
            locale: 'ar',
            key: 'faq',
            routes: [/^\/faq/],
            loader: async () => (await import('./ar/faq.json')).default,
        },
        {
            locale: 'en',
            key: 'faq',
            routes: [/^\/faq/],
            loader: async () => (await import('./en/faq.json')).default,
        },
        {
            locale: 'en',
            key: 'love',
            routes: ['/love'],
            loader: async () => (await import('./en/love.json')).default,
        },
        {
            locale: 'en',
            key: 'bot',
            loader: async () => (await import('./en/bot.json')).default,
        },
        {
            locale: 'en',
            key: 'home',
            loader: async () => (await import('./en/home.json')).default,
        },
        {
            locale: 'en',
            key: 'grow',
            loader: async () => (await import('./en/grow.json')).default,
        },
        {
            locale: 'en',
            key: 'nav',
            loader: async () => (await import('./en/nav.json')).default,
        },
        {
            locale: 'en',
            key: 'auth',
            loader: async () => (await import('./en/auth.json')).default,
        },
        {
            locale: 'en',
            key: 'lev',
            loader: async () => (await import('./en/lev.json')).default,
        },
        {
            locale: 'en',
            key: 'countries',
            loader: async () => (await import('./en/countries.json')).default,
        },
        {
            locale: 'he',
            key: 'love',
            routes: ['/love'],
            loader: async () => (await import('./he/love.json')).default,
        },
        {
            locale: 'he',
            key: 'bot',
            loader: async () => (await import('./he/bot.json')).default,
        },
        {
            locale: 'he',
            key: 'home',
            loader: async () => (await import('./he/home.json')).default,
        },
        {
            locale: 'he',
            key: 'grow',
            loader: async () => (await import('./he/grow.json')).default,
        },
        {
            locale: 'he',
            key: 'nav',
            loader: async () => (await import('./he/nav.json')).default,
        },
        {
            locale: 'he',
            key: 'auth',
            loader: async () => (await import('./he/auth.json')).default,
        },
        {
            locale: 'he',
            key: 'lev',
            loader: async () => (await import('./he/lev.json')).default,
        },
        {
            locale: 'he',
            key: 'countries',
            routes: ['/love'],
            loader: async () => (await import('./he/countries.json')).default,
        },
        {
            locale: 'he',
            key: 'deals',
            routes: [/^(?:\/he|\/en|\/ar)?\/deals/],
            loader: async () => (await import('./he/deals.json')).default,
        },
        {
            locale: 'ar',
            key: 'love',
            routes: ['/love'],
            loader: async () => (await import('./ar/love.json')).default,
        },
        {
            locale: 'ar',
            key: 'bot',
            loader: async () => (await import('./ar/bot.json')).default,
        },
        {
            locale: 'ar',
            key: 'home',
            loader: async () => (await import('./ar/home.json')).default,
        },
        {
            locale: 'ar',
            key: 'grow',
            loader: async () => (await import('./ar/grow.json')).default,
        },
        {
            locale: 'ar',
            key: 'nav',
            loader: async () => (await import('./ar/nav.json')).default,
        },
        {
            locale: 'ar',
            key: 'auth',
            loader: async () => (await import('./ar/auth.json')).default,
        },
        {
            locale: 'ar',
            key: 'lev',
            loader: async () => (await import('./ar/lev.json')).default,
        },
        {
            locale: 'ar',
            key: 'countries',
            loader: async () => (await import('./ar/countries.json')).default,
        },
        {
            locale: 'ar',
            key: 'deals',
            routes: [/^(?:\/he|\/en|\/ar)?\/deals/],
            loader: async () => (await import('./ar/deals.json')).default,
        },
        {
            locale: 'ru',
            key: 'onboard',
            routes: [/^(?:\/he|\/en|\/ar|\/ru)?\/onboard/],
            loader: async () => (await import('./ru/onboard.json')).default,
        },
        {
            locale: 'ru',
            key: 'tasks',
            routes: [/^(?:\/he|\/en|\/ar|\/ru)?\/myacts/],
            loader: async () => (await import('./ru/tasks.json')).default,
        },
        {
            locale: 'ru',
            key: 'bot',
            routes: [/^(?:\/he|\/en|\/ar|\/ru)?\/chat/],
            loader: async () => (await import('./ru/bot.json')).default,
        },
        {
            locale: 'ru',
            key: 'negotiation',
            routes: [/^(?:\/he|\/en|\/ar|\/ru)?\/negotiation/],
            loader: async () => (await import('./ru/negotiation.json')).default,
        },
        {
            locale: 'ru',
            key: 'guide',
            routes: [/^(?:\/he|\/en|\/ar|\/ru)?\/guid/],
            loader: async () => (await import('./ru/guide.json')).default,
        },
        {
            locale: 'ru',
            key: 'faq',
            routes: [/^\/faq/],
            loader: async () => (await import('./ru/faq.json')).default,
        },
        {
            locale: 'ru',
            key: 'love',
            routes: ['/love'],
            loader: async () => (await import('./ru/love.json')).default,
        },
        {
            locale: 'ru',
            key: 'bot',
            loader: async () => (await import('./ru/bot.json')).default,
        },
        {
            locale: 'ru',
            key: 'home',
            loader: async () => (await import('./ru/home.json')).default,
        },
        {
            locale: 'ru',
            key: 'grow',
            loader: async () => (await import('./ru/grow.json')).default,
        },
        {
            locale: 'ru',
            key: 'nav',
            loader: async () => (await import('./ru/nav.json')).default,
        },
        {
            locale: 'ru',
            key: 'auth',
            loader: async () => (await import('./ru/auth.json')).default,
        },
        {
            locale: 'ru',
            key: 'lev',
            loader: async () => (await import('./ru/lev.json')).default,
        },
        {
            locale: 'ru',
            key: 'countries',
            loader: async () => (await import('./ru/countries.json')).default,
        },
        {
            locale: 'ru',
            key: 'deals',
            routes: [/^(?:\/he|\/en|\/ar|\/ru)?\/deals/],
            loader: async () => (await import('./ru/deals.json')).default,
        },
        {
            locale: 'ru',
            key: 'process',
            loader: async () => (await import('./ru/process.json')).default,
        },
        {
            locale: 'ru',
            key: 'timers',
            loader: async () => (await import('./ru/timers.json')).default,
        },
        {
            locale: 'ru',
            key: 'project',
            loader: async () => (await import('./ru/project.json')).default,
        },
        {
            locale: 'ru',
            key: 'mission',
            loader: async () => (await import('./ru/mission.json')).default,
        },
        {
            locale: 'he',
            key: 'process',
            loader: async () => (await import('./he/process.json')).default,
        },
        {
            locale: 'en',
            key: 'process',
            loader: async () => (await import('./en/process.json')).default,
        },
        {
            locale: 'ar',
            key: 'process',
            loader: async () => (await import('./ar/process.json')).default,
        },
        {
            locale: 'he',
            key: 'timers',
            loader: async () => (await import('./he/timers.json')).default,
        },
        {
            locale: 'en',
            key: 'timers',
            loader: async () => (await import('./en/timers.json')).default,
        },
        {
            locale: 'ar',
            key: 'timers',
            loader: async () => (await import('./ar/timers.json')).default,
        },
        {
            locale: 'he',
            key: 'project',
            loader: async () => (await import('./he/project.json')).default,
        },
        {
            locale: 'en',
            key: 'project',
            loader: async () => (await import('./en/project.json')).default,
        },
        {
            locale: 'ar',
            key: 'project',
            loader: async () => (await import('./ar/project.json')).default,
        },
        {
            locale: 'he',
            key: 'mission',
            loader: async () => (await import('./he/mission.json')).default,
        },
        {
            locale: 'en',
            key: 'mission',
            loader: async () => (await import('./en/mission.json')).default,
        },
        {
            locale: 'ar',
            key: 'mission',
            loader: async () => (await import('./ar/mission.json')).default,
        },
        {
            locale: 'he',
            key: 'location',
            loader: async () => (await import('./he/location.json')).default,
        },
        {
            locale: 'en',
            key: 'location',
            loader: async () => (await import('./en/location.json')).default,
        },
        {
            locale: 'ar',
            key: 'location',
            loader: async () => (await import('./ar/location.json')).default,
        },
        {
            locale: 'ru',
            key: 'location',
            loader: async () => (await import('./ru/location.json')).default,
        },
        {
            locale: 'he',
            key: 'demand',
            routes: [/^(?:\/he|\/en|\/ar|\/ru)?\/(demand|maagad)/, /\/moach\/[^/]+\/demand/],
            loader: async () => (await import('./he/demand.json')).default,
        },
        {
            locale: 'en',
            key: 'demand',
            routes: [/^(?:\/he|\/en|\/ar|\/ru)?\/(demand|maagad)/, /\/moach\/[^/]+\/demand/],
            loader: async () => (await import('./en/demand.json')).default,
        },
        {
            locale: 'ar',
            key: 'demand',
            routes: [/^(?:\/he|\/en|\/ar|\/ru)?\/(demand|maagad)/, /\/moach\/[^/]+\/demand/],
            loader: async () => (await import('./ar/demand.json')).default,
        },
        {
            locale: 'ru',
            key: 'demand',
            routes: [/^(?:\/he|\/en|\/ar|\/ru)?\/(demand|maagad)/, /\/moach\/[^/]+\/demand/],
            loader: async () => (await import('./ru/demand.json')).default,
        },
        {
            locale: 'he',
            key: 'concierge',
            routes: [/^(?:\/he|\/en|\/ar|\/ru)?\/(concierge|wish)/],
            loader: async () => (await import('./he/concierge.json')).default,
        },
        {
            locale: 'en',
            key: 'concierge',
            routes: [/^(?:\/he|\/en|\/ar|\/ru)?\/(concierge|wish)/],
            loader: async () => (await import('./en/concierge.json')).default,
        },
        {
            locale: 'ar',
            key: 'concierge',
            routes: [/^(?:\/he|\/en|\/ar|\/ru)?\/(concierge|wish)/],
            loader: async () => (await import('./ar/concierge.json')).default,
        },
        {
            locale: 'ru',
            key: 'concierge',
            routes: [/^(?:\/he|\/en|\/ar|\/ru)?\/(concierge|wish)/],
            loader: async () => (await import('./ru/concierge.json')).default,
        },
        {
            locale: 'he',
            key: 'offerings',
            routes: [/^(?:\/he|\/en|\/ar|\/ru)?\/(me|onboard|gift|demand|user)/],
            loader: async () => (await import('./he/offerings.json')).default,
        },
        {
            locale: 'en',
            key: 'offerings',
            routes: [/^(?:\/he|\/en|\/ar|\/ru)?\/(me|onboard|gift|demand|user)/],
            loader: async () => (await import('./en/offerings.json')).default,
        },
        {
            locale: 'ar',
            key: 'offerings',
            routes: [/^(?:\/he|\/en|\/ar|\/ru)?\/(me|onboard|gift|demand|user)/],
            loader: async () => (await import('./ar/offerings.json')).default,
        },
        {
            locale: 'he',
            key: 'consensus',
            routes: [/^(?:\/he|\/en|\/ar|\/ru)?\/consensus/],
            loader: async () => (await import('./he/consensus.json')).default,
        },
        {
            locale: 'en',
            key: 'consensus',
            routes: [/^(?:\/he|\/en|\/ar|\/ru)?\/consensus/],
            loader: async () => (await import('./en/consensus.json')).default,
        },
        {
            locale: 'ar',
            key: 'consensus',
            routes: [/^(?:\/he|\/en|\/ar|\/ru)?\/consensus/],
            loader: async () => (await import('./ar/consensus.json')).default,
        },
        {
            locale: 'ru',
            key: 'consensus',
            routes: [/^(?:\/he|\/en|\/ar|\/ru)?\/consensus/],
            loader: async () => (await import('./ru/consensus.json')).default,
        },
    ],
};

export const { t, loading, locales, locale, loadTranslations } = new i18n(config);

export const isRtl = derived(locale, ($locale) => $locale === 'he' || $locale === 'ar');

loading.subscribe(($loading) => $loading && console.log('Loading translations...'));
