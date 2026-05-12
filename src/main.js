import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import './assets/styles/font.css'
import './assets/styles/base.css'
import './assets/styles/commonLayout.css'
import './assets/styles/layout.css'

const app = createApp(App)

app.use(router)

app.mount('#app')
