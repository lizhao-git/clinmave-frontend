import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'

// Vuetify
import 'vuetify/styles'
import { createVuetify } from 'vuetify'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

// VxeTable
import VxeUITable from 'vxe-table'
import 'vxe-table/lib/style.css'

// VXE-Table UI
import VxeUI from 'vxe-pc-ui';
import enUS from 'vxe-pc-ui/lib/language/en-US'
import 'vxe-pc-ui/lib/style.css';

// Set VXE-Table language to English
VxeUI.setI18n('en-US', enUS);
VxeUI.setLanguage('en-US')
VxeUI.getLanguage()

const vuetify = createVuetify({
  theme: {
    defaultTheme: 'light',
  },
  components,
  directives,
})

// Material Design Icons
import '@mdi/font/css/materialdesignicons.css'


const app = createApp(App)

app.use(router)
app.use(vuetify)
app.use(VxeUI)
app.use(VxeUITable)

app.mount('#app')
