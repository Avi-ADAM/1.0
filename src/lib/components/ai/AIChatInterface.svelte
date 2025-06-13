<script lang="ts">
    import { getSessionId } from './session'; // Ensure this path is correct and getSessionId is implemented

    let userMessage = '';
    let messages: { role: string; content: string }[] = [];

    // Initialize with a default greeting from AI if messages array is empty
    if (messages.length === 0) {
        messages = [{ role: 'ai', content: 'Hello! How can I help you today?' }];
    }

    async function sendMessage() {
        if (!userMessage.trim()) return;

        const currentMessage = userMessage;
        messages = [...messages, { role: 'user', content: currentMessage }];
        userMessage = ''; // Clear input immediately after sending

        const sessionId = getSessionId(); // Ensure getSessionId() is properly implemented

        try {
            const res = await fetch('https://your-n8n-endpoint.com/webhook/chat', { // Replace with your actual n8n chat endpoint
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId,
                    message: currentMessage
                })
            });

            if (!res.ok) {
                const errorText = await res.text().catch(() => 'Failed to retrieve error details.');
                console.error('AI Chat API Error:', res.status, errorText);
                messages = [...messages, { role: 'ai', content: `Error: Could not get response from AI. Status: ${res.status}` }];
                return;
            }

            const data = await res.json();
            messages = [...messages, { role: 'ai', content: data.text }];

            if (data.action) {
                handleAction(data.action);
            }
        } catch (e) {
            console.error('Failed to send message or process response:', e);
            messages = [...messages, { role: 'ai', content: 'An error occurred while trying to reach the AI.' }];
        }
    }

    function handleAction(action: { type: string; value: any }) {
        try {
            if (action.type === 'navigate') {
                navigate(action.value);
            } else if (action.type === 'startTimer') {
                startTimer(action.value);
            }
            // Assuming feedback is sent for successfully initiated local actions
            sendFeedback(action, 'success');
        } catch (e) {
            console.error('Error handling action:', e);
            // Send feedback even if local handling fails, to log the attempt/error
            sendFeedback(action, 'error');
        }
    }

    async function sendFeedback(action: any, status: 'success' | 'error') {
        try {
            await fetch('https://your-n8n-endpoint.com/webhook/feedback', { // Replace with your actual n8n feedback endpoint
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    sessionId: getSessionId(), // Ensure getSessionId() is properly implemented
                    type: 'feedback',
                    action: action.type,
                    status
                })
            });
        } catch (e) {
            console.error('Failed to send feedback:', e);
        }
    }

    function navigate(path: string) {
        // Implement actual navigation. This is a placeholder.
        // For example, if using svelte-routing: import { navigate } from 'svelte-routing'; and call navigate(path);
        // Or use: window.location.href = path;
        alert(`Navigation action: Attempting to go to ${path}`);
        console.log(`Navigation requested to: ${path}`);
    }

    function startTimer(seconds: number) {
        alert(`טיימר התחיל ל-${seconds} שניות`);
        setTimeout(() => {
            alert('הטיימר נגמר!');
        }, seconds * 1000);
    }
</script>

<div class="ai-chat-container">
    <ul class="messages-list">
        {#each messages as msg, i (i)} <!-- Using index as key for simplicity, consider unique IDs if messages can be reordered/deleted -->
            <li class="message-item {msg.role === 'user' ? 'user-message' : 'ai-message'}">
                <span class="message-role">{msg.role === 'user' ? 'You' : 'AI'}:</span>
                <span class="message-content">{msg.content}</span>
            </li>
        {/each}
    </ul>
    <div class="input-area">
        <input type="text" bind:value={userMessage} on:keydown={(e) => e.key === 'Enter' && sendMessage()} placeholder="Type your message to AI..." />
        <button on:click={sendMessage} disabled={!userMessage.trim()}>Send</button>
    </div>
</div>

<style>
    .ai-chat-container {
        display: flex;
        flex-direction: column;
        height: 400px; /* Adjust as needed */
        border: 1px solid #ccc;
        border-radius: 8px;
        overflow: hidden;
        font-family: Arial, sans-serif;
    }
    .messages-list {
        flex-grow: 1;
        overflow-y: auto;
        padding: 10px;
        list-style-type: none;
        margin: 0;
        background-color: #f9f9f9;
    }
    .message-item {
        margin-bottom: 8px;
        padding: 8px 12px;
        border-radius: 15px;
        max-width: 75%;
        word-wrap: break-word;
        line-height: 1.4;
    }
    .message-role {
        font-weight: bold;
        margin-right: 5px;
        display: block; /* Makes role appear on its own line or adjust as needed */
        font-size: 0.9em;
        color: #555;
    }
     .user-message .message-role {
        color: #cce5ff;
    }
    .ai-message .message-role {
        color: #7a7a7a;
    }

    .user-message {
        background-color: #007bff;
        color: white;
        margin-left: auto;
        border-bottom-right-radius: 5px;
    }
    .ai-message {
        background-color: #e9ecef;
        color: #333;
        margin-right: auto;
        border-bottom-left-radius: 5px;
    }
    .input-area {
        display: flex;
        padding: 10px;
        border-top: 1px solid #ccc;
        background-color: #fff;
    }
    .input-area input {
        flex-grow: 1;
        padding: 10px 15px;
        border: 1px solid #ddd;
        border-radius: 20px;
        margin-right: 8px;
        outline: none;
        font-size: 1em;
    }
    .input-area input:focus {
        border-color: #007bff;
        box-shadow: 0 0 0 0.2rem rgba(0,123,255,.25);
    }
    .input-area button {
        padding: 10px 20px;
        background-color: #007bff;
        color: white;
        border: none;
        border-radius: 20px;
        cursor: pointer;
        font-size: 1em;
        transition: background-color 0.2s ease;
    }
    .input-area button:hover:not(:disabled) {
        background-color: #0056b3;
    }
    .input-area button:disabled {
        background-color: #aecbeb; /* Lighter blue when disabled */
        cursor: not-allowed;
    }
</style>
