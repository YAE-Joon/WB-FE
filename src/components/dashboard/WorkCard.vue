<template>
  <div class="work-card" :class="{ 'my-work': work.myjob }">
    <div class="work-header">
      <h4 class="work-title">{{ work.title }}</h4>
      <div class="work-actions">
        <button @click="$emit('edit-work', work)" class="edit-btn" title="편집">
          ✏️
        </button>
        <button @click="$emit('delete-work', work.id)" class="delete-btn" title="삭제">
          🗑️
        </button>
      </div>
    </div>
    
    <div class="work-content">
      <p v-if="work.content" class="work-description">{{ work.content }}</p>
      
      <div class="work-meta">g
        <div class="work-dates">
          <span class="date-label">시작:</span>
          <span class="date-value">{{ formatDate(work.started_at) }}</span>
          <span v-if="work.deadline" class="date-label">마감:</span>
          <span v-if="work.deadline" class="date-value" :class="{ 'overdue': isOverdue }">
            {{ formatDate(work.deadline) }}
          </span>
        </div>
        
        <div class="work-category" v-if="categoryName">
          <span class="category-tag">{{ categoryName }}</span>
        </div>
      </div>
      
      <div class="work-state">
        <select 
          v-model="currentStateId" 
          @change="updateState"
          class="state-select"
          :disabled="updating"
        >
          <option value="">상태 선택</option>
          <option 
            v-for="state in states" 
            :key="state.id" 
            :value="state.id"
          >
            {{ state.state_name }}
          </option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  work: {
    type: Object,
    required: true
  },
  categories: {
    type: Array,
    default: () => []
  },
  states: {
    type: Array,
    default: () => []
  }
})

const emit = defineEmits(['edit-work', 'delete-work', 'state-changed'])

const updating = ref(false)
const currentStateId = ref(props.work.current_state?.id || '')

const categoryName = computed(() => {
  if (!props.work.category_id) return null
  const category = props.categories.find(c => c.id === props.work.category_id)
  return category?.name || null
})

const isOverdue = computed(() => {
  if (!props.work.deadline) return false
  return new Date(props.work.deadline) < new Date()
})

const formatDate = (dateString) => {
  const date = new Date(dateString)
  return date.toLocaleDateString('ko-KR', {
    month: 'short',
    day: 'numeric'
  })
}

const updateState = async () => {
  if (!currentStateId.value) return
  
  updating.value = true
  try {
    await emit('state-changed', props.work.id, currentStateId.value)
  } catch (error) {
    console.error('상태 변경 실패:', error)
  } finally {
    updating.value = false
  }
}

// props.work가 변경될 때 currentStateId 업데이트
watch(() => props.work.current_state, (newState) => {
  currentStateId.value = newState?.id || ''
}, { immediate: true })
</script>

<style scoped>
.work-card {
  background: white;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 0.75rem;
  border-left: 4px solid #e1e5e9;
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
  transition: all 0.2s;
}

.work-card:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  transform: translateY(-1px);
}

.work-card.my-work {
  border-left-color: #667eea;
  background: linear-gradient(135deg, #f8f9ff 0%, white 100%);
}

.work-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}

.work-title {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #333;
  line-height: 1.3;
  flex: 1;
}

.work-actions {
  display: flex;
  gap: 0.25rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.work-card:hover .work-actions {
  opacity: 1;
}

.edit-btn, .delete-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: background 0.2s;
}

.edit-btn:hover {
  background: #f0f4ff;
}

.delete-btn:hover {
  background: #ffe8e8;
}

.work-content {
  font-size: 0.9rem;
}

.work-description {
  color: #666;
  margin: 0 0 0.75rem 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.work-meta {
  margin-bottom: 0.75rem;
}

.work-dates {
  margin-bottom: 0.5rem;
}

.date-label {
  font-size: 0.8rem;
  color: #888;
  margin-right: 0.25rem;
}

.date-value {
  font-size: 0.8rem;
  color: #555;
  margin-right: 0.75rem;
  font-weight: 500;
}

.date-value.overdue {
  color: #ff6b6b;
  font-weight: 600;
}

.work-category {
  margin-bottom: 0.5rem;
}

.category-tag {
  background: #e3f2fd;
  color: #1976d2;
  padding: 0.2rem 0.5rem;
  border-radius: 12px;
  font-size: 0.7rem;
  font-weight: 500;
}

.work-state {
  margin-top: 0.5rem;
}

.state-select {
  width: 100%;
  padding: 0.4rem 0.6rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 0.8rem;
  background: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.state-select:focus {
  outline: none;
  border-color: #667eea;
}

.state-select:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
