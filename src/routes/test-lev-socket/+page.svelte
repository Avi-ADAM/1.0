<script>
  import { onMount } from 'svelte';
  import { executeAction } from '$lib/client/actionClient';
  import { toast } from 'svelte-sonner';
  import { socketClient } from '$lib/stores/socketClient';
  
  let projectId = $state('');
  let userId = $state('');
  let jwt = $state('');
  let isConnected = $state(false);
  let lastNotification = $state(null);
  let logs = $state([]);
  
  function addLog(message) {
    const timestamp = new Date().toLocaleTimeString('he-IL');
    logs = [...logs, `[${timestamp}] ${message}`];
  }
  
  onMount(() => {
    // Get credentials from cookies
    const jwtCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('jwt='));
    
    const idCookie = document.cookie
      .split('; ')
      .find((row) => row.startsWith('id='));
    
    if (jwtCookie) {
      jwt = jwtCookie.split('=')[1];
      addLog('✅ JWT נמצא');
    }
    
    if (idCookie) {
      userId = idCookie.split('=')[1];
      addLog(`✅ User ID: ${userId}`);
    }
    
    // Check socket connection
    const unsubscribe = socketClient.subscribe((state) => {
      isConnected = state.connected;
      addLog(`🔌 Socket ${state.connected ? 'מחובר' : 'מנותק'}`);
    });
    
    // Listen for notifications
    const unsubscribeNotifications = socketClient.onNotification((notification) => {
      addLog(`🔔 התקבלה התראה: ${notification.actionKey || 'unknown'}`);
      lastNotification = notification;
      
      const title = notification.title?.he || 'התראה';
      const body = notification.body?.he || '';
      toast.info(title, { description: body });
    });
    
    return () => {
      unsubscribe();
      unsubscribeNotifications();
    };
  });
  
  async function testCreateTosplit() {
    if (!projectId || !userId) {
      toast.error('נא למלא Project ID ו-User ID');
      return;
    }
    
    addLog('🚀 שולח createTosplit...');
    
    try {
      const result = await executeAction('createTosplit', {
        data: {
          project: projectId,
          publishedAt: new Date().toISOString(),
          halukas: [1], // Array of haluka IDs
          hervachti: [
            { 
              users_permissions_user: parseInt(userId), 
              amount: 100,
              mekabel: true,
              noten: false
            }
          ],
          vots: [
            { users_permissions_user: userId, what: true }
          ]
        }
      });
      
      if (result.success) {
        addLog('✅ createTosplit הצליח!');
        toast.success('Tosplit נוצר בהצלחה');
      } else {
        addLog(`❌ שגיאה: ${result.error?.message}`);
        toast.error(result.error?.message || 'שגיאה');
      }
    } catch (error) {
      addLog(`❌ Exception: ${error.message}`);
      toast.error(error.message);
    }
  }
  
  async function simulateNotification() {
    addLog('🧪 מדמה התראה...');
    
    const mockNotification = {
      actionKey: 'createTosplit',
      title: {
        he: 'הצעה לחלוקת רווחים (בדיקה)',
        en: 'Profit Distribution Proposal (Test)'
      },
      body: {
        he: 'זוהי התראת בדיקה. המידע בעמוד הלב אמור להתעדכן',
        en: 'This is a test notification. Lev page data should refresh'
      },
      updateStrategy: {
        type: 'partialUpdate',
        config: {
          dataKeys: ['tosplits', 'halukas']
        }
      },
      metadata: {
        url: 'lev',
        priority: 'high'
      }
    };
    
    // Send test notification via API
    try {
      const response = await fetch('http://localhost:3001/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userIds: [userId],
          notification: mockNotification
        })
      });
      
      if (response.ok) {
        addLog('✅ התראה נשלחה דרך השרת');
        toast.success('התראה נשלחה');
      } else {
        addLog('❌ שגיאה בשליחת התראה');
        toast.error('שגיאה בשליחת התראה');
      }
    } catch (error) {
      addLog(`❌ Exception: ${error.message}`);
      toast.error('שגיאת רשת');
    }
  }
