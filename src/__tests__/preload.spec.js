// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach } from 'vitest';
globalThis.vi = vi;

import Module from 'module';

// Intercept 'electron' require calls inside preload.js
const originalRequire = Module.prototype.require;
Module.prototype.require = function (id) {
  if (id === 'electron') {
    return require('../__mocks__/electron.js');
  }
  return originalRequire.apply(this, arguments);
};

// Get contextBridge and ipcRenderer from the mock file
const { contextBridge, ipcRenderer } = require('../__mocks__/electron.js');

describe('Preload Script', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear require cache for preload.js so it executes fresh for each test
    delete require.cache[require.resolve('../../preload.js')];
    require('../../preload.js');
  });

  it('should expose electronAPI to the main world', () => {
    expect(contextBridge.exposeInMainWorld).toHaveBeenCalledWith(
      'electronAPI',
      expect.any(Object)
    );
  });

  it('electronAPI.ping should invoke the ping IPC channel', async () => {
    // Get the exposed api object passed to exposeInMainWorld
    const apiObject = contextBridge.exposeInMainWorld.mock.calls.find(
      call => call[0] === 'electronAPI'
    )[1];
    expect(apiObject.ping).toBeDefined();

    const result = await apiObject.ping();
    expect(ipcRenderer.invoke).toHaveBeenCalledWith('ping');
    expect(result).toBe('pong');
  });

  it('should set version text on DOMContentLoaded', () => {
    // Mock process.versions
    const originalVersions = process.versions;
    Object.defineProperty(process, 'versions', {
      value: { chrome: '1.2.3', node: '4.5.6', electron: '7.8.9' },
      configurable: true,
    });

    // Create the expected elements in the document body
    document.body.innerHTML = `
      <span id="chrome-version"></span>
      <span id="node-version"></span>
      <span id="electron-version"></span>
    `;

    // Fire DOMContentLoaded event
    window.dispatchEvent(new Event('DOMContentLoaded'));

    expect(document.getElementById('chrome-version').textContent).toBe('1.2.3');
    expect(document.getElementById('node-version').textContent).toBe('4.5.6');
    expect(document.getElementById('electron-version').textContent).toBe('7.8.9');

    // Restore versions
    Object.defineProperty(process, 'versions', {
      value: originalVersions,
      configurable: true,
    });
  });
});
