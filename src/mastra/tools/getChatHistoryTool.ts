import { createTool } from '@mastra/core';
import { z } from 'zod';

export const getChatHistoryTool = createTool({
  id: 'getChatHistoryTool',
  description: 'Get extended chat history when needed for context. Use this when you need to reference earlier parts of the conversation.',
  inputSchema: z.object({
    limit: z.number().optional().default(20).describe('Number of messages to retrieve from history'),
    searchTerm: z.string().optional().describe('Optional search term to find specific messages in history')
  }),
  outputSchema: z.object({
    history: z.array(z.object({
      user: z.boolean(),
      text: z.string(),
      timestamp: z.string().optional()
    })),
    totalMessages: z.number()
  }),
  execute: async ({ context }) => {
    const { limit = 20, searchTerm } = context;
    
    // Get the full history from global context if available
    const fullHistory = global.botContext?.fullHistory || [];
    
    let filteredHistory = fullHistory;
    
    // Filter by search term if provided
    if (searchTerm) {
      filteredHistory = fullHistory.filter((msg: any) => 
        msg.text.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Limit the results
    const limitedHistory = filteredHistory.slice(-limit);
    
    console.log(`📚 Retrieved ${limitedHistory.length} messages from history (total: ${fullHistory.length})`);
    
    return {
      history: limitedHistory,
      totalMessages: fullHistory.length
    };
  }
});