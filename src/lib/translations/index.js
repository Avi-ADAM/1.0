import i18n from 'sveltekit-i18n';
import lang from './lang.json';

export const config = {
    translations: {
        en: { lang },
        he: { lang },
        ar: { lang },
    },
    loaders: [
        {
            locale: 'he',
            key: 'negotiation',
            routes: [/^\/negotiation/], 
            loader: async () => (await import('./he/negotiation.json')).default,
        },
           {
            locale: 'ar',
            key: 'negotiation',
            routes: [/^\/negotiation/], 
            loader: async () => (await import('./ar/negotiation.json')).default,
        },
           {
            locale: 'en',
            key: 'negotiation',
            routes: [/^\/negotiation/], 
            loader: async () => (await import('./en/negotiation.json')).default,
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
    ],
};

export const { t, loading, locales, locale, loadTranslations } = new i18n(config);

loading.subscribe(($loading) => $loading && console.log('Loading translations...'));
