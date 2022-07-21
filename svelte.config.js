import vercel from '@sveltejs/adapter-vercel';
import adapter from '@sveltejs/adapter-static';
import preprocess from "svelte-preprocess";

/** @type {import('@sveltejs/kit').Config} */
let config;
if (process.env.VITE_ENVI == "versel") {
  config = {
    kit: {
      adapter: vercel({
        edge: false,
      }
      )
    },
    preprocess: [preprocess({
      "postcss": true
    })]
  };
} else {
  config = { 
    kit: {
      adapter: adapter({
        // default options are shown. On some platforms
        // these options are set automatically — see below
        pages: 'build',
        assets: 'build',
        fallback: null,
        precompress: false
      }),
      preprocess: [preprocess({
        "postcss": true
      })],
      prerender: {
        // This can be false if you're using a fallback (i.e. SPA mode)
        default: true
      }
    }
  };
}
export default config;
// Workaround until SvelteKit uses Vite 2.3.8 (and it's confirmed to fix the Tailwind JIT problem)
const mode = process.env.NODE_ENV;
const dev = mode === "development";
process.env.TAILWIND_MODE = dev ? "watch" : "build";



