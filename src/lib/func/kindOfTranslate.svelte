<script module>
const ot = {"he":"עלות חד פעמית","en":"one time"}
const py = {"he":"ליחידה", "en": "per unit"}
const pm = {"he": "חודשי","en": "monthly"}
const pye = {"he": "שנתי", "en": "yearly"}
const re = {"he": "השכרה לזמן קצוב", "en": "rent"}
export function kindOfTranslation(kindOf,lang){
     if(kindOf=="total"){
        return ot[lang]
    }else if(kindOf=="monthly"){
        return pm[lang]
    }else if(kindOf=="yearly"){
        return pye[lang]
    }else if(kindOf=="perUnit"){
        return py[lang]
    }else if(kindOf=="rent"){
        return re[lang]
    }
    return " "
}
</script>