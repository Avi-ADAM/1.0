<script module>
  // Every live caller of SendTo omits the second argument — the direct-Strapi
  // admin-token branch this used to have moved to $lib/server/sendToAdmin.js
  // (genuine server contexts only: cron routes, timegrama finalizers).
  export async function SendTo(dat) {
    // Use proxy endpoint to handle httpOnly cookies securely
    const response = await fetch('/api/send', {
      method: 'POST',
      body: JSON.stringify({
        data: {
          query: dat
        }
      }),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const res = await response.json();
    return res;
  }
</script>
