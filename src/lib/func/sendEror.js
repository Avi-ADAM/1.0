<<<<<<< HEAD:src/lib/func/sendEror.svelte
<script module>
=======
>>>>>>> main:src/lib/func/sendEror.js
export function sendEror(uid, data, errorId) {
  const safeData = typeof data === 'object' ? JSON.stringify(data) : String(data);
  
  const datar = {
    log: `id: ${uid} erId: ${errorId} data: ${safeData}`
  };

  fetch("/api/loger", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(datar)
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log('Success:', data);
  })
  .catch(error => {
    console.error('Error:', error);
  });
}
