<template>
  <div class="work-modal-overlay" @click="closeModal">
    <div class="work-modal" @click.stop>
      <div class="modal-header">
        <h3>{{ isEdit ? '작업 수정' : '새 작업 추가' }}</h3>
        <button @click="closeModal" class="close-btn">×</button>
      </div>
      
      <form @submit.prevent="saveWork" class="modal-form">
        <div class="form-group">
          <label for="title">제목 *</label>
          <input 
            type="text" 
            id="title"
            v-model="formData.title"
            required
            class="form-input"
            placeholder="작업 제목을 입력하세요"
          />
        </div>
        
        <div class="form-group">
          <label for="content">내용</label>
          <textarea 
            id="content"
            v-model="formData.content"
            class="form-textarea"
            rows="4"
            placeholder="작업에 대한 상세 설명을 입력하세요"
          ></textarea>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="category">카테고리</label>
            <select 
              id="category"
              v-model="formData.category_id"
              class="form-select"
            >
              <option value="">카테고리 선택</option>
              <option 
                v-for="category in categories" 
                :key="category.id" 
                :value="category.id"
              >
                {{ category.name }}
              </option>
            </select>
          </div>
          
          <div class="form-group">
            <label for="myjob">내 작업</label>
            <div class="checkbox-wrapper">
              <input 
                type="checkbox" 
                id="myjob"
                v-model="formData.myjob"
                class="form-checkbox"
              />
              <span class="checkbox-label">내가 담당하는 작업</span>
            </div>
          </div>
        </div>
        
        <div class="form-row">
          <div class="form-group">
            <label for="started_at">시작일 *</label>
            <input 
              type="date" 
              id="started_at"
              v-model="formData.started_at"
              required
              class="form-input"
            />
          </div>
          
          <div class="form-group">
            <label for="deadline">마감일</label>
            <input 
              type="date" 
              id="deadline"
              v-model="formData.deadline"
              class="form-input"
            />
          </div>
        </div>
        
        <div class="modal-actions">
          <button type="button" @click="closeModal" class="cancel-btn">
            취소
          </button>
          <button type="submit" class="save-btn" :disabled="loading">
            {{ loading ? '저장 중...' : (isEdit ? '수정' : '저장') }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const props = defineProps({
  work: {
    type: Object,
    default: null
  },
  categories: {
    type: Array,
    default: () => []
  },
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['close', 'save'])

const isEdit = computed(() => !!props.work)

const formData = ref({
  title: '',
  content: '',
  category_id: '',
  started_at: '',
  deadline: '',
  myjob: false
})

const resetForm = () => {
  if (props.work) {
    // 편집 모드
    formData.value = {
      title: props.work.title || '',
      content: props.work.content || '',
      category_id: props.work.category_id || '',
      started_at: props.work.started_at ? props.work.started_at.split('T')[0] : '',
      deadline: props.work.deadline ? props.work.deadline.split('T')[0] : '',
      myjob: props.work.myjob || false
    }
  } else {
    // 새 작업 모드
    const today = new Date().toISOString().split('T')[0]
    formData.value = {
      title: '',
      content: '',
      category_id: '',
      started_at: today,
      deadline: '',
      myjob: false
    }
  }
}

const closeModal = () => {
  emit('close')
}

const saveWork = () => {
  const workData = {
    ...formData.value,
    // 빈 문자열을 null로 변환
    category_id: formData.value.category_id || null,
    deadline: formData.value.deadline || null
  }
  
  if (isEdit.value) {
    emit('save', props.work.id, workData)
  } else {
    emit('save', workData)
  }
}

// props.work가 변경될 때 폼 리셋
watch(() => props.work, resetForm, { immediate: true, deep: true })
</script>

<style scoped>
.work-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.work-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e1e5e9;
}

.modal-header h3 {
  margin: 0;
  color: #333;
  font-size: 1.3rem;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.8rem;
  cursor: pointer;
  color: #666;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: #f0f0f0;
  color: #333;
}

.modal-form {
  padding: 2rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  background: white;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

.checkbox-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.form-checkbox {
  width: auto;
  margin: 0;
}

.checkbox-label {
  font-size: 0.9rem;
  color: #555;
  cursor: pointer;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #e1e5e9;
}

.cancel-btn,
.save-btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.cancel-btn {
  background: #f8f9fa;
  color: #666;
  border: 1px solid #ddd;
}

.cancel-btn:hover {
  background: #e9ecef;
  color: #333;
}

.save-btn {
  background: #667eea;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background: #5a6fd8;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(102, 126, 234, 0.3);
}

.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .work-modal {
    margin: 0.5rem;
    max-width: none;
  }
  
  .modal-header,
  .modal-form {
    padding: 1rem;
  }
  
  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }
  
  .modal-actions {
    flex-direction: column;
  }
  
  .cancel-btn,
  .save-btn {
    width: 100%;
  }
}
</style>
