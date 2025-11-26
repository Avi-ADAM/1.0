/**
 * Socket.IO Server for Unified Action System
 * 
 * This is a standalone server that handles real-time updates via Socket.IO.
 * It runs separately from the main SvelteKit application and can be deployed
 * on a different server.
 */

import { Server } from 'socket.io';
import { createServer } from 'http';
import { config } from 'dotenv';
import { verifyToken, extractToken } from './auth.js';
import { SessionManager } from './session-manager.js';
import type { AuthData, NotificationPayload, BroadcastRequest, SocketData } from './types.js';

// Load environment variables
config();

const PORT = process.env.PORT || 3001;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const NODE_ENV = process.env.NODE_ENV || 'development';

// Create HTTP server
const httpServer = createServer();

// Create Socket.IO server with CORS configuration
const io = new Server(httpServer, {
  cors: {
    origin: CLIENT_URL.split(',').map(url => url.trim()),
    credentials: true, // Important: allows cookies to be sent
    methods: ['GET', 'POST']
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  // Allow cookies to be sent with handshake
  allowRequest: (req, callback) => {
    // Always allow, we'll validate JWT from cookie in middleware
    callback(null, true);
  }
});

// Initialize session manager
const sessionManager = new SessionManager();

/**
 * Helper function to parse cookies from header
 */
function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  if (!cookieHeader) return {};
  
  return cookieHeader.split(';').reduce((cookies, cookie) => {
    const [name, value] = cookie.trim().split('=');
    if (name && value) {
      cookies[name] = decodeURIComponent(value);
    }
    return cookies;
  }, {} as Record<string, string>);
}

/**
 * Socket.IO connection handler with automatic cookie-based authentication
 */
io.on('connection', (socket) => {
  console.log(`[Socket.IO] New connection attempt: ${socket.id}`);
  
  try {
    // Extract cookies from handshake
    const cookieHeader = socket.handshake.headers.cookie;
    const cookies = parseCookies(cookieHeader);
    
    const jwt = cookies.jwt;
    const userId = cookies.id;
    
    if (!jwt || !userId) {
      console.error(`[Socket.IO] Missing JWT or user ID in cookies for ${socket.id}`);
      socket.emit('auth_error', { message: 'Not authenticated - missing credentials' });
      socket.disconnect();
      return;
    }
    
    // Verify JWT token
    const token = extractToken(jwt);
    if (!token) {
      console.error(`[Socket.IO] Invalid JWT format from ${socket.id}`);
      socket.emit('auth_error', { message: 'Invalid JWT format' });
      socket.disconnect();
      return;
    }
    
    const verification = verifyToken(token);
    if (!verification.valid) {
      console.error(`[Socket.IO] JWT verification failed for ${socket.id}: ${verification.error}`);
      socket.emit('auth_error', { message: 'Invalid or expired JWT' });
      socket.disconnect();
      return;
    }
    
    // Verify userId matches JWT (compare as strings)
    const jwtUserId = String(verification.userId);
    const cookieUserId = String(userId);
    
    if (jwtUserId !== cookieUserId) {
      console.error(`[Socket.IO] UserId mismatch for ${socket.id}: JWT has "${jwtUserId}", cookie has "${cookieUserId}"`);
      socket.emit('auth_error', { message: 'UserId does not match JWT' });
      socket.disconnect();
      return;
    }
    
    // Store userId in socket data
    socket.data.userId = userId;
    
    // Register session
    sessionManager.addSession(userId, socket.id);
    
    // Send success confirmation
    socket.emit('auth_success', { userId });
    
    console.log(`[Socket.IO] User ${userId} authenticated successfully via cookie`);
  } catch (error) {
    console.error(`[Socket.IO] Auth error for ${socket.id}:`, error);
    socket.emit('auth_error', { message: 'Authentication failed' });
    socket.disconnect();
    return;
  }
  
  /**
   * Legacy auth event - kept for backward compatibility
   * @deprecated Use cookie-based authentication instead
   */
  socket.on('auth', (data: AuthData) => {
    console.warn(`[Socket.IO] Received legacy 'auth' event from ${socket.id} - this is deprecated, use cookie-based auth`);
    // Socket is already authenticated via cookies, just acknowledge
    socket.emit('auth_success', { userId: socket.data.userId });
  });
  
  /**
   * Disconnect handler
   */
  socket.on('disconnect', (reason) => {
    const userId = socket.data.userId;
    
    if (userId) {
      sessionManager.removeSession(socket.id);
      console.log(`[Socket.IO] User ${userId} disconnected: ${reason}`);
    } else {
      console.log(`[Socket.IO] Unauthenticated socket ${socket.id} disconnected: ${reason}`);
    }
  });
  
  /**
   * Error handler
   */
  socket.on('error', (error) => {
    console.error(`[Socket.IO] Socket error for ${socket.id}:`, error);
  });
  
  /**
   * Ping/pong for connection health
   */
  socket.on('ping', () => {
    socket.emit('pong');
  });
});

