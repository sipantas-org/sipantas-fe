import { createPinia } from 'pinia'
import { createApp } from 'vue'
import './style.css'
import '@/lib/mode'
import App from './App.vue'
import { setTokenGetter, setUnauthorizedHandler } from '@/lib/http'
import router from './router'
import { useAuthStore } from '@/stores/auth'

const app = createApp(App)

const pinia = createPinia()

app.use(pinia)
// Lets http.ts read the session token without importing the store.
setTokenGetter(() => useAuthStore(pinia).token)
// Expired token: clear the session and return to the login page.
setUnauthorizedHandler(() => {
  const auth = useAuthStore(pinia)
  // Several requests can fail together; only the first one logs out.
  if (!auth.token)
    return
  const role = auth.role ?? 'admin'
  auth.logout()
  router.push({ name: 'login', params: { role }, query: { expired: '1' } })
})
app.use(router)

router.isReady().then(() => app.mount('#app'))
