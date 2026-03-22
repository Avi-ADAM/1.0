// routes/api/admin/sync-vocabulary/+server.ts
// הפעל ידנית: POST /api/admin/sync-vocabulary
// או הגדר cron חיצוני (Vercel Cron, GitHub Actions, cron-job.org) לקרוא לזה

import { json, error } from '@sveltejs/kit';
import { syncVocabulary } from '$lib/jobs/sync-vocabulary';
import type { RequestHandler } from './$types';

// מפתח סודי פשוט כדי שרק אתה תוכל להפעיל
const SYNC_SECRET = process.env.SYNC_SECRET!;

export const POST: RequestHandler = async ({ request }) => {
    // וידוא הרשאה
    const auth = request.headers.get('x-sync-secret');
    if (auth !== SYNC_SECRET) {
        throw error(401, 'Unauthorized');
    }

    try {
        const start = Date.now();
        await syncVocabulary();
        return json({ ok: true, duration: Date.now() - start });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        throw error(500, msg);
    }
};

// ─── דוגמת GitHub Action לריצה כל 3 ימים ────────────────────────────────────
/*
# .github/workflows/sync-vocabulary.yml
name: Sync vocabulary to Pinecone
on:
  schedule:
    - cron: '0 3 *3 * *'   # כל 3 ימים ב-3:00 לפנות בוקר
  workflow_dispatch:         # אפשרות הפעלה ידנית

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger sync
        run: |
          curl -X POST https://1lev1.com/api/admin/sync-vocabulary \
            -H "x-sync-secret: ${{ secrets.SYNC_SECRET }}"
*/