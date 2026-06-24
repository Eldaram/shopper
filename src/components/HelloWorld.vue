<template>
  <div class="hello">
    <div class="logo-container">
      <span class="logo electron-logo">⚛️</span>
      <span class="logo-plus">+</span>
      <span class="logo vue-logo">💚</span>
    </div>
    <h1 class="gradient-text">{{ msg }}</h1>
    <p class="subtitle">A premium foundation scaffolded with Electron, Vue 3, Vite, and Vitest.</p>

    <div class="card-action">
      <button id="counter-btn" @click="count++">Clicks: {{ count }}</button>
    </div>

    <div class="features">
      <div class="feature-item">
        <span class="feature-icon">⚡</span>
        <h3>Vite Dev</h3>
        <p>Ultra-fast HMR and server starts.</p>
      </div>
      <div class="feature-item">
        <span class="feature-icon">🛡️</span>
        <h3>Main & Preload</h3>
        <p>Configured with secure IPC context isolation.</p>
        <button class="ping-btn" @click="pingBridge" :disabled="pinging">
          {{ pingStatus || 'Test Security Bridge' }}
        </button>
      </div>
      <div class="feature-item">
        <span class="feature-icon">🧪</span>
        <h3>Vitest</h3>
        <p>Integrated unit tests for Main & Renderer.</p>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HelloWorld',
  props: {
    msg: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      count: 0,
      pingStatus: '',
      pinging: false,
    };
  },
  methods: {
    async pingBridge() {
      this.pinging = true;
      this.pingStatus = 'Pinging...';
      try {
        if (window.electronAPI && window.electronAPI.ping) {
          const response = await window.electronAPI.ping();
          this.pingStatus = `Bridge Response: ${response}`;
        } else {
          this.pingStatus = 'No Bridge detected (Web Mode)';
        }
      } catch (err) {
        this.pingStatus = 'Bridge Error';
        console.error(err);
      } finally {
        this.pinging = false;
      }
    },
  },
};
</script>

<style scoped>
.logo-container {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 15px;
  margin-bottom: 24px;
}

.logo {
  font-size: 48px;
  filter: drop-shadow(0 0 10px rgba(99, 102, 241, 0.4));
  animation: float 4s ease-in-out infinite;
  user-select: none;
}

.vue-logo {
  animation-delay: 2s;
  filter: drop-shadow(0 0 10px rgba(66, 185, 131, 0.4));
}

.logo-plus {
  font-size: 24px;
  color: var(--text-secondary);
  font-weight: 600;
}

h1 {
  font-size: 36px;
  font-weight: 800;
  letter-spacing: -0.5px;
  margin-bottom: 12px;
}

.subtitle {
  color: var(--text-secondary);
  font-size: 16px;
  margin-bottom: 32px;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.card-action {
  margin-bottom: 40px;
}

.features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 20px;
  text-align: left;
}

.feature-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px;
  transition: all 0.3s ease;
}

.feature-item:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(99, 102, 241, 0.2);
  transform: translateY(-2px);
}

.feature-icon {
  font-size: 24px;
  margin-bottom: 12px;
  display: block;
}

.feature-item h3 {
  font-size: 16px;
  font-weight: 700;
  margin-bottom: 8px;
}

.feature-item p {
  font-size: 13px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.ping-btn {
  margin-top: 12px;
  background: rgba(99, 102, 241, 0.2);
  border: 1px solid rgba(99, 102, 241, 0.4);
  color: #fff;
  padding: 6px 12px;
  border-radius: 8px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.ping-btn:hover:not(:disabled) {
  background: rgba(99, 102, 241, 0.4);
  border-color: rgba(99, 102, 241, 0.6);
}

.ping-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@keyframes float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-8px);
  }
}

@media (max-width: 640px) {
  .features {
    grid-template-columns: 1fr;
  }
}
</style>
