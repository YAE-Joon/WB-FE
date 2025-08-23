// API 설정
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

export const apiConfig = {
  baseURL: API_BASE_URL,
  
  // API 엔드포인트들
  endpoints: {
    // 카테고리/프로젝트 관련
    categories: '/category/categories',
    createCategory: '/category/',
    updateCategory: (id) => `/category/category/${id}`,
    deleteCategory: (id) => `/category/delete/${id}`,
    
    // 업무 관련
    works: '/work/',
    createWork: '/work/',
    updateWork: (id) => `/work/${id}`,
    deleteWork: (id) => `/work/${id}`,
    weekendWorks: '/work/weekend',
    
    // 인증 관련
    login: '/auth/login',
    logout: '/auth/logout',
    profile: '/auth/profile'
  }
}

export default apiConfig