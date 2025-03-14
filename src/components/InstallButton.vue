<template>
  <button v-if="showInstallButton" @click="installApp" class="install-button">
    Install App 
    <svg xmlns="http://www.w3.org/2000/svg" class="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  </button>
</template>

<script>
export default {
  name: 'InstallButton',
  data() {
    return {
      deferredPrompt: null,
      showInstallButton: false
    }
  },
  mounted() {
    // Listen for the beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      
      // Store the event so it can be triggered later
      this.deferredPrompt = e;
      
      // Show the install button
      this.showInstallButton = true;
      
      console.log('App can be installed! Button displayed.');
    });
    
    // Hide the button if the app is already installed
    window.addEventListener('appinstalled', () => {
      console.log('App installed successfully');
      this.showInstallButton = false;
      this.deferredPrompt = null;
    });
  },
  methods: {
    async installApp() {
      if (!this.deferredPrompt) {
        console.log('No installation prompt available');
        return;
      }
      
      // Show the installation prompt
      this.deferredPrompt.prompt();
      
      // Wait for the user to respond to the prompt
      const { outcome } = await this.deferredPrompt.userChoice;
      console.log(`User response to the install prompt: ${outcome}`);
      
      // We no longer need the prompt regardless of outcome
      this.deferredPrompt = null;
      this.showInstallButton = false;
    }
  }
}
</script>

<style scoped>
.install-button {
  display: flex;
  align-items: center;
  padding: 10px 18px;
  background: #6366f1;
  color: #ffffff;
  border: none;
  border-radius: 8px;
  font-family: 'Poppins', sans-serif;
  font-weight: 500;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  margin-left: 8px;
}

.install-button:hover {
  background: #4f46e5;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.icon {
  width: 18px;
  height: 18px;
  margin-left: 8px;
}
</style> 