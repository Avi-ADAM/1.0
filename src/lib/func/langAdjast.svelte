<script context="module">
    export function langAdjast (datar,lang){
            if (lang != "en" ){
              for (var i = 0; i < datar?.skills?.data.length; i++){
                if (datar.skills.data[i].attributes.localizations.data.length > 0){
                datar.skills.data[i].attributes.skillName = datar.skills.data[i].attributes.localizations.data[0].attributes.skillName
                }
              }
              for (var i = 0; i < datar.tafkidims.data.length; i++){
                if (datar.tafkidims.data[i].attributes.localizations.data.length > 0){
                datar.tafkidims.data[i].attributes.roleDescription = datar.tafkidims.data[i].attributes.localizations.data[0].attributes.roleDescription
                }
              }
              for (var i = 0; i < datar.work_ways.data.length; i++){
                if (datar.work_ways.data[i].attributes.localizations.data.length > 0){
                datar.work_ways.data[i].attributes.workWayName = datar.work_ways.data[i].attributes.localizations.data[0].attributes.workWayName
                }
              }
            }
            datar = datar
            return datar
        }
</script>