/**
 * HTTP endpoint for broadcasting notifications
 * This is called by the Action System to send notifications to users
 */
httpServer.on('request', async (req, res) => {
  // Enable CORS for HTTP requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // Health check endpoint
  if (req.method === 'GET' && req.url === '/health') {
    const stats = sessionManager.getStats();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      uptime: process.uptime(),
      stats,
      timestamp: new Date().toISOString()
    }));
    return;
  }
  
  // Stats endpoint
  if (req.method === 'GET' && req.url === '/stats') {
    const stats = sessionManager.getStats();
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(stats));
    return;
  }
  
  // Broadcast endpoint
  if (req.method === 'POST' && req.url === '/broadcast') {
    let body = '';
    
    req.on('data', chunk => {
      body += chunk.toString();
    });
    
    req.on('end', () => {
      try {
        const data: BroadcastRequest = JSON.parse(body);
        const { userIds, notification } = data;
        
        if (!userIds || !Array.isArray(userIds)) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'userIds must be an array' }));
          return;
        }
        
        if (!notification) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'notification is required' }));
          return;
        }
        
        // Track delivery stats
        let deliveredTo = 0;
        let totalSockets = 0;
        
        // Send to all specified users
        for (const userId of userIds) {
          const socketIds = sessionManager.getUserSockets(userId);
          
          if (socketIds.length > 0) {
            deliveredTo++;
            totalSockets += socketIds.length;
            
            // Send to all sockets for this user
            for (const socketId of socketIds) {
              io.to(socketId).emit('notification', notification);
            }
            
            console.log(`[Broadcast] Sent notification to user ${userId} (${socketIds.length} socket(s))`);
          } else {
            console.log(`[Broadcast] User ${userId} has no active connections`);
          }
        }
        
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          success: true,
          deliveredTo,
          totalSockets,
          requestedUsers: userIds.length
        }));
        
        console.log(`[Broadcast] Notification sent to ${deliveredTo}/${userIds.length} users (${totalSockets} sockets)`);
      } catch (error) {
        console.error('[Broadcast] Error:', error);
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Invalid request',
          message: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    });
    
    return;
  }
  
  // 404 for unknown routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

/**
 * Start server
 */
httpServer.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('Socket.IO Server for Unified Action System');
  console.log('='.repeat(60));
  console.log(`Environment: ${NODE_ENV}`);
  console.log(`Port: ${PORT}`);
  console.log(`Allowed origins: ${CLIENT_URL}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
  console.log(`Stats: http://localhost:${PORT}/stats`);
  console.log(`Broadcast: POST http://localhost:${PORT}/broadcast`);
  console.log('='.repeat(60));
});

/**
 * Graceful shutdown
 */
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, closing server...');
  httpServer.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received, closing server...');
  httpServer.close(() => {
    console.log('[Server] Server closed');
    process.exit(0);
  });
});
