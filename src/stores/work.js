import { defineStore } from 'pinia'
import axios from 'axios'

export const useWorkStore = defineStore('work', {
  state: () => ({
    works: [],
    categories: [],
    states: [],
    currentWork: null,
    loading: false,
    error: null,
  }),

  getters: {
    worksByDate: (state) => (date) => {
      return state.works.filter(work => {
        const startDate = new Date(work.started_at)
        const endDate = work.deadline ? new Date(work.deadline) : null
        const targetDate = new Date(date)
        
        if (endDate) {
          return targetDate >= startDate && targetDate <= endDate
        } else {
          return targetDate >= startDate
        }
      })
    },

    worksByCategory: (state) => {
      const grouped = {}
      state.works.forEach(work => {
        const categoryId = work.category_id || 'uncategorized'
        if (!grouped[categoryId]) {
          grouped[categoryId] = []
        }
        grouped[categoryId].push(work)
      })
      return grouped
    },

    myWorks: (state) => {
      return state.works.filter(work => work.myjob === true)
    },

    worksByDateRange: (state) => (startDate, endDate) => {
      return state.works.filter(work => {
        const workStart = new Date(work.started_at)
        const workEnd = work.deadline ? new Date(work.deadline) : workStart
        const rangeStart = new Date(startDate)
        const rangeEnd = new Date(endDate)
        
        return (workStart <= rangeEnd && workEnd >= rangeStart)
      })
    }
  },

  actions: {
    async fetchWorks() {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get('http://localhost:8000/api/v1/works')
        this.works = response.data
      } catch (err) {
        this.error = '작업 목록을 불러오는데 실패했습니다.'
        console.error('Works fetch error:', err)
      } finally {
        this.loading = false
      }
    },

    async fetchCategories() {
      try {
        const response = await axios.get('http://localhost:8000/api/v1/categories')
        this.categories = response.data
      } catch (err) {
        console.error('Categories fetch error:', err)
      }
    },

    async fetchStates() {
      try {
        const response = await axios.get('http://localhost:8000/api/v1/states')
        this.states = response.data
      } catch (err) {
        console.error('States fetch error:', err)
      }
    },

    async createWork(workData) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.post('http://localhost:8000/api/v1/works', workData)
        this.works.push(response.data)
        return response.data
      } catch (err) {
        this.error = '작업 생성에 실패했습니다.'
        console.error('Create work error:', err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateWork(workId, workData) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.put(`http://localhost:8000/api/v1/works/${workId}`, workData)
        const index = this.works.findIndex(w => w.id === workId)
        if (index !== -1) {
          this.works[index] = response.data
        }
        return response.data
      } catch (err) {
        this.error = '작업 수정에 실패했습니다.'
        console.error('Update work error:', err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async deleteWork(workId) {
      this.loading = true
      this.error = null
      try {
        await axios.delete(`http://localhost:8000/api/v1/works/${workId}`)
        this.works = this.works.filter(w => w.id !== workId)
      } catch (err) {
        this.error = '작업 삭제에 실패했습니다.'
        console.error('Delete work error:', err)
        throw err
      } finally {
        this.loading = false
      }
    },

    async updateWorkState(workId, stateId) {
      try {
        const response = await axios.post(`http://localhost:8000/api/v1/works/${workId}/state`, {
          state_id: stateId
        })
        
        // 로컬 상태 업데이트
        const workIndex = this.works.findIndex(w => w.id === workId)
        if (workIndex !== -1) {
          this.works[workIndex].current_state = response.data
        }
        
        return response.data
      } catch (err) {
        this.error = '작업 상태 변경에 실패했습니다.'
        console.error('Update work state error:', err)
        throw err
      }
    },

    setCurrentWork(work) {
      this.currentWork = work
    },

    clearError() {
      this.error = null
    }
  }
})
