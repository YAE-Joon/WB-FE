import { defineStore } from 'pinia'
import axios from 'axios'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: null,
    user: null,
    loading: false,
    error: null,
  }),
  actions: {
    async login(username, password) {
      this.loading = true
      this.error = null
      try {
        const formData = new FormData()
        formData.append('username', username)
        formData.append('password', password)
        
        const response = await axios.post('http://172.190.167.214:8000/api/v1/auth/login', formData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
        
        this.token = response.data.access_token || response.data.token
        this.user = response.data.user
        
        console.log('🔍 로그인 응답 전체:', response.data)
        console.log('🔍 User 객체:', this.user)
        
        // 로컬 스토리지에 토큰 저장
        localStorage.setItem('token', this.token)
        
        // axios 헤더에 토큰 설정
        axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`
        
      } catch (err) {
        console.error('로그인 에러:', err)
        this.error = '로그인 실패: 아이디나 비밀번호를 확인하세요.'
        if (err.response?.data?.detail) {
          this.error = err.response.data.detail
        }
      } finally {
        this.loading = false
      }
    },
    
    logout() {
      this.token = null
      this.user = null
      this.error = null
      localStorage.removeItem('token')
      delete axios.defaults.headers.common['Authorization']
    },
    
    // 앱 시작시 토큰 복원
    initializeAuth() {
      const token = localStorage.getItem('token')
      if (token) {
        this.token = token
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
      }
    }
  },
})