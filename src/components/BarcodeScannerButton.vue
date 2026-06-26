<template>
  <div class="barcode-scanner-container" v-click-outside="closeModal">
    <!-- Scanner Toggle Button -->
    <button
      class="barcode-scanner-btn"
      :class="{ connected: isConnected }"
      @click="handleButtonClick"
      :title="$t('barcode_scanner_tooltip') || 'Barcode Scanner'"
    >
      <span v-if="isConnected" class="scanner-btn-icon close-icon">✕</span>
      <span v-else class="scanner-btn-icon">
        <svg
          class="barcode-svg-icon"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          width="18"
          height="18"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
          <line x1="7" y1="7" x2="7.01" y2="7" stroke-width="2" />
          <line x1="17" y1="7" x2="17.01" y2="7" stroke-width="2" />
          <line x1="7" y1="17" x2="7.01" y2="17" stroke-width="2" />
          <line x1="17" y1="17" x2="17.01" y2="17" stroke-width="2" />
        </svg>
      </span>
    </button>

    <!-- QR Code Large Display Modal -->
    <transition name="fade">
      <div v-if="isModalOpen" class="scanner-modal-overlay" @click.self="closeModal">
        <div class="scanner-modal-card">
          <button class="scanner-modal-close-btn" @click="closeModal">✕</button>

          <h3 class="scanner-modal-title">
            {{ $t('barcode_scanner_modal_title') || 'Barcode Scanner Connection' }}
          </h3>

          <p class="scanner-modal-desc">
            {{
              $t('barcode_scanner_modal_desc') ||
              'Scan this QR code with the Android app to connect your phone as a barcode scanner.'
            }}
          </p>

          <div class="scanner-qr-container">
            <img v-if="qrCodeDataUri" :src="qrCodeDataUri" class="scanner-qr-image" alt="QR Code" />
            <div v-else class="scanner-qr-placeholder">
              <span class="spinner"></span>
              Generating QR Code...
            </div>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  name: 'BarcodeScannerButton',
  data() {
    return {
      isConnected: false,
      isModalOpen: false,
      qrCodeDataUri: null,
    };
  },
  async mounted() {
    // Escape key closes the modal
    window.addEventListener('keydown', this.handleKeyDown);

    if (window.electronAPI) {
      // Load initial state
      if (typeof window.electronAPI.getSocketStatus === 'function') {
        try {
          const status = await window.electronAPI.getSocketStatus();
          this.isConnected = !!status.connected;
        } catch (err) {
          console.error('Failed to get initial socket status:', err);
        }
      }

      if (typeof window.electronAPI.getQRCode === 'function') {
        try {
          this.qrCodeDataUri = await window.electronAPI.getQRCode();
        } catch (err) {
          console.error('Failed to get initial QR code:', err);
        }
      }

      // Listen for socket events pushed from main process
      if (typeof window.electronAPI.onSocketStatusChanged === 'function') {
        window.electronAPI.onSocketStatusChanged((status) => {
          this.isConnected = !!status.connected;
          if (this.isConnected) {
            // Automatically close the QR code modal when client connects
            this.isModalOpen = false;
          }
        });
      }

      if (typeof window.electronAPI.onQRCodeGenerated === 'function') {
        window.electronAPI.onQRCodeGenerated((uri) => {
          this.qrCodeDataUri = uri;
        });
      }
    }
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.handleKeyDown);
  },
  methods: {
    handleButtonClick() {
      if (this.isConnected) {
        // Connected: Click acts as a close/disconnect action
        this.disconnectSocket();
      } else {
        // Disconnected: Toggle QR Code modal display
        this.isModalOpen = !this.isModalOpen;
      }
    },
    closeModal() {
      this.isModalOpen = false;
    },
    async disconnectSocket() {
      if (window.electronAPI && typeof window.electronAPI.closeSocket === 'function') {
        try {
          await window.electronAPI.closeSocket();
          this.isConnected = false;
        } catch (err) {
          console.error('Failed to close socket:', err);
        }
      }
    },
    handleKeyDown(event) {
      if (event.key === 'Escape') {
        this.closeModal();
      }
    },
  },
  directives: {
    'click-outside': {
      beforeMount(el, binding) {
        el.clickOutsideEvent = (event) => {
          // Check if click was outside the element and not inside the modal card (since modal overlay is teleported/rendered within the container)
          if (!(el === event.target || el.contains(event.target))) {
            binding.value(event);
          }
        };
        document.body.addEventListener('click', el.clickOutsideEvent);
      },
      unmounted(el) {
        document.body.removeEventListener('click', el.clickOutsideEvent);
      },
    },
  },
};
</script>
