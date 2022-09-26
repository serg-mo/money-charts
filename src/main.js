import { createApp } from 'vue'
import { createStore } from 'vuex'
import App from './App.vue'
import router from './router'
import VuePapaParse from 'vue-papa-parse'

import './assets/base.css'

const store = createStore({
  state () {
    return {
      transactions: []
    }
  },
  mutations: {
    setTransactions (state, transactions) {
      state.transactions = transactions
    }
  }
})

const app = createApp(App)

app.use(router)
app.use(store)
app.use(VuePapaParse)

app.mount('#app')
