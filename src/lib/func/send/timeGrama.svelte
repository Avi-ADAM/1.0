<script context="module">
  import { sendToSer } from "$lib/send/sendToSer.js";

    export async function archiveTimeGrama(id,fetch, isSer = false) {
        let x = await sendToSer({ id,done: true },"35updateTimeGrama", null, null, isSer, fetch).then((x) => {
            return x.data;
        });
        return x;
    }
</script>
