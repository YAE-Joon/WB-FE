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
        
        const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/auth/login`, formData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        })
        
        this.token = response.data.access_token || response.data.token
        // Token 스키마에는 user 정보가 없으므로 로그인한 username 사용
        this.user = { id: username }
        
        console.log('🔍 로그인 응답 전체:', response.data)
        console.log('🔍 설정된 User 객체:', this.user)
        
        // 로컬 스토리지에 토큰과 사용자명 저장
        localStorage.setItem('token', this.token)
        if (this.user?.id) {
          localStorage.setItem('username', this.user.id)
        }
        
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
      localStorage.removeItem('username')
      delete axios.defaults.headers.common['Authorization']
    },
    
    // 앱 시작시 토큰 복원
    initializeAuth() {
      const token = localStorage.getItem('token')
      const username = localStorage.getItem('username')
      if (token) {
        this.token = token
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
        if (username) {
          this.user = { id: username }
        }
      }
    }
  },
})