<script>
    export let src = ''
    export let pname = ''	
    export let mname = ''
</script>

<div class="flex items-center gap-4">
    <img class="w-10 h-10 rounded-full" {src} alt="project logo">
    <div class="font-medium dark:text-gold">
        <div>{pname}</div>
        <div class="text-sm text-barbi">{mname}</div>
    </div>
</div>