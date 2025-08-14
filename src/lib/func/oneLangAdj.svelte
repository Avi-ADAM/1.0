<script module>
    /*kind = "skillName" || "workWayName" || "roleDescription" */
    export function oneLangAdj (datar,lang,kind = "skillName" || "workWayName" || "roleDescription"){
            /*kind = "skillName" || "workWayName" || "roleDescription" */
            if (lang != "en" && datar && datar.data && Array.isArray(datar.data)){
              for (var i = 0; i < datar.data.length; i++){
                if (datar.data[i].attributes && datar.data[i].attributes.localizations && datar.data[i].attributes.localizations.data && datar.data[i].attributes.localizations.data.length > 0){
                datar.data[i].attributes[kind] = datar.data[i].attributes.localizations.data[0].attributes[kind]
                }
              }
            }
            return datar
        }
</script>