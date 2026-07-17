import vercel from '@sveltejs/adapter-vercel';
import adapter from '@sveltejs/adapter-node';
import staticAdapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
let config;

if (process.env.ADAPTER === 'vercel') {
  config = {
    kit: {
      adapter: vercel({
        runtime: 'nodejs20.x'
      })
    }
  };
} else if (process.env.ADAPTER === 'mobile') {
  // Tauri (Android/desktop) build: pure SPA, no SvelteKit server at runtime.
  // All /api/* traffic must go to the remote server (VITE_URL) — see $lib/platform.
  config = {
    kit: {
      adapter: staticAdapter({
        pages: 'build',
        assets: 'build',
        fallback: 'index.html',
        precompress: false,
        strict: false
      })
    }
  };
} else if (process.env.ADAPTER === 'static') {
  config = {
    kit: {
      adapter: staticAdapter({
        pages: 'build',
        assets: 'build',
        fallback: null,
        precompress: false
      }),
      prerender: {
        default: true
      }
    }
  };
} else {
  config = {
    kit: {
      adapter: adapter({
        out: 'build'
      }),
      // The node instance (api.1lev1.com) receives cross-origin /api/* calls
      // from the Vercel-served frontend. Without this, SvelteKit's CSRF check
      // rejects cross-origin form/multipart POSTs (/api/upload) with 403.
      // JSON POSTs pass anyway; cookie auth stays same-site (*.1lev1.com).
      csrf: {
        trustedOrigins: [
          'https://www.1lev1.com',
          'https://1lev1.com',
          'https://app.1lev1.com',
          'http://dev.1lev1.com:5173',
          'http://localhost:5173'
        ]
      }
    }
  };
}


export default config;

// Workaround until SvelteKit uses Vite 2.3.8 (and it's confirmed to fix the Tailwind JIT problem)
const mode = process.env.NODE_ENV;
const dev = mode === "development";
process.env.TAILWIND_MODE = dev ? "watch" : "build";



