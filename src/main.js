import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { registerServiceWorker } from './registerServiceWorker'

// Register the service worker for PWA support
registerServiceWorker()

createApp(App).mount('#app')