</script>

<div class="container" dir="rtl">
  <h1>בדיקת Socket Updates לעמוד הלב</h1>
  
  <div class="status">
    <div class="status-item">
      <span class="label">סטטוס Socket:</span>
      <span class="value {isConnected ? 'connected' : 'disconnected'}">
        {isConnected ? '🟢 מחובר' : '🔴 מנותק'}
      </span>
    </div>
    
    <div class="status-item">
      <span class="label">User ID:</span>
      <span class="value">{userId || 'לא נמצא'}</span>
    </div>
  </div>
  
  <div class="section">
    <h2>בדיקת createTosplit</h2>
    
    <div class="form">
      <label>
        Project ID:
        <input type="text" bind:value={projectId} placeholder="הכנס Project ID" />
      </label>
      
      <button onclick={testCreateTosplit} disabled={!isConnected}>
        שלח createTosplit
      </button>
    </div>
  </div>
  
  <div class="section">
    <h2>סימולציה</h2>
    <button onclick={simulateNotification} disabled={!isConnected}>
      דמה התראה (ללא שמירה בDB)
    </button>
  </div>
  
  {#if lastNotification}
    <div class="section">
      <h2>התראה אחרונה</h2>
      <pre>{JSON.stringify(lastNotification, null, 2)}</pre>
    </div>
  {/if}
  
  <div class="section">
    <h2>לוג</h2>
    <div class="logs">
      {#each logs as log}
        <div class="log-entry">{log}</div>
      {/each}
    </div>
  </div>
  
  <div class="section">
    <h2>הוראות</h2>
    <ol>
      <li>וודא שה-Socket מחובר (🟢)</li>
      <li>פתח את עמוד הלב בטאב אחר</li>
      <li>לחץ על "שלח createTosplit" או "דמה התראה"</li>
      <li>בדוק שבעמוד הלב מתקבלת התראה והמידע מתעדכן</li>
      <li>בדוק את הקונסול לראות לוגים</li>
    </ol>
  </div>
</div>

<style>
  .container {
    max-width: 800px;
    margin: 2rem auto;
    padding: 2rem;
    font-family: Arial, sans-serif;
  }
  
  h1 {
    color: #333;
    border-bottom: 2px solid #4CAF50;
    padding-bottom: 0.5rem;
  }
  
  h2 {
    color: #555;
    margin-top: 1.5rem;
  }
  
  .status {
    background: #f5f5f5;
    padding: 1rem;
    border-radius: 8px;
    margin: 1rem 0;
  }
  
  .status-item {
    display: flex;
    justify-content: space-between;
    margin: 0.5rem 0;
  }
  
  .label {
    font-weight: bold;
  }
  
  .value {
    font-family: monospace;
  }
  
  .connected {
    color: #4CAF50;
  }
  
  .disconnected {
    color: #f44336;
  }
  
  .section {
    margin: 2rem 0;
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
  }
  
  .form {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  
  label {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  
  input {
    padding: 0.5rem;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 1rem;
  }
  
  button {
    padding: 0.75rem 1.5rem;
    background: #4CAF50;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 1rem;
    transition: background 0.3s;
  }
  
  button:hover:not(:disabled) {
    background: #45a049;
  }
  
  button:disabled {
    background: #ccc;
    cursor: not-allowed;
  }
  
  .logs {
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 1rem;
    border-radius: 4px;
    max-height: 300px;
    overflow-y: auto;
    font-family: 'Courier New', monospace;
    font-size: 0.9rem;
  }
  
  .log-entry {
    margin: 0.25rem 0;
    padding: 0.25rem;
    border-bottom: 1px solid #333;
  }
  
  pre {
    background: #f5f5f5;
    padding: 1rem;
    border-radius: 4px;
    overflow-x: auto;
    font-size: 0.85rem;
  }
  
  ol {
    line-height: 1.8;
  }
  
  ol li {
    margin: 0.5rem 0;
  }
</style>
