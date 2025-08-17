import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import { useAuthStore } from './stores/auth'
import axios from 'axios'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// 앱 시작시 인증 상태 초기화
const authStore = useAuthStore()
authStore.initializeAuth()

// axios 인터셉터 설정 - 모든 요청에 토큰 자동 추가
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 응답 인터셉터 - 401 에러 시 로그아웃 처리
axios.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      authStore.logout()
      router.push('/')
    }
    return Promise.reject(error)
  }
)

app.mount('#app')