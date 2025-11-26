import { sveltekit } from '@sveltejs/kit/vite';
import { sentrySvelteKit } from '@sentry/sveltekit';
import tailwindcss from "@tailwindcss/vite";
import fs from 'fs'
//import {defineConfig} from 'vite';
import devtoolsJson from 'vite-plugin-devtools-json';
/** @type {import('vite').UserConfig} */
const config = {
  ssr: {
    noExternal: [
      'three', 
      'troika-three-text',
      'd3-array',
      'd3-format',
      'd3-geo',
      'd3-hierarchy',
      'd3-scale',
      'd3-shape',
      'layercake',
      'topojson-client',
      'bits-ui'
    ]
  },
  optimizeDeps: {
    include: [
      'd3-array',
      'd3-format',
      'd3-geo',
      'd3-hierarchy',
      'd3-scale',
      'd3-shape',
      'layercake',
      'topojson-client'
    ]
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
    sveltekit(),
    tailwindcss(),
     devtoolsJson()
  ],
  /*  server:{
    https:{
      key: fs.readFileSync('./cert.key'),
      cert: fs.readFileSync('./cert.crt')
    },
    host: true,
    port: 5173
  }*/
};

export default config;


