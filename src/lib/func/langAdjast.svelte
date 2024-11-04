<script context="module">
    export function langAdjast (datar,lang){
            if (lang != "en" ){
              for (let i = 0; i < datar?.attributes.skills?.data.length; i++){
                if (datar.attributes.skills.data[i].attributes.localizations.data.length > 0){
                datar.attributes.skills.data[i].attributes.skillName = datar.attributes.skills.data[i].attributes.localizations.data[0].attributes.skillName
                }
              }
              for (let i = 0; i < datar.attributes.tafkidims.data.length; i++){
                if (datar.attributes.tafkidims.data[i].attributes.localizations.data.length > 0){
                datar.attributes.tafkidims.data[i].attributes.roleDescription = datar.attributes.tafkidims.data[i].attributes.localizations.data[0].attributes.roleDescription
                }
              }
              for (let i = 0; i < datar.attributes.work_ways.data.length; i++){
                if (datar.attributes.work_ways.data[i].attributes.localizations.data.length > 0){
                datar.attributes.work_ways.data[i].attributes.workWayName = datar.attributes.work_ways.data[i].attributes.localizations.data[0].attributes.workWayName
                }
              }
            }
            datar = datar
            return datar
        }
</script>