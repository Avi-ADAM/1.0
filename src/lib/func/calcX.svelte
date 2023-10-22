<script context="module">
    export function calcX(restime){
        let x = 0
         if (restime == "feh") {
        x = 48 * 60 * 60 * 1000
    } else if (restime == "sth") {
        x = 72 * 60 * 60 * 1000 
    } else if (restime == "nsh") {
        x = 96 * 60 * 60 * 1000
    } else if (restime == "sevend") {
        x = 168 * 60 * 60 * 1000
    }
    return x
    }
</script>