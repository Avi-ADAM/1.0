import { sveltekit } from '@sveltejs/kit/vite';

/** @type {import('vite').UserConfig} */
const config = {
    ssr: {
        noExternal: ['three', 'troika-three-text']
    },
    plugins: [sveltekit()]
};

export default config;