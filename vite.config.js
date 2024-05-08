import { sveltekit } from '@sveltejs/kit/vite';
import { sentrySvelteKit } from '@sentry/sveltekit';


/** @type {import('vite').UserConfig} */
const config = {
  ssr: {
    noExternal: ['three', 'troika-three-text']
  },
  plugins: [/*sentrySvelteKit({
      sourceMapsUploadOptions: {
        org: "1lev1",
        project: "front",
        authToken: process.env.VITE_SENTRY_AUTH_TOKEN,
        cleanArtifacts: true,
        rewrite: false,
      },
    }),*/
    sveltekit()]
};

export default config;