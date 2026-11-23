<script module>
    import { isCatalogLocale, vocabName } from '$lib/translation/vocab.svelte';

    /**
     * he → Strapi's Hebrew localization; en → the base rows as they are;
     * ar/ru/es → the translation-cache catalog (PLAN_UGC_TRANSLATION §19),
     * falling back to the English base name.
     */
    const PAIRS = [['skills', 'skillName'], ['tafkidims', 'roleDescription'], ['work_ways', 'workWayName']]

    export function langAdjast (datar,lang){
            if (!datar) return datar
            for (const [coll, field] of PAIRS){
              const rows = datar[coll]?.data
              if (!Array.isArray(rows)) continue
              for (let i = 0; i < rows.length; i++){
                const a = rows[i]?.attributes
                if (!a) continue
                if (lang == "he"){
                  const loc = a.localizations?.data?.[0]?.attributes?.[field]
                  if (loc) a[field] = loc
                } else if (isCatalogLocale(lang) && a[field]){
                  a[field] = vocabName(a[field], lang)
                }
              }
            }
            return datar
        }
</script>
