<script lang="ts">
  import { t } from '$lib/translations';
  import { csvToInputs, MAX_IMPORT_BYTES, MAX_IMPORT_ROWS, type CsvImportPreview } from '$lib/growth/csv';
  import { errorKey, runGrowth } from '$lib/growth/client';

  /**
   * CSV import (§3.2). The preview is the browser's reading of the file; the
   * server reads it again and decides — duplicates and bad rows are reported
   * per line, never silently dropped.
   */
  let text = $state('');
  let fileName = $state('');
  let preview = $state<CsvImportPreview | null>(null);
  let busy = $state(false);
  let err = $state<string | null>(null);
  let result = $state<{
    imported: number;
    duplicates: { line: number; name: string; inFile: boolean }[];
    invalid: { line: number; code: string; field: string }[];
    truncated: boolean;
  } | null>(null);

  async function pick(e: Event) {
    const file = (e.currentTarget as HTMLInputElement).files?.[0];
    err = null;
    result = null;
    preview = null;
    if (!file) return;
    if (file.size > MAX_IMPORT_BYTES) {
      err = 'FILE_TOO_LARGE';
      return;
    }
    fileName = file.name;
    text = await file.text();
    preview = csvToInputs(text, fileName);
  }

  async function run() {
    busy = true;
    err = null;
    const r = await runGrowth<NonNullable<typeof result>>('growthImportProspects', { csv: text, fileName });
    busy = false;
    if (r.ok) {
      result = r.data;
      preview = null;
    } else err = (r as Extract<typeof r, { ok: false }>).code;
  }

  const SAMPLE = 'name,website,phone,email,city,region,category,services,source\n';
</script>

<div class="gr-card sh-card">
  <h2>{$t('growth.csv.title')}</h2>
  <p class="gr-muted">{$t('growth.csv.body', { max: MAX_IMPORT_ROWS })}</p>
  <code class="gr-msg gr-small" dir="ltr">{SAMPLE}</code>
  <input type="file" accept=".csv,text/csv,text/plain" onchange={pick} aria-label={$t('growth.csv.pick')} />

  {#if preview}
    {#if preview.noNameColumn}
      <p class="gr-error" role="alert">{$t('growth.errors.NO_NAME_COLUMN')}</p>
    {:else}
      <p>{$t('growth.csv.found', { count: preview.rows.length })}</p>
      <p class="gr-muted gr-small">
        {$t('growth.csv.columns')}:
        {preview.columns.map((c) => c ?? '—').join(' · ')}
      </p>
      {#if preview.missingName.length}
        <p class="gr-muted gr-small">{$t('growth.csv.missingName', { lines: preview.missingName.slice(0, 20).join(', ') })}</p>
      {/if}
      {#if preview.tooMany}<p class="gr-muted gr-small">{$t('growth.csv.tooMany', { max: MAX_IMPORT_ROWS })}</p>{/if}
      <div class="gr-table-wrap">
        <table class="gr-table">
          <thead>
            <tr>
              <th>{$t('growth.form.name')}</th>
              <th>{$t('growth.form.category')}</th>
              <th>{$t('growth.form.city')}</th>
              <th>{$t('growth.form.website')}</th>
            </tr>
          </thead>
          <tbody>
            {#each preview.rows.slice(0, 5) as r, i (i)}
              <tr><td>{r.name}</td><td>{r.category ?? ''}</td><td>{r.city ?? ''}</td><td dir="ltr">{r.website ?? ''}</td></tr>
            {/each}
          </tbody>
        </table>
      </div>
      <div class="gr-row">
        <button class="sh-btn sh-btn-primary" onclick={run} disabled={busy || !preview.rows.length}>
          {$t('growth.csv.import', { count: preview.rows.length })}
        </button>
      </div>
    {/if}
  {/if}

  {#if err}<p class="gr-error" role="alert">{$t(errorKey(err))}</p>{/if}

  {#if result}
    <div class="sh-card-2 gr-card" role="status">
      <p class="gr-ok">{$t('growth.csv.imported', { count: result.imported })}</p>
      {#if result.duplicates.length}
        <p>{$t('growth.csv.duplicates', { count: result.duplicates.length })}</p>
        <ul class="gr-list gr-small">
          {#each result.duplicates.slice(0, 30) as d (d.line)}
            <li>{$t('growth.csv.line', { line: d.line })} — {d.name} ({d.inFile ? $t('growth.csv.dupInFile') : $t('growth.csv.dupInStore')})</li>
          {/each}
        </ul>
      {/if}
      {#if result.invalid.length}
        <p>{$t('growth.csv.invalid', { count: result.invalid.length })}</p>
        <ul class="gr-list gr-small">
          {#each result.invalid.slice(0, 30) as v (v.line)}
            <li>{$t('growth.csv.line', { line: v.line })} — {$t(errorKey(v.code))}</li>
          {/each}
        </ul>
      {/if}
      {#if result.imported}<a class="sh-btn sh-btn-outline" href="/growth/pipeline?view=research">{$t('growth.csv.goResearch')}</a>{/if}
    </div>
  {/if}
</div>
