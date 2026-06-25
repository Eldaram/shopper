const log = require('../utils/logger');
const { net } = require('electron');

class OpenFoodFactsService {
  constructor() {
    this.isOnline = true; // Assume online initially
    this.retryTimer = null;

    // Check initial connection status after the app is initialized
    this._checkInitialOnlineStatus();
  }

  /**
   * Checks the initial system network connection state using Electron's net module.
   * @private
   */
  _checkInitialOnlineStatus() {
    setTimeout(() => {
      try {
        if (net && typeof net.isOnline === 'function') {
          const systemOnline = net.isOnline();
          log.info(`OpenFoodFactsService: Initial system network status = ${systemOnline}`);
          this.setOnlineStatus(systemOnline);
        }
      } catch (err) {
        log.error('OpenFoodFactsService: Failed to check initial network status:', err);
      }
    }, 1000);
  }

  /**
   * Notifies all active main windows about changes in online connectivity.
   * @private
   */
  _notifyRenderer() {
    try {
      const mainModule = require('../../main');
      const mainWindow = mainModule.getMainWindow ? mainModule.getMainWindow() : null;
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('offline-status-changed', this.isOnline);
      }
    } catch (err) {
      // Safe catch for startup/testing phases
    }
  }

  /**
   * Sets the online/offline state, logs the changes, notifies the renderer,
   * and triggers the 60-second retry loop if offline.
   * @param {boolean} online - The new connection state.
   */
  setOnlineStatus(online) {
    if (this.isOnline !== online) {
      this.isOnline = online;
      log.info(
        `OpenFoodFactsService: Connection status changed to ${online ? 'ONLINE' : 'OFFLINE'}`
      );
      this._notifyRenderer();

      if (!online) {
        this._startRetryTimer();
      } else {
        this._stopRetryTimer();
      }
    }
  }

  /**
   * Starts a retry loop that checks connection viability every minute.
   * @private
   */
  _startRetryTimer() {
    this._stopRetryTimer();
    log.info('OpenFoodFactsService: Starting connectivity check retry timer (60s loop)');
    this.retryTimer = setInterval(async () => {
      const isReachable = await this._pingOpenFoodFacts();
      if (isReachable) {
        log.info('OpenFoodFactsService: Connectivity restored. Marking ONLINE.');
        this.setOnlineStatus(true);
      }
    }, 60000); // 60 seconds
  }

  /**
   * Stops the retry timer loop.
   * @private
   */
  _stopRetryTimer() {
    if (this.retryTimer) {
      clearInterval(this.retryTimer);
      this.retryTimer = null;
    }
  }

  /**
   * Pings the OpenFoodFacts API to test WAN network status.
   * @returns {Promise<boolean>}
   * @private
   */
  async _pingOpenFoodFacts() {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3-second ping timeout
      const response = await fetch(
        'https://world.openfoodfacts.org/api/v2/product/5449000000996.json?fields=code',
        {
          headers: {
            'User-Agent': 'Shopper - Connection Test - Version 1.0',
          },
          signal: controller.signal,
        }
      );
      clearTimeout(timeoutId);
      return response.ok;
    } catch (e) {
      return false;
    }
  }

  /**
   * Helper function to perform fetch queries to OpenFoodFacts with standard headers and timeout.
   * @param {string} url - The URL to request.
   * @param {number} [timeoutMs=5000] - Standard timeout threshold.
   * @returns {Promise<any>} The parsed JSON response.
   * @private
   */
  async _request(url, timeoutMs = 5000) {
    if (!this.isOnline) {
      throw new Error('Application is offline');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Shopper - Electron App - Version 1.0 - https://github.com/dragan/shopper',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      // Check if this error is related to network connection drop
      const isNetworkError =
        error.name === 'AbortError' ||
        error.message.includes('fetch failed') ||
        error.message.includes('ENOTFOUND') ||
        error.message.includes('ETIMEDOUT') ||
        error.message.includes('EAI_AGAIN');

      if (isNetworkError) {
        log.warn(`OpenFoodFactsService: API call failed due to network error. Marking OFFLINE.`);
        this.setOnlineStatus(false);
      }

      if (error.name === 'AbortError') {
        throw new Error(`Request timed out after ${timeoutMs}ms`);
      }
      throw error;
    }
  }

  /**
   * Search for a product on OpenFoodFacts by barcode.
   * @param {string} barcode - The product barcode.
   * @returns {Promise<{found: boolean, barcode?: string, name?: string, image_url?: string|null, error?: string}>}
   */
  async searchByBarcode(barcode) {
    if (!this.isOnline) {
      return { found: false, error: 'Offline' };
    }

    try {
      log.info(`OpenFoodFactsService: Searching barcode ${barcode}`);
      const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=code,product_name,product_name_fr,image_front_url,image_url`;
      const data = await this._request(url);

      if (data.status === 1 && data.product) {
        const prod = data.product;
        return {
          found: true,
          barcode: data.code,
          name: prod.product_name_fr || prod.product_name || '',
          image_url: prod.image_front_url || prod.image_url || null,
        };
      }
      return { found: false };
    } catch (error) {
      log.error('OpenFoodFactsService error in searchByBarcode:', error);
      return { found: false, error: error.message };
    }
  }

  /**
   * Search for products on OpenFoodFacts by name.
   * @param {string} query - The search query.
   * @returns {Promise<Array<{barcode: string, name: string, image_url: string|null}>>}
   */
  async searchByName(query) {
    if (!this.isOnline) {
      return [];
    }

    try {
      log.info(`OpenFoodFactsService: Searching name query: "${query}"`);
      const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&countries_tags=france&page_size=10&action=process&json=1&fields=code,product_name,product_name_fr,image_front_url,image_url`;
      const data = await this._request(url);

      if (data.products && Array.isArray(data.products)) {
        return data.products.map((prod) => ({
          barcode: prod.code,
          name: prod.product_name_fr || prod.product_name || '',
          image_url: prod.image_front_url || prod.image_url || null,
        }));
      }
      return [];
    } catch (error) {
      log.error('OpenFoodFactsService error in searchByName:', error);
      return [];
    }
  }
}

module.exports = new OpenFoodFactsService();
