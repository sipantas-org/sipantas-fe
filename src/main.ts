import { createPinia } from 'pinia'
import { createApp } from 'vue'
import './style.css'
import '@/lib/mode'
import App from './App.vue'
import { setTokenGetter } from '@/lib/http'
import router from './router'
import { useAuthStore } from '@/stores/auth'

const app = createApp(App)

const pinia = createPinia()

app.use(pinia)
// Lets http.ts read the session token without importing the store.
setTokenGetter(() => useAuthStore(pinia).token)
app.use(router)

router.isReady().then(() => app.mount('#app'))
