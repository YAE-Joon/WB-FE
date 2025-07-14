<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-header">
        <div class="logo">
          <h1>손수레</h1>
          <p>작업 관리 시스템</p>
        </div>
        <h2>로그인</h2>
        <p class="subtitle">계속하려면 로그인하세요</p>
      </div>
      
      <form @submit.prevent="onSubmit" class="login-form">
        <div class="form-group">
          <label for="username">아이디</label>
          <div class="input-wrapper">
            <input 
              id="username" 
              v-model="username" 
              type="text"
              placeholder="아이디를 입력하세요"
              required 
              class="form-input"
              :class="{ 'error': auth.error }"
            />
            <span class="input-icon">👤</span>
          </div>
        </div>
        
        <div class="form-group">
          <label for="password">비밀번호</label>
          <div class="input-wrapper">
            <input 
              id="password" 
              v-model="password" 
              type="password"
              placeholder="비밀번호를 입력하세요"
              required 
              class="form-input"
              :class="{ 'error': auth.error }"
            />
            <span class="input-icon">🔒</span>
          </div>
        </div>
        
        <button 
          type="submit" 
          class="login-button"
          :disabled="auth.loading"
          :class="{ 'loading': auth.loading }"
        >
          <span v-if="auth.loading" class="spinner"></span>
          <span v-else>로그인</span>
        </button>
        
        <div v-if="auth.error" class="error-message">
          <span class="error-icon">⚠️</span>
          {{ auth.error }}
        </div>
      </form>
      
      <div class="login-footer">
        <p>© 2025 손수레. All rights reserved.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'

const auth = useAuthStore()
const router = useRouter()

const username = ref('')
const password = ref('')

const onSubmit = async () => {
  await auth.login(username.value, password.value)
  if (auth.token) {
    // 로그인 성공 시 이동할 페이지 (예: 대시보드)
    router.push('/dashboard')
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.login-container {
  background: white;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 400px;
  animation: slideUp 0.6s ease-out;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.login-header {
  text-align: center;
  margin-bottom: 30px;
}

.logo h1 {
  font-size: 2.5rem;
  font-weight: bold;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin: 0;
  letter-spacing: 2px;
}

.logo p {
  color: #666;
  font-size: 0.9rem;
  margin: 5px 0 30px 0;
  letter-spacing: 1px;
}

.login-header h2 {
  color: #333;
  font-size: 1.8rem;
  margin: 0 0 10px 0;
  font-weight: 600;
}

.subtitle {
  color: #666;
  font-size: 0.95rem;
  margin: 0;
}

.login-form {
  margin-bottom: 30px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  color: #333;
  font-weight: 500;
  font-size: 0.95rem;
}

.input-wrapper {
  position: relative;
}

.form-input {
  width: 100%;
  padding: 15px 50px 15px 15px;
  border: 2px solid #e1e5e9;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.3s ease;
  background: #f8f9fa;
  box-sizing: border-box;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-input.error {
  border-color: #ff6b6b;
  background: #fff5f5;
}

.input-icon {
  position: absolute;
  right: 15px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.2rem;
  opacity: 0.6;
}

.login-button {
  width: 100%;
  padding: 15px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: white;
  border: none;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.login-button:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 25px rgba(102, 126, 234, 0.3);
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.login-button.loading {
  padding-left: 50px;
}

.spinner {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top: 2px solid white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: translateY(-50%) rotate(0deg); }
  100% { transform: translateY(-50%) rotate(360deg); }
}

.error-message {
  background: #fff5f5;
  border: 1px solid #ffebee;
  border-radius: 8px;
  padding: 12px;
  margin-top: 15px;
  color: #d32f2f;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;
}

.error-icon {
  font-size: 1.1rem;
}

.login-footer {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid #e1e5e9;
}

.login-footer p {
  color: #666;
  font-size: 0.8rem;
  margin: 0;
}

/* 반응형 디자인 */
@media (max-width: 480px) {
  .login-container {
    padding: 30px 25px;
    margin: 0 10px;
  }
  
  .logo h1 {
    font-size: 2rem;
  }
  
  .login-header h2 {
    font-size: 1.5rem;
  }
}
</style>