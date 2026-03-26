/**
 * ProxyManager — Controls the Antigravity Claude Proxy lifecycle
 * Runs the proxy server as a forked child process and exposes
 * start/stop/status/accounts APIs for the Electron main process.
 */

const { fork } = require('child_process');
const path = require('path');
const http = require('http');

const SERVER_ENTRY = path.join(__dirname, 'server', 'index.js');
const DEFAULT_PORT = 8080;
const HEALTH_CHECK_INTERVAL_MS = 30000;
const HEALTH_CHECK_TIMEOUT_MS = 5000;

class ProxyManager {
  constructor() {
    this._childProcess = null;
    this._port = DEFAULT_PORT;
    this._host = '127.0.0.1';
    this._status = 'stopped'; // stopped | starting | running | stopping | error
    this._error = null;
    this._pid = null;
    this._version = null;
    this._healthInterval = null;
    this._onStatusChange = null;
  }

  /**
   * Register a callback for status changes (used to notify the renderer).
   * @param {(status: object) => void} callback
   */
  onStatusChange(callback) {
    this._onStatusChange = callback;
  }

  _emitStatusChange() {
    if (typeof this._onStatusChange === 'function') {
      this._onStatusChange(this.getStatus());
    }
  }

  /**
   * Start the proxy server as a child process.
   * @param {object} options
   * @param {number} [options.port=8080]
   * @param {string} [options.strategy='hybrid']
   * @returns {Promise<{success: boolean, port?: number, error?: string}>}
   */
  start({ port = DEFAULT_PORT, strategy = 'hybrid' } = {}) {
    return new Promise((resolve) => {
      if (this._childProcess && this._status === 'running') {
        return resolve({ success: true, port: this._port, message: 'Already running' });
      }

      if (this._status === 'starting') {
        return resolve({ success: false, error: 'Proxy is already starting' });
      }

      this._port = port;
      this._status = 'starting';
      this._error = null;
      this._emitStatusChange();

      try {
        this._childProcess = fork(SERVER_ENTRY, [], {
          stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
          env: {
            ...process.env,
            PROXY_PORT: String(port),
            HOST: this._host,
            PROXY_STRATEGY: strategy,
          },
        });
      } catch (error) {
        this._status = 'error';
        this._error = error.message;
        this._emitStatusChange();
        return resolve({ success: false, error: error.message });
      }

      // Capture stdout/stderr for logging
      if (this._childProcess.stdout) {
        this._childProcess.stdout.on('data', (data) => {
          const text = data.toString().trim();
          if (text) console.log(`[Proxy] ${text}`);
        });
      }

      if (this._childProcess.stderr) {
        this._childProcess.stderr.on('data', (data) => {
          const text = data.toString().trim();
          if (text) console.error(`[Proxy] ${text}`);
        });
      }

      let resolved = false;

      this._childProcess.on('message', (msg) => {
        if (!msg || typeof msg !== 'object') return;

        switch (msg.type) {
          case 'started':
            this._status = 'running';
            this._port = msg.port || port;
            this._pid = msg.pid || this._childProcess.pid;
            this._version = msg.version || null;
            this._emitStatusChange();
            this._startHealthCheck();
            if (!resolved) {
              resolved = true;
              resolve({ success: true, port: this._port });
            }
            break;

          case 'stopping':
            this._status = 'stopping';
            this._emitStatusChange();
            break;

          case 'stopped':
            this._status = 'stopped';
            this._emitStatusChange();
            this._cleanup();
            break;

          case 'error':
            this._status = 'error';
            this._error = msg.message || 'Unknown error';
            this._emitStatusChange();
            if (!resolved) {
              resolved = true;
              resolve({ success: false, error: this._error });
            }
            break;
        }
      });

      this._childProcess.on('exit', (code, signal) => {
        console.log(`[Proxy] Child process exited (code=${code}, signal=${signal})`);
        const wasRunning = this._status === 'running';
        this._status = 'stopped';
        this._emitStatusChange();
        this._cleanup();

        if (!resolved) {
          resolved = true;
          resolve({ success: false, error: `Process exited with code ${code}` });
        }
      });

      this._childProcess.on('error', (error) => {
        console.error(`[Proxy] Child process error: ${error.message}`);
        this._status = 'error';
        this._error = error.message;
        this._emitStatusChange();
        this._cleanup();

        if (!resolved) {
          resolved = true;
          resolve({ success: false, error: error.message });
        }
      });

      // Timeout: if server hasn't started in 15 seconds, consider it failed
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          this._status = 'error';
          this._error = 'Timeout starting proxy server';
          this._emitStatusChange();
          this.stop();
          resolve({ success: false, error: this._error });
        }
      }, 15000);
    });
  }

  /**
   * Stop the proxy server.
   * @returns {Promise<{success: boolean}>}
   */
  stop() {
    return new Promise((resolve) => {
      this._stopHealthCheck();

      if (!this._childProcess) {
        this._status = 'stopped';
        this._emitStatusChange();
        return resolve({ success: true });
      }

      this._status = 'stopping';
      this._emitStatusChange();

      // Send graceful shutdown command
      try {
        this._childProcess.send({ type: 'shutdown' });
      } catch (_) {
        // IPC channel may already be closed
      }

      // Force kill after 8 seconds if graceful shutdown didn't work
      const forceKillTimeout = setTimeout(() => {
        if (this._childProcess) {
          try {
            this._childProcess.kill('SIGKILL');
          } catch (_) {}
        }
        this._status = 'stopped';
        this._emitStatusChange();
        this._cleanup();
        resolve({ success: true });
      }, 8000);

      this._childProcess.once('exit', () => {
        clearTimeout(forceKillTimeout);
        this._status = 'stopped';
        this._emitStatusChange();
        this._cleanup();
        resolve({ success: true });
      });
    });
  }

  /**
   * Restart the proxy server.
   * @param {object} [options]
   * @returns {Promise<{success: boolean, port?: number, error?: string}>}
   */
  async restart(options = {}) {
    await this.stop();
    return this.start({
      port: options.port || this._port,
      strategy: options.strategy || 'hybrid',
    });
  }

  /**
   * Get the current proxy status.
   * @returns {object}
   */
  getStatus() {
    return {
      status: this._status,
      port: this._port,
      host: this._host,
      pid: this._pid,
      version: this._version,
      error: this._error,
      running: this._status === 'running',
    };
  }

  /**
   * Make an HTTP request to the proxy API.
   * @param {string} path
   * @param {string} [method='GET']
   * @returns {Promise<object>}
   */
  _proxyRequest(urlPath, method = 'GET') {
    return new Promise((resolve, reject) => {
      if (this._status !== 'running') {
        return reject(new Error('Proxy is not running'));
      }

      const options = {
        hostname: this._host,
        port: this._port,
        path: urlPath,
        method,
        timeout: HEALTH_CHECK_TIMEOUT_MS,
        headers: { 'Accept': 'application/json' },
      };

      const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(body));
          } catch (_) {
            resolve({ raw: body });
          }
        });
      });

      req.on('error', (error) => reject(error));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  /**
   * Get proxy health information.
   */
  async getHealth() {
    try {
      return await this._proxyRequest('/health');
    } catch (error) {
      return { status: 'error', error: error.message };
    }
  }

  /**
   * Get accounts and their quota limits.
   */
  async getAccounts() {
    try {
      return await this._proxyRequest('/account-limits');
    } catch (error) {
      return { status: 'error', error: error.message, accounts: [] };
    }
  }

  /**
   * Get available models from the proxy.
   */
  async getModels() {
    try {
      return await this._proxyRequest('/v1/models');
    } catch (error) {
      return { data: [], error: error.message };
    }
  }

  _startHealthCheck() {
    this._stopHealthCheck();
    this._healthInterval = setInterval(async () => {
      try {
        const health = await this.getHealth();
        if (health.status === 'error' && this._status === 'running') {
          console.warn('[Proxy] Health check failed:', health.error);
        }
      } catch (_) {
        // Ignore health check failures
      }
    }, HEALTH_CHECK_INTERVAL_MS);
  }

  _stopHealthCheck() {
    if (this._healthInterval) {
      clearInterval(this._healthInterval);
      this._healthInterval = null;
    }
  }

  _cleanup() {
    this._stopHealthCheck();
    this._childProcess = null;
    this._pid = null;
  }
}

module.exports = { ProxyManager };
