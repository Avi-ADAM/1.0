<script module>
    /*kind = "skillName" || "workWayName" || "roleDescription" */
    export function oneLangAdj (datar,lang,kind = "skillName" || "workWayName" || "roleDescription"){
            /*kind = "skillName" || "workWayName" || "roleDescription" */
            if (lang != "en" ){
              for (var i = 0; i < datar.data.length; i++){
                if (datar.data[i].attributes.localizations.data.length > 0){
                datar.data[i].attributes[kind] = datar.data[i].attributes.localizations.data[0].attributes[kind]
                }
              }
            }
            datar = datar
            return datar
        }
</script>