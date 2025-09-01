import i18n from 'sveltekit-i18n';
import lang from './lang.json';

export const config = {
    translations: {
        en: { lang },
        he: { lang },
    },
    loaders: [
        {
            locale: 'en',
            key: 'love',
            loader: async () => (await import('./en/love.json')).default,
        },
        {
            locale: 'en',
            key: 'bot',
            loader: async () => (await import('./en/bot.json')).default,
        },
      /*  {
            locale: 'en',
            key: 'about',
            routes: ['/about'],
            loader: async () => (await import('./en/about.json')).default,
        },
        {
            locale: 'en',
            key: 'home',
            routes: ['/'],
            loader: async () => (await import('./en/home.json')).default,
        },*/
        {
            locale: 'he',
            key: 'love',
            loader: async () => (await import('./he/love.json')).default,
        },
        {
            locale: 'he',
            key: 'bot',
            loader: async () => (await import('./he/bot.json')).default,
        },
      /*  {
            locale: 'cs',
            key: 'about',
            routes: ['/about'],
            loader: async () => (await import('./cs/about.json')).default,
        },
        {
            locale: 'cs',
            key: 'home',
            routes: ['/'],
            loader: async () => (await import('./cs/home.json')).default,
        },*/
    ],
};

export const { t, loading, locales, locale, loadTranslations } = new i18n(config);

loading.subscribe(($loading) => $loading && console.log('Loading translations...'));
