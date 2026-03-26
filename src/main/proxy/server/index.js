/**
 * Antigravity Claude Proxy — Embedded Entry Point
 * Runs as a forked child process managed by the Electron main process.
 * Communicates status and lifecycle events via process.send().
 */

import './utils/proxy.js';

import app, { accountManager } from './server.js';
import { DEFAULT_PORT } from './constants.js';
import { logger } from './utils/logger.js';
import { config } from './config.js';
import { getStrategyLabel, STRATEGY_NAMES, DEFAULT_STRATEGY } from './account-manager/strategies/index.js';
import { getPackageVersion } from './utils/helpers.js';

const packageVersion = getPackageVersion();

// Read configuration from parent process via env vars or defaults
const PORT = parseInt(process.env.PROXY_PORT || process.env.PORT || DEFAULT_PORT, 10);
const HOST = process.env.HOST || '127.0.0.1';
const strategyOverride = process.env.PROXY_STRATEGY || null;

// Validate strategy
if (strategyOverride && !STRATEGY_NAMES.includes(strategyOverride.toLowerCase())) {
  logger.warn(`[Startup] Invalid strategy "${strategyOverride}". Valid options: ${STRATEGY_NAMES.join(', ')}.`);
}

// Send message to parent process (safe — only if forked)
function sendToParent(type, data = {}) {
  if (typeof process.send === 'function') {
    process.send({ type, ...data });
  }
}

const server = app.listen(PORT, HOST, () => {
  const address = server.address();
  const boundPort = typeof address === 'string' ? PORT : address.port;

  logger.success(`[Proxy] Server started on http://${HOST}:${boundPort} (v${packageVersion})`);

  sendToParent('started', {
    port: boundPort,
    host: HOST,
    pid: process.pid,
    version: packageVersion,
  });
});

server.on('error', (error) => {
  logger.error(`[Proxy] Server error: ${error.message}`);
  sendToParent('error', { message: error.message, code: error.code });

  if (error.code === 'EADDRINUSE') {
    logger.error(`[Proxy] Port ${PORT} is already in use.`);
    process.exit(1);
  }
});

// Listen for shutdown command from parent
process.on('message', (msg) => {
  if (msg?.type === 'shutdown') {
    logger.info('[Proxy] Received shutdown command from parent.');
    shutdown();
  }
});

// Graceful shutdown
const shutdown = () => {
  logger.info('[Proxy] Shutting down server...');
  sendToParent('stopping');

  server.close(() => {
    logger.success('[Proxy] Server stopped.');
    sendToParent('stopped');
    process.exit(0);
  });

  setTimeout(() => {
    logger.error('[Proxy] Could not close connections in time, forcefully shutting down.');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);