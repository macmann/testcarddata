import { Server } from '@modelcontextprotocol/server';
import { z } from 'zod';

// Create MCP server instance
const server = new Server({
  name: 'bank-api-mcp',
  version: '1.0.0',
});

// Tool: get record by credit card number
server.tool({
  name: 'getRecordByCard',
  description: 'Get customer record by credit card number',
  inputSchema: z.object({
    cardNumber: z.string(),
  }),
  outputSchema: z.object({
    record: z.any(),
  }),
  execute: async ({ cardNumber }) => {
    const response = await fetch(`http://localhost:3000/api/data/card/${encodeURIComponent(cardNumber)}`);
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    const record = await response.json();
    return { record };
  },
});

// Tool: create support ticket
server.tool({
  name: 'createTicket',
  description: 'Create a support ticket',
  inputSchema: z.object({
    description: z.string(),
  }),
  outputSchema: z.object({ id: z.string() }),
  execute: async ({ description }) => {
    const response = await fetch('http://localhost:3000/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description }),
    });
    if (!response.ok) {
      throw new Error(`API responded with status ${response.status}`);
    }
    return response.json();
  },
});

// Start listening for MCP connections
server.listen();
