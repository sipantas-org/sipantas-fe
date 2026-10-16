import { createPinia } from 'pinia'
import { createApp } from 'vue'
import './style.css'
import '@/lib/mode'
import App from './App.vue'
import router from './router'

const app = createApp(App)

app.use(createPinia())
app.use(router)

router.isReady().then(() => app.mount('#app'))
