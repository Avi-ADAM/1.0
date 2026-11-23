<script module>
    import { isCatalogLocale, vocabName } from '$lib/translation/vocab.svelte';

    /**
     * kind = "skillName" | "workWayName" | "roleDescription" | "valueName"
     *
     * he → Strapi's Hebrew localization; en → the base row as is;
     * ar/ru/es → the translation-cache catalog (PLAN_UGC_TRANSLATION §19),
     * falling back to the English base name.
     */
    export function oneLangAdj (datar,lang,kind = "skillName"){
            if (!datar || !datar.data || !Array.isArray(datar.data)) return datar
            if (lang == "he"){
              for (var i = 0; i < datar.data.length; i++){
                if (datar.data[i].attributes && datar.data[i].attributes.localizations && datar.data[i].attributes.localizations.data && datar.data[i].attributes.localizations.data.length > 0){
                datar.data[i].attributes[kind] = datar.data[i].attributes.localizations.data[0].attributes[kind]
                }
              }
            } else if (isCatalogLocale(lang)) {
              for (var j = 0; j < datar.data.length; j++){
                const a = datar.data[j].attributes
                if (a && a[kind]) a[kind] = vocabName(a[kind], lang)
              }
            }
            return datar
        }
</script>